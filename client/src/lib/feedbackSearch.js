export function filterFeedbackByKeyword(feedback, keyword) {
  const normalizedKeyword = keyword.trim().toLocaleLowerCase();

  if (!normalizedKeyword) return feedback;

  return feedback.filter((item) => (
    item.message.toLocaleLowerCase().includes(normalizedKeyword)
    || item.name.toLocaleLowerCase().includes(normalizedKeyword)
  ));
}
