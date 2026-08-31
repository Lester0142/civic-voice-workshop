import { execFile } from "node:child_process";
import { access, mkdir, readFile, symlink } from "node:fs/promises";
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
const children = new Map();
const state = { startedAt: new Date().toISOString(), lastRefresh: null, participants: [], error: null };

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

function cleanId(value) {
  if (!/^[a-z0-9_-]+$/i.test(value)) throw new Error(`Invalid participant id: ${value}`);
  return value;
}

async function git(args, cwd) {
  const result = await exec("git", args, { cwd, maxBuffer: 1024 * 1024 * 4 });
  return result.stdout.trim();
}

async function ensureClone(participant) {
  const id = cleanId(participant.id);
  const target = path.join(cloneRoot, id);
  const branch = participant.branch ?? "main";
  const source = participant.localRepo
    ? path.resolve(repoRoot, participant.localRepo)
    : `https://github.com/${participant.forkRepo}.git`;
  await mkdir(cloneRoot, { recursive: true });

  if (!(await exists(path.join(target, ".git")))) {
    await git(["clone", "--branch", branch, "--single-branch", source, target], repoRoot);
  } else {
    await git(["fetch", "origin", branch], target);
    await git(["checkout", branch], target);
    await git(["pull", "--ff-only", "origin", branch], target);
  }
  return { target, sha: await git(["rev-parse", "--short", "HEAD"], target) };
}

async function fetchMrs(config, participant) {
  if (participant.mrs) return participant.mrs.map(normalizeMr);
  if (!config.baseRepo || !participant.forkRepo) return [];
  const headers = { Accept: "application/vnd.github+json", "User-Agent": "civic-voice-facilitator" };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const response = await fetch(`https://api.github.com/repos/${config.baseRepo}/pulls?state=all&per_page=100`, { headers });
  if (!response.ok) throw new Error(`GitHub API returned ${response.status}`);
  const pulls = await response.json();
  return pulls
    .filter((pull) => pull.head?.repo?.full_name === participant.forkRepo)
    .map(normalizeMr);
}

async function ensureDependencies(config, target) {
  if (await exists(path.join(target, "node_modules"))) return;
  if (config.reuseDependenciesFrom) {
    await symlink(path.resolve(repoRoot, config.reuseDependenciesFrom), path.join(target, "node_modules"), "dir");
    return;
  }
  await exec("npm", ["install"], { cwd: target, maxBuffer: 1024 * 1024 * 8 });
}

function startInstance(config, participant, target) {
  if (!config.autoStart || !participant.trusted || children.has(participant.id)) return;
  const webPort = String(participant.webPort);
  const apiPort = String(participant.apiPort);
  const child = spawn("npm", ["run", "dev"], {
    cwd: target,
    env: { ...process.env, WEB_PORT: webPort, PORT: apiPort, VITE_API_URL: `http://localhost:${apiPort}` },
    stdio: ["ignore", "pipe", "pipe"],
  });
  children.set(participant.id, child);
  child.on("exit", () => children.delete(participant.id));
}

async function syncParticipant(config, participant) {
  const item = {
    id: participant.id,
    name: participant.name,
    forkRepo: participant.forkRepo ?? participant.localRepo,
    appUrl: participant.webPort ? `http://localhost:${participant.webPort}` : null,
    trusted: Boolean(participant.trusted),
    status: "syncing",
    error: null,
  };
  try {
    const [{ target, sha }, mrs] = await Promise.all([ensureClone(participant), fetchMrs(config, participant)]);
    item.localPath = target;
    item.sha = sha;
    item.mrs = mrs;
    item.summary = summarizeMrs(mrs);
    if (config.autoStart && participant.trusted) {
      await ensureDependencies(config, target);
      startInstance(config, participant, target);
    }
    item.instanceRunning = children.has(participant.id);
    item.status = "ready";
  } catch (error) {
    item.status = "error";
    item.error = error.message;
    item.mrs = [];
    item.summary = summarizeMrs([]);
  }
  return item;
}

async function refresh(config) {
  state.participants = await Promise.all(config.participants.map((participant) => syncParticipant(config, participant)));
  state.lastRefresh = new Date().toISOString();
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
body{font-family:Inter,ui-sans-serif,system-ui;margin:0;background:#f6f5f1;color:#17222b}main{max-width:1180px;margin:auto;padding:48px 24px}
h1{font-size:44px;letter-spacing:-.05em;margin:8px 0}.eyebrow{color:#a91f25;font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase}
.top{display:flex;justify-content:space-between;align-items:end;gap:24px;margin-bottom:32px}.muted{color:#68747b}.button,a.button{background:#a91f25;color:#fff;border:0;border-radius:8px;padding:11px 15px;text-decoration:none;font-weight:700;cursor:pointer}
.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin:22px 0}.card,table{background:#fff;border:1px solid #e3dfd6;border-radius:12px}.card{padding:18px}.value{font-size:30px;font-weight:800}
table{width:100%;border-collapse:collapse;overflow:hidden}th,td{text-align:left;padding:15px;border-bottom:1px solid #eeeae2;vertical-align:top}th{font-size:12px;text-transform:uppercase;color:#68747b;letter-spacing:.08em}
.name{font-weight:800}.tag{display:inline-block;padding:4px 8px;border-radius:999px;background:#eef1f3;font-size:12px;margin:2px}.merged{background:#e6f4ea;color:#247238}.open,.draft{background:#fff1df;color:#9a5b00}.closed{background:#f3e8e8;color:#8f3131}.error{color:#a91f25}.small{font-size:12px}
@media(max-width:760px){.top{display:block}.cards{grid-template-columns:1fr}table,tbody,tr,td{display:block}thead{display:none}td{border:0;padding:8px 15px}tr{border-bottom:1px solid #eeeae2;display:block;padding:8px 0}}
</style></head><body><main>
<div class="top"><div><div class="eyebrow">Facilitator view</div><h1>CivicVoice workshop board</h1><p class="muted">Fork sync, MR progress, and local participant instances.</p></div><button class="button" onclick="refreshNow()">Refresh now</button></div>
<div class="cards"><div class="card"><div class="muted">Participants</div><div class="value" id="participants">—</div></div><div class="card"><div class="muted">Merged tickets</div><div class="value" id="merged">—</div></div><div class="card"><div class="muted">In progress</div><div class="value" id="progress">—</div></div></div>
<p class="muted small" id="updated">Loading…</p>
<table><thead><tr><th>Participant</th><th>Latest main</th><th>Completed</th><th>In progress</th><th>Instance</th><th>Sync</th></tr></thead><tbody id="rows"></tbody></table>
</main><script>
function esc(v){return String(v??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]))}
function tags(items,status){return (items||[]).map(x=>'<span class="tag '+status+'">'+esc(x)+'</span>').join("")||"—"}
async function load(){const s=await fetch("/api/state").then(r=>r.json());let merged=0,progress=0;document.getElementById("participants").textContent=s.participants.length;
document.getElementById("rows").innerHTML=s.participants.map(p=>{merged+=p.summary?.counts?.merged||0;progress+=(p.summary?.counts?.open||0)+(p.summary?.counts?.draft||0);const app=p.instanceRunning?'<a class="button small" target="_blank" href="'+esc(p.appUrl)+'">Open app</a>':'—';return '<tr><td><div class="name">'+esc(p.name)+'</div><div class="muted small">'+esc(p.forkRepo)+'</div></td><td><code>'+esc(p.sha||"—")+'</code></td><td>'+tags(p.summary?.completed,"merged")+'</td><td>'+tags(p.summary?.inProgress,"open")+'</td><td>'+app+'</td><td class="'+(p.error?"error":"")+'">'+esc(p.error||p.status)+'</td></tr>'}).join("");
document.getElementById("merged").textContent=merged;document.getElementById("progress").textContent=progress;document.getElementById("updated").textContent="Last refresh: "+(s.lastRefresh?new Date(s.lastRefresh).toLocaleTimeString():"starting");}
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
  for (const child of children.values()) child.kill("SIGTERM");
  server.close(() => process.exit(0));
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
