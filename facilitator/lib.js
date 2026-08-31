const titlePattern = /^CV-(\d{3}):\s+(.+)$/;

export function parseTicketTitle(title = "") {
  const match = title.trim().match(titlePattern);
  if (!match) return null;
  return { key: `CV-${match[1]}`, number: Number(match[1]), title: match[2].trim() };
}

export function normalizeMr(mr) {
  const ticket = parseTicketTitle(mr.title);
  const status = mr.simulationStatus ?? (mr.merged_at || mr.mergedAt
    ? "merged"
    : mr.draft
      ? "draft"
      : mr.state === "open"
        ? "open"
        : "closed");
  return {
    id: mr.number ?? mr.id,
    title: mr.title,
    url: mr.html_url ?? mr.url ?? null,
    branch: mr.head?.ref ?? mr.branch ?? null,
    status,
    ticket,
    points: mr.points ?? null,
    updatedAt: mr.updated_at ?? mr.updatedAt ?? null,
  };
}

export function summarizeMrs(mrs = [], ticketPoints = {}) {
  const valid = mrs.filter((mr) => mr.ticket);
  const counts = { merged: 0, open: 0, draft: 0, closed: 0 };
  for (const mr of valid) counts[mr.status] += 1;
  const completedBySize = { S: [], M: [], L: [] };
  for (const mr of valid.filter((candidate) => candidate.status === "merged")) {
    const size = mr.size ?? "S";
    if (completedBySize[size]) {
      completedBySize[size].push({
        key: mr.ticket.key,
        points: mr.points ?? ticketPoints[mr.ticket.key] ?? 1,
      });
    }
  }
  const points = valid
    .filter((mr) => mr.status === "merged")
    .reduce((total, mr) => total + (mr.points ?? ticketPoints[mr.ticket.key] ?? 1), 0);
  return {
    counts,
    completed: valid.filter((mr) => mr.status === "merged").map((mr) => mr.ticket.key),
    completedBySize,
    inProgress: valid.filter((mr) => mr.status === "open" || mr.status === "draft").map((mr) => mr.ticket.key),
    points,
  };
}
