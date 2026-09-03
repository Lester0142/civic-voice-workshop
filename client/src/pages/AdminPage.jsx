import { useCallback, useEffect, useState } from "react";
import { getFeedback } from "../api";

export function AdminPage({ user }) {
  const [feedback, setFeedback] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const loadFeedback = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await getFeedback(user);
      setFeedback(response.feedback);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadFeedback();
  }, [loadFeedback]);

  return (
    <main className="page-shell admin-shell">
      <div className="page-heading">
        <div className="eyebrow">Admin workspace</div>
        <h1>Feedback inbox</h1>
        <p>A simple view of feedback received from members of the public.</p>
      </div>
      <section className="feedback-list">
        <div className="list-header"><strong>Latest feedback</strong><span>{feedback.length} items</span></div>
        {isLoading && <p className="inbox-state" role="status">Loading feedback…</p>}
        {!isLoading && error && (
          <div className="inbox-state inbox-error" role="alert">
            <p>We couldn’t load the feedback inbox. {error}</p>
            <button className="primary-button" type="button" onClick={loadFeedback}>Try again</button>
          </div>
        )}
        {!isLoading && !error && feedback.length === 0 && (
          <p className="inbox-state">No feedback has been submitted yet.</p>
        )}
        {!isLoading && !error && feedback.map((item) => (
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
