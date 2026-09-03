import { useEffect, useState } from "react";
import { getFeedback } from "../api";
import { filterFeedbackByKeyword } from "../lib/feedbackSearch";

export function AdminPage({ user }) {
  const [feedback, setFeedback] = useState([]);
  const [error, setError] = useState("");
  const [keyword, setKeyword] = useState("");

  useEffect(() => {
    getFeedback(user).then((response) => setFeedback(response.feedback)).catch((requestError) => setError(requestError.message));
  }, [user]);

  const visibleFeedback = filterFeedbackByKeyword(feedback, keyword);

  return (
    <main className="page-shell admin-shell">
      <div className="page-heading">
        <div className="eyebrow">Admin workspace</div>
        <h1>Feedback inbox</h1>
        <p>A simple view of feedback received from members of the public.</p>
      </div>
      {error && <p className="error-message">{error}</p>}
      <section className="feedback-list">
        <div className="list-header"><strong>Latest feedback</strong><span>{visibleFeedback.length} of {feedback.length} items</span></div>
        <label className="search-field" htmlFor="feedback-keyword">
          Search feedback
          <input
            id="feedback-keyword"
            type="search"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Search messages or citizen names"
          />
        </label>
        {visibleFeedback.length === 0 && !error && (
          <p className="empty-state">
            {feedback.length === 0
              ? "No feedback has been received yet."
              : `No feedback matches “${keyword}”. Try a different keyword.`}
          </p>
        )}
        {visibleFeedback.map((item) => (
          <article className="feedback-row" key={item.id}>
            <div>
              <div className="feedback-meta">{item.name} · {new Date(item.createdAt).toLocaleDateString()}</div>
              <p>{item.message}</p>
            </div>
            <span className="status-pill">{item.status}</span>
          </article>
        ))}
      </section>
    </main>
  );
}
