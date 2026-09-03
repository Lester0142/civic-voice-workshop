import { useEffect, useState } from "react";
import { getFeedback, getFeedbackDetail } from "../api";

export function AdminPage({ user }) {
  const [feedback, setFeedback] = useState([]);
  const [error, setError] = useState("");
  const [selectedFeedback, setSelectedFeedback] = useState(null);

  useEffect(() => {
    getFeedback(user).then((response) => setFeedback(response.feedback)).catch((requestError) => setError(requestError.message));
  }, [user]);

  function selectFeedback(id) {
    setError("");
    getFeedbackDetail(user, id)
      .then((response) => setSelectedFeedback(response.feedback))
      .catch((requestError) => setError(requestError.message));
  }

  return (
    <main className="page-shell admin-shell">
      <div className="page-heading">
        <div className="eyebrow">Admin workspace</div>
        <h1>Feedback inbox</h1>
        <p>A simple view of feedback received from members of the public.</p>
      </div>
      {error && <p className="error-message">{error}</p>}
      {selectedFeedback ? (
        <section className="feedback-detail" aria-labelledby="feedback-detail-title">
          <button className="text-button back-button" type="button" onClick={() => setSelectedFeedback(null)}>
            ← Back to feedback inbox
          </button>
          <div className="detail-heading">
            <div>
              <div className="eyebrow">Feedback detail</div>
              <h2 id="feedback-detail-title">{selectedFeedback.name}</h2>
            </div>
            <span className="status-pill">{selectedFeedback.status}</span>
          </div>
          <dl className="feedback-details">
            <div><dt>Reference</dt><dd>{selectedFeedback.id}</dd></div>
            <div><dt>Citizen</dt><dd>{selectedFeedback.name}</dd></div>
            <div><dt>Identifier</dt><dd>{selectedFeedback.nric}</dd></div>
            <div><dt>Category</dt><dd>{selectedFeedback.category}</dd></div>
            <div><dt>Received</dt><dd>{new Date(selectedFeedback.createdAt).toLocaleString()}</dd></div>
            <div className="detail-message"><dt>Message</dt><dd>{selectedFeedback.message}</dd></div>
          </dl>
        </section>
      ) : (
        <section className="feedback-list">
          <div className="list-header"><strong>Latest feedback</strong><span>{feedback.length} items</span></div>
          {feedback.map((item) => (
            <article className="feedback-row" key={item.id}>
              <button className="feedback-select" type="button" onClick={() => selectFeedback(item.id)}>
                <div>
                  <div className="feedback-meta">{item.name} · {new Date(item.createdAt).toLocaleDateString()}</div>
                  <p>{item.message}</p>
                </div>
                <span className="status-pill">{item.status}</span>
              </button>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
