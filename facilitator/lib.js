const titlePattern = /^CV-(\d{3}):\s+(.+)$/;

export function parseTicketTitle(title = "") {
  const match = title.trim().match(titlePattern);
  if (!match) return null;
  return { key: `CV-${match[1]}`, number: Number(match[1]), title: match[2].trim() };
}

export function normalizeMr(mr) {
  const ticket = parseTicketTitle(mr.title);
  const status = mr.merged_at || mr.mergedAt
    ? "merged"
    : mr.draft
      ? "draft"
      : mr.state === "open"
        ? "open"
        : "closed";
  return {
    id: mr.number ?? mr.id,
    title: mr.title,
    url: mr.html_url ?? mr.url ?? null,
    branch: mr.head?.ref ?? mr.branch ?? null,
    status,
    ticket,
    updatedAt: mr.updated_at ?? mr.updatedAt ?? null,
  };
}

export function summarizeMrs(mrs = []) {
  const valid = mrs.filter((mr) => mr.ticket);
  const counts = { merged: 0, open: 0, draft: 0, closed: 0 };
  for (const mr of valid) counts[mr.status] += 1;
  return {
    counts,
    completed: valid.filter((mr) => mr.status === "merged").map((mr) => mr.ticket.key),
    inProgress: valid.filter((mr) => mr.status === "open" || mr.status === "draft").map((mr) => mr.ticket.key),
    totalPointsProxy: counts.merged,
  };
}
