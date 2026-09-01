import { execFile } from "node:child_process";
import { access, mkdir, readFile, rename, rm, symlink, writeFile } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { normalizeMr, summarizeMrs } from "./lib.js";

const exec = promisify(execFile);
const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..");
const configPath = path.resolve(repoRoot, process.env.FACILITATOR_CONFIG ?? "facilitator/participants.json");
const cloneRoot = path.resolve(repoRoot, ".workshop/forks");
const verificationPath = path.resolve(repoRoot, ".workshop/verification.json");
const children = new Map();
const state = { startedAt: new Date().toISOString(), lastRefresh: null, participants: [], error: null, simulationTick: 0 };
const sizePoints = { S: 1, M: 2, L: 3 };
const ticketMeta = await loadTicketMeta();
const ticketPoints = Object.fromEntries(Object.entries(ticketMeta).map(([key, value]) => [key, value.points]));
const verificationStore = await loadVerificationStore();
const verificationQueue = [];
const queuedVerificationKeys = new Set();
let activeVerifications = 0;
let verificationSave = Promise.resolve();

async function loadTicketMeta() {
  const tickets = await readFile(path.join(repoRoot, "workshop", "TICKETS.md"), "utf8");
  const meta = {};
  let openAI = false;
  for (const line of tickets.split("\n")) {
    if (line === "### Security foundations") openAI = false;
    if (line === "### OpenAI API extensions") openAI = true;
    const match = line.match(/^### (CV-\d{3}).*· ([SML])$/);
    if (match) meta[match[1]] = { size: match[2], points: sizePoints[match[2]], openAI };
  }
  return meta;
}

async function exists(file) {
  try { await access(file); return true; } catch { return false; }
}

async function loadConfig() {
  try {
    return JSON.parse(await readFile(configPath, "utf8"));
  } catch (error) {
    throw new Error(`Could not read ${path.relative(repoRoot, configPath)}. Copy facilitator/participants.example.json to facilitator/participants.json and edit it. ${error.message}`);
  }
}

async function loadVerificationStore() {
  try {
    const stored = JSON.parse(await readFile(verificationPath, "utf8"));
    return { version: 1, records: stored.records ?? {} };
  } catch {
    return { version: 1, records: {} };
  }
}

async function saveVerificationStore() {
  const snapshot = JSON.stringify(verificationStore, null, 2);
  const tempPath = `${verificationPath}.${process.pid}.${Date.now()}.tmp`;
  verificationSave = verificationSave.then(async () => {
    await mkdir(path.dirname(verificationPath), { recursive: true });
    await writeFile(tempPath, snapshot);
    await rename(tempPath, verificationPath);
  });
  return verificationSave;
}

function cleanId(value) {
  if (!/^[a-z0-9_-]+$/i.test(value)) throw new Error(`Invalid participant id: ${value}`);
  return value;
}

async function git(args, cwd) {
  const result = await exec("git", args, { cwd, maxBuffer: 1024 * 1024 * 4 });
  return result.stdout.trim();
}

async function githubPage(apiPath) {
  if (!process.env.GITHUB_TOKEN) {
    try {
      const result = await exec("gh", ["api", apiPath], { cwd: repoRoot, maxBuffer: 1024 * 1024 * 8 });
      return JSON.parse(result.stdout);
    } catch {
      // Fall through to the public API when gh is unavailable or unauthenticated.
    }
  }
  const headers = { Accept: "application/vnd.github+json", "User-Agent": "civic-voice-facilitator" };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const response = await fetch(`https://api.github.com${apiPath}`, { headers });
  if (!response.ok) throw new Error(`GitHub API returned ${response.status}`);
  return response.json();
}

async function githubList(apiPath) {
  const items = [];
  for (let page = 1; page <= 20; page += 1) {
    const separator = apiPath.includes("?") ? "&" : "?";
    const batch = await githubPage(`${apiPath}${separator}per_page=100&page=${page}`);
    if (!Array.isArray(batch)) throw new Error("GitHub API did not return a list");
    items.push(...batch);
    if (batch.length < 100) break;
  }
  return items;
}

async function discoverParticipants(config) {
  const configured = config.participants ?? [];
  if (!config.discoverForks || !config.baseRepo) return configured;
  const forks = await githubList(`/repos/${config.baseRepo}/forks?sort=newest`);
  const configuredForks = new Set(configured.map((participant) => participant.forkRepo));
  const discovered = forks
    .filter((fork) => !configuredForks.has(fork.full_name))
    .map((fork) => ({
      id: cleanId(fork.owner.login.toLowerCase()),
      name: fork.owner.login,
      forkRepo: fork.full_name,
      branch: fork.default_branch ?? "main",
      trusted: false,
      discovered: true,
    }));
  return [...configured, ...discovered];
}

async function ensureClone(participant) {
  const id = cleanId(participant.id);
  if (participant.directLocalRepo) {
    const target = path.resolve(repoRoot, participant.directLocalRepo);
    return { target, sha: await git(["rev-parse", "--short", "HEAD"], target) };
  }
  const target = path.join(cloneRoot, id);
  const branch = participant.branch ?? "main";
  const source = participant.localRepo
    ? path.resolve(repoRoot, participant.localRepo)
    : `https://github.com/${participant.forkRepo}.git`;
  await mkdir(cloneRoot, { recursive: true });

  if (!(await exists(path.join(target, ".git")))) {
    await git(["clone", "--branch", branch, "--single-branch", source, target], repoRoot);
  } else {
    // Preview clones are disposable. If a participant commits the shared
    // node_modules symlink, remove only our previously generated untracked
    // dependency link so the incoming tracked path can be checked out.
    const dependencyStatus = await git(["status", "--porcelain", "--", "node_modules"], target);
    if (dependencyStatus.startsWith("?? node_modules")) {
      await rm(path.join(target, "node_modules"), { recursive: true, force: true });
    }
    await git(["fetch", "origin", branch], target);
    await git(["checkout", branch], target);
    await git(["pull", "--ff-only", "origin", branch], target);
  }
  return { target, sha: await git(["rev-parse", "--short", "HEAD"], target) };
}

async function fetchMrs(config, participant) {
  if (participant.mrs) {
    const visibleMrs = config.simulation?.enabled
      ? participant.mrs
        .filter((mr) => state.simulationTick >= (mr.startTick ?? 1))
        .map((mr) => ({
          ...mr,
          simulationStatus: state.simulationTick >= (mr.mergeTick ?? Number.POSITIVE_INFINITY)
            ? "merged"
            : state.simulationTick === (mr.startTick ?? 1)
              ? "draft"
              : "open",
        }))
      : participant.mrs;
    return visibleMrs.map((mr) => {
      const normalized = normalizeMr(mr);
      normalized.points = normalized.ticket ? ticketMeta[normalized.ticket.key]?.points ?? 1 : 0;
      normalized.size = normalized.ticket ? ticketMeta[normalized.ticket.key]?.size ?? "S" : null;
      normalized.openAI = normalized.ticket ? Boolean(ticketMeta[normalized.ticket.key]?.openAI) : false;
      return normalized;
    });
  }
  if (!config.baseRepo || !participant.forkRepo) return [];
  const basePulls = (config.pullCache ?? await githubList(`/repos/${config.baseRepo}/pulls?state=all`))
    .filter((pull) => pull.head?.repo?.full_name === participant.forkRepo)
    .map((pull) => ({ pull, sourceRepo: config.baseRepo }));
  const forkPulls = config.readForkPulls
    ? (config.forkPullCache?.get(participant.forkRepo) ?? await githubList(`/repos/${participant.forkRepo}/pulls?state=all`))
      .map((pull) => ({ pull, sourceRepo: participant.forkRepo }))
    : [];
  const uniquePulls = [...forkPulls, ...basePulls].filter((entry, index, all) => {
    const key = entry.pull.head?.sha ?? entry.pull.html_url ?? `${entry.sourceRepo}#${entry.pull.number}`;
    return all.findIndex((candidate) => (candidate.pull.head?.sha ?? candidate.pull.html_url ?? `${candidate.sourceRepo}#${candidate.pull.number}`) === key) === index;
  });
  return uniquePulls
    .map(({ pull, sourceRepo }) => {
      const normalized = normalizeMr(pull);
      normalized.points = normalized.ticket ? ticketMeta[normalized.ticket.key]?.points ?? 1 : 0;
      normalized.size = normalized.ticket ? ticketMeta[normalized.ticket.key]?.size ?? "S" : null;
      normalized.openAI = normalized.ticket ? Boolean(ticketMeta[normalized.ticket.key]?.openAI) : false;
      normalized.sourceRepo = sourceRepo;
      return normalized;
    });
}

async function applyForkMainMerges(target, participant, mrs) {
  const mainBranch = participant.branch ?? "main";
  await Promise.all(mrs.map(async (mr) => {
    if (mr.status === "merged" || !mr.headSha) return;
    try {
      await git(["merge-base", "--is-ancestor", mr.headSha, mainBranch], target);
      mr.status = "merged";
      mr.mergedIntoFork = true;
    } catch {
      // A non-zero result means this ticket commit is not in the fork's main.
    }
  }));
  return mrs;
}

function verificationKey(participant, mr) {
  return `${participant.forkRepo}#${mr.ticket?.key ?? "unknown"}#${mr.headSha ?? "no-sha"}`;
}

function applyVerificationState(participant, mrs) {
  for (const mr of mrs) {
    if (!mr.ticket || !mr.headSha) continue;
    const key = verificationKey(participant, mr);
    const record = verificationStore.records[key];
    mr.agentVerification = record ?? null;
    mr.agentVerified = Boolean(record?.status === "complete" && record.verified);
    mr.agentVerificationPending = queuedVerificationKeys.has(key);
  }
}

function queueAgentVerifications(config, participant, mrs) {
  if (!config.agentVerification?.enabled || participant.mrs) return;
  for (const mr of mrs) {
    if (!mr.ticket || !mr.headSha || !mr.sourceRepo || !Number.isFinite(Number(mr.id))) continue;
    const key = verificationKey(participant, mr);
    const record = verificationStore.records[key];
    if (record?.status === "complete" || queuedVerificationKeys.has(key)) continue;
    queuedVerificationKeys.add(key);
    verificationQueue.push({ key, config, participant, mr });
  }
  void pumpAgentVerifications(config);
}

async function runAgentVerification({ key, config, participant, mr }) {
  const files = await githubList(`/repos/${mr.sourceRepo}/pulls/${mr.id}/files`);
  const patch = files
    .map((file) => `--- ${file.filename}\n${file.patch ?? "(binary or oversized patch omitted)"}`)
    .join("\n\n")
    .slice(0, 50000);
  const prompt = `You are a read-only workshop code verifier. Do not modify files and do not run commands. Review one participant MR against the matching ticket in workshop/TICKETS.md. Decide whether the patch appears to satisfy the ticket's Done checks without unrelated regressions.\n\nParticipant: ${participant.name}\nFork: ${participant.forkRepo}\nMR repository: ${mr.sourceRepo}\nTicket: ${mr.ticket.key}\nMR title: ${mr.title}\nBranch: ${mr.branch}\nHead SHA: ${mr.headSha}\n\nPatch:\n${patch}\n\nReply with exactly two lines:\nAGENT_VERIFIED: yes or no\nREASON: one concise sentence`;
  const child = spawn("codex", ["exec", "--approve-for-me", "-C", repoRoot, prompt], {
    cwd: repoRoot,
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  child.stdout.on("data", (chunk) => { output += chunk.toString(); });
  child.stderr.on("data", (chunk) => { output += chunk.toString(); });
  const exitCode = await new Promise((resolve) => child.on("exit", (code) => resolve(code ?? 1)));
  const verified = /^AGENT_VERIFIED:\s*yes\s*$/im.test(output);
  const reasons = [...output.matchAll(/^REASON:\s*(.+)$/gim)];
  const reason = reasons.at(-1)?.[1]?.trim() ?? (exitCode === 0 ? "Verifier returned no reason." : `Verifier exited ${exitCode}.`);
  verificationStore.records[key] = {
    status: exitCode === 0 ? "complete" : "error",
    verified: exitCode === 0 && verified,
    reason,
    checkedAt: new Date().toISOString(),
    participant: participant.name,
    forkRepo: participant.forkRepo,
    ticket: mr.ticket.key,
    mrId: mr.id,
    headSha: mr.headSha,
  };
  await saveVerificationStore();
}

async function pumpAgentVerifications(config) {
  const limit = config.agentVerification?.maxConcurrent ?? 1;
  while (activeVerifications < limit && verificationQueue.length) {
    const job = verificationQueue.shift();
    activeVerifications += 1;
    runAgentVerification(job)
      .catch(async (error) => {
        verificationStore.records[job.key] = {
          status: "error",
          verified: false,
          reason: error.message,
          checkedAt: new Date().toISOString(),
          participant: job.participant.name,
          forkRepo: job.participant.forkRepo,
          ticket: job.mr.ticket?.key,
          mrId: job.mr.id,
          headSha: job.mr.headSha,
        };
        await saveVerificationStore();
      })
      .finally(() => {
        activeVerifications -= 1;
        queuedVerificationKeys.delete(job.key);
        void pumpAgentVerifications(config);
      });
  }
}

async function ensureDependencies(config, target) {
  if (await exists(path.join(target, "node_modules"))) return;
  if (config.reuseDependenciesFrom) {
    await symlink(path.resolve(repoRoot, config.reuseDependenciesFrom), path.join(target, "node_modules"), "dir");
    return;
  }
  await exec("npm", ["install"], { cwd: target, maxBuffer: 1024 * 1024 * 8 });
}

function startInstance(config, participant, target, sha) {
  if (!config.autoStart || !participant.trusted) return;
  const existing = children.get(participant.id);
  if (existing?.sha === sha) return;
  if (existing && existing.sha !== sha) {
    existing.child.kill("SIGTERM");
    children.delete(participant.id);
    setTimeout(() => startInstance(config, participant, target, sha), 800);
    return;
  }
  const webPort = String(participant.webPort);
  const apiPort = String(participant.apiPort);
  const child = spawn("npm", ["run", "dev"], {
    cwd: target,
    env: { ...process.env, WEB_PORT: webPort, PORT: apiPort, VITE_API_URL: `http://localhost:${apiPort}` },
    stdio: ["ignore", "pipe", "pipe"],
  });
  children.set(participant.id, { child, sha });
  child.on("exit", () => {
    if (children.get(participant.id)?.child === child) children.delete(participant.id);
  });
}

async function syncParticipant(config, participant) {
  const item = {
    id: participant.id,
    name: participant.name,
    forkRepo: participant.forkRepo ?? participant.localRepo,
    appUrl: participant.webPort ? `http://localhost:${participant.webPort}` : null,
    trusted: Boolean(participant.trusted),
    raceStatus: participant.raceStatus ?? null,
    strategy: participant.strategy ?? null,
    assignedCount: participant.assignedCount ?? null,
    status: "syncing",
    error: null,
  };
  try {
    const [{ target, sha }, mrs] = await Promise.all([ensureClone(participant), fetchMrs(config, participant)]);
    await applyForkMainMerges(target, participant, mrs);
    applyVerificationState(participant, mrs);
    queueAgentVerifications(config, participant, mrs);
    applyVerificationState(participant, mrs);
    item.localPath = target;
    item.sha = sha;
    item.mrs = mrs;
    item.summary = summarizeMrs(mrs, ticketPoints);
    if (config.autoStart && participant.trusted) {
      await ensureDependencies(config, target);
      startInstance(config, participant, target, sha);
    }
    item.instanceRunning = children.has(participant.id);
    item.status = "ready";
  } catch (error) {
    item.status = "error";
    item.error = error.message;
    item.mrs = [];
    item.summary = summarizeMrs([], ticketPoints);
  }
  return item;
}

async function refresh(config) {
  const loadedConfig = config.participantsFile
    ? { ...config, ...(JSON.parse(await readFile(path.resolve(repoRoot, config.participantsFile), "utf8"))) }
    : config;
  const participants = await discoverParticipants(loadedConfig);
  const pullCache = loadedConfig.baseRepo && participants.some((participant) => !participant.mrs)
    ? await githubList(`/repos/${loadedConfig.baseRepo}/pulls?state=all`)
    : null;
  const forkPullCache = new Map();
  if (loadedConfig.readForkPulls) {
    await Promise.all(participants.filter((participant) => !participant.mrs && participant.forkRepo).map(async (participant) => {
      forkPullCache.set(participant.forkRepo, await githubList(`/repos/${participant.forkRepo}/pulls?state=all`));
    }));
  }
  const liveConfig = { ...loadedConfig, participants, pullCache, forkPullCache };
  if (liveConfig.simulation?.enabled) state.simulationTick += 1;
  state.participants = await Promise.all(liveConfig.participants.map((participant) => syncParticipant(liveConfig, participant)));
  state.lastRefresh = new Date().toISOString();
  state.simulation = liveConfig.simulation?.enabled ? liveConfig.simulation : null;
  state.error = null;
}

function json(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(JSON.stringify(body));
}

const html = `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>CivicVoice workshop board</title>
<style>
body{font-family:Inter,ui-sans-serif,system-ui;margin:0;background:#f6f5f1;color:#17222b}main{max-width:1780px;margin:auto;padding:48px 24px}
h1{font-size:44px;letter-spacing:-.05em;margin:8px 0}.eyebrow{color:#a91f25;font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase}
.top{display:flex;justify-content:space-between;align-items:end;gap:24px;margin-bottom:32px}.muted{color:#68747b}.button,a.button{display:inline-flex;align-items:center;justify-content:center;white-space:nowrap;background:#a91f25;color:#fff;border:0;border-radius:8px;padding:11px 15px;text-decoration:none;font-weight:700;cursor:pointer}
.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin:22px 0}.card,table{background:#fff;border:1px solid #e3dfd6;border-radius:12px}.card{padding:18px}.value{font-size:30px;font-weight:800}
table{width:100%;min-width:1220px;border-collapse:collapse;overflow:hidden}th,td{text-align:left;padding:15px;border-bottom:1px solid #eeeae2;vertical-align:top}th{font-size:12px;text-transform:uppercase;color:#68747b;letter-spacing:.08em}
.score-cell,.instance-cell,.sync-cell{white-space:nowrap}.score-cell{min-width:86px}.instance-cell{min-width:112px}.sync-cell{min-width:72px}
.name{font-weight:800}.tag{display:inline-flex;align-items:center;gap:5px;white-space:nowrap;padding:4px 8px;border-radius:999px;background:#eef1f3;font-size:12px;margin:2px}.merged{background:#e6f4ea;color:#247238}.open,.draft{background:#fff1df;color:#9a5b00}.closed{background:#f3e8e8;color:#8f3131}.ai-mark{border-left:1px solid currentColor;padding-left:5px;color:#6b3fa0;font-weight:800;font-size:10px;letter-spacing:.04em}.verified-mark{font-weight:900;color:#247238}.verify-loading{display:inline-block;color:#9a5b00;font-weight:900;animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}.error{color:#a91f25}.small{font-size:12px}
@media(max-width:760px){.top{display:block}.cards{grid-template-columns:1fr}table,tbody,tr,td{display:block}thead{display:none}td{border:0;padding:8px 15px}tr{border-bottom:1px solid #eeeae2;display:block;padding:8px 0}}
</style></head><body><main>
<div class="top"><div><div class="eyebrow">Facilitator view</div><h1>CivicVoice workshop board</h1><p class="muted">Fork sync, MR progress, and local participant instances.</p></div><button class="button" onclick="refreshNow()">Refresh now</button></div>
<div class="cards"><div class="card"><div class="muted">Participants</div><div class="value" id="participants">—</div></div><div class="card"><div class="muted">Points awarded</div><div class="value" id="points">—</div></div><div class="card"><div class="muted">In progress</div><div class="value" id="progress">—</div></div></div>
<p class="muted small" id="updated">Loading…</p>
<table><colgroup><col style="width:6%"><col style="width:17%"><col style="width:15%"><col style="width:20%"><col style="width:14%"><col style="width:12%"><col style="width:7%"><col style="width:6%"><col style="width:5%"></colgroup><thead><tr><th>Rank</th><th>Participant</th><th>S · 1 pt</th><th>M · 2 pts</th><th>L · 3 pts</th><th>In progress</th><th>Score</th><th>Instance</th><th>Race state</th></tr></thead><tbody id="rows"></tbody></table>
</main><script>
function esc(v){return String(v??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]))}
function tags(items,status){return (items||[]).map(x=>{const label=typeof x==="string"?x:x.key+" · "+x.points;const mark=typeof x==="object"&&x.openAI?'<span class="ai-mark">✦ AI</span>':"";const verified=typeof x==="object"&&x.agentVerified?'<span class="verified-mark" title="Agent verified">✓</span>':"";const loading=typeof x==="object"&&x.agentVerificationPending?'<span class="verify-loading" title="Agent verification in progress">◌</span>':"";return '<span class="tag '+status+'">'+esc(label)+mark+loading+verified+'</span>'}).join("")||"—"}
async function load(){const s=await fetch("/api/state").then(r=>r.json());let points=0,progress=0;document.getElementById("participants").textContent=s.participants.length;
const ranked=[...s.participants].sort((a,b)=>(b.summary?.points||0)-(a.summary?.points||0)||(b.summary?.counts?.merged||0)-(a.summary?.counts?.merged||0)||a.name.localeCompare(b.name));
document.getElementById("rows").innerHTML=ranked.map((p,i)=>{points+=p.summary?.points||0;progress+=(p.summary?.counts?.open||0)+(p.summary?.counts?.draft||0);const app=p.instanceRunning?'<a class="button small" target="_blank" href="'+esc(p.appUrl)+'">Open app</a>':'—';const detail=p.strategy?'<div class="muted small">'+esc(p.strategy)+(p.assignedCount?' · '+esc(p.assignedCount)+' tickets':'')+'</div>':"";const race=p.raceStatus||p.error||p.status;return '<tr><td><div class="name">#'+(i+1)+'</div></td><td><div class="name">'+esc(p.name)+'</div>'+detail+'<div class="muted small"><code>'+esc(p.sha||"—")+'</code></div></td><td>'+tags(p.summary?.completedBySize?.S,"merged")+'</td><td>'+tags(p.summary?.completedBySize?.M,"merged")+'</td><td>'+tags(p.summary?.completedBySize?.L,"merged")+'</td><td>'+tags(p.summary?.inProgressDetails,"open")+'</td><td class="score-cell"><div class="name">'+esc(p.summary?.points||0)+' pts</div></td><td class="instance-cell">'+app+'</td><td class="sync-cell '+(p.error||p.raceStatus==="blocked"?"error":"")+'">'+esc(race)+'</td></tr>'}).join("");
document.getElementById("points").textContent=points;document.getElementById("progress").textContent=progress;document.getElementById("updated").textContent=(s.simulation?"Simulation tick "+s.simulationTick+" · ":"")+"Last refresh: "+(s.lastRefresh?new Date(s.lastRefresh).toLocaleTimeString():"starting");}
async function refreshNow(){await fetch("/api/refresh",{method:"POST"});load()} load();setInterval(load,5000);
</script></body></html>`;

const config = await loadConfig();
await refresh(config);
setInterval(() => refresh(config).catch((error) => { state.error = error.message; }), (config.pollSeconds ?? 20) * 1000);

const server = http.createServer(async (req, res) => {
  if (req.url === "/api/state") return json(res, 200, state);
  if (req.url === "/api/refresh" && req.method === "POST") {
    await refresh(config);
    return json(res, 200, state);
  }
  if (req.url === "/" || req.url === "/index.html") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    return res.end(html);
  }
  return json(res, 404, { error: "Not found" });
});

server.listen(config.dashboardPort ?? 4200, () => {
  console.log(`CivicVoice workshop board: http://localhost:${config.dashboardPort ?? 4200}`);
});

function stop() {
  for (const entry of children.values()) entry.child.kill("SIGTERM");
  server.close(() => process.exit(0));
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
