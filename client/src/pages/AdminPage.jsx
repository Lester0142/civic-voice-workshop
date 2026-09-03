import { useEffect, useState } from "react";
import { getFeedback } from "../api";
import { getInboxSummary } from "../lib/inboxSummary";

export function AdminPage({ user }) {
  const [feedback, setFeedback] = useState([]);
  const [error, setError] = useState("");
  const summary = getInboxSummary(feedback);

  useEffect(() => {
    getFeedback(user).then((response) => setFeedback(response.feedback)).catch((requestError) => setError(requestError.message));
  }, [user]);

  return (
    <main className="page-shell admin-shell">
      <div className="page-heading">
        <div className="eyebrow">Admin workspace</div>
        <h1>Feedback inbox</h1>
        <p>A simple view of feedback received from members of the public.</p>
      </div>
      {error && <p className="error-message">{error}</p>}
      <section className="inbox-summary" aria-label="Inbox summary">
        <article className="summary-card">
          <span className="summary-label">Total feedback</span>
          <strong className="summary-count">{summary.total}</strong>
        </article>
        <article className="summary-card">
          <span className="summary-label">New</span>
          <strong className="summary-count">{summary.new}</strong>
        </article>
        <article className="summary-card">
          <span className="summary-label">In review</span>
          <strong className="summary-count">{summary.inReview}</strong>
        </article>
        <article className="summary-card">
          <span className="summary-label">Closed</span>
          <strong className="summary-count">{summary.closed}</strong>
        </article>
      </section>
      <section className="feedback-list">
        <div className="list-header"><strong>Latest feedback</strong><span>{feedback.length} items</span></div>
        {feedback.map((item) => (
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
