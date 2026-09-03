export function sortNewestFeedback(feedback) {
  return [...feedback].sort(
    (left, right) => new Date(right.createdAt) - new Date(left.createdAt),
  );
}
