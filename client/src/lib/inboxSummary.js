const STATUS_KEYS = {
  new: "new",
  "in review": "inReview",
  closed: "closed",
};

export function getInboxSummary(feedback) {
  return feedback.reduce(
    (summary, item) => {
      summary.total += 1;
      const key = STATUS_KEYS[item.status?.trim().toLowerCase()];
      if (key) summary[key] += 1;
      return summary;
    },
    { total: 0, new: 0, inReview: 0, closed: 0 },
  );
}
