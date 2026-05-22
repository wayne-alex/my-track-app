import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function ApplicationDetail() {
  const { trackingNumber } = useParams();
  const navigate = useNavigate();

  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [decisionMode, setDecisionMode] = useState(null); 
  const [reviewerComment, setReviewerComment] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchApplicationDetails = () => {
    setLoading(true);
    axios.get(`http://localhost:8000/api/applications/${trackingNumber}`)
      .then(res => { setApp(res.data); setLoading(false); })
      .catch(() => { setLoading(false); });
  };

  useEffect(() => { fetchApplicationDetails(); }, [trackingNumber]);

  const handleWorkflowAction = async (endpoint, payload = {}) => {
    setActionLoading(true);
    try {
      await axios.post(`http://localhost:8000/api/applications/${trackingNumber}/${endpoint}`, payload);
      setDecisionMode(null);
      setReviewerComment('');
      fetchApplicationDetails();
    } catch {
      alert('Failed to execute state transition.');
    } finally {
      setActionLoading(false);
    }
  };

  const submitDecision = (e) => {
    e.preventDefault();
    if ((decisionMode === 'Need More Information' || decisionMode === 'Rejected') && !reviewerComment.trim()) {
      alert(`A comment explaining the decision is required for: ${decisionMode}`);
      return;
    }
    handleWorkflowAction('decision', { decision: decisionMode, comment: reviewerComment });
  };

  if (loading) {
    return (
      <div class="text-center my-5">
        <div class="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  if (!app) return <div class="alert alert-danger">Application details could not be found.</div>;

  return (
    <div class="card shadow-sm mx-auto" style={{ maxWidth: '850px' }}>
      <div class="card-header bg-white py-3 d-flex justify-content-between align-items-center">
        <div>
          <small class="text-muted text-uppercase d-block fw-bold tracking-wider" style={{ fontSize: '0.75rem' }}>Tracking Reference</small>
          <h3 class="h4 mb-0 fw-bold">{app.tracking_number}</h3>
        </div>
        <span class="badge bg-primary fs-6 px-3 py-2">{app.status}</span>
      </div>

      <div class="card-body p-4">
        {/* Detail Meta Grid */}
        <div class="row g-3 mb-4">
          <div class="col-sm-6">
            <div class="text-muted small">Applicant Information</div>
            <div class="fw-bold">{app.applicant_name}</div>
            <div class="text-muted">{app.applicant_email}</div>
            <div class="text-muted">{app.company_name}</div>
          </div>
          <div class="col-sm-6 text-sm-end">
            <div class="text-muted small">Process Parameters</div>
            <div><strong>Type:</strong> {app.application_type}</div>
            <div class="text-muted small">Created: {new Date(app.created_at).toLocaleString()}</div>
          </div>
        </div>

        <div class="p-3 bg-light rounded mb-4">
          <h6 class="fw-bold text-dark mb-2">Application Description</h6>
          <p class="mb-0 text-secondary" style={{ whiteSpace: 'pre-wrap' }}>{app.description || 'No description provided.'}</p>
        </div>

        {app.reviewer_comment && (
          <div class="alert alert-warning border border-warning-subtle mb-4">
            <h6 class="alert-heading fw-bold">Reviewer Feedback Log</h6>
            <p class="mb-0 fst-italic">"{app.reviewer_comment}"</p>
          </div>
        )}

        {/* Dynamic Action Panel */}
        <div class="border-top pt-3">
          <h5 class="h6 fw-bold text-muted mb-3 text-uppercase">Workflow Control Actions</h5>
          
          {actionLoading && (
            <div class="d-flex align-items-center text-muted small">
              <div class="spinner-border spinner-border-sm me-2" role="status"></div> Processing update...
            </div>
          )}

          {!actionLoading && (
            <div>
              {app.status === 'Draft' && (
                <div class="gap-2 d-flex">
                  <button onClick={() => navigate(`/edit/${app.tracking_number}`)} class="btn btn-outline-secondary btn-sm fw-bold">Edit Draft</button>
                  <button onClick={() => handleWorkflowAction('submit')} class="btn btn-success btn-sm fw-bold">Submit Application</button>
                </div>
              )}

              {app.status === 'Submitted' && (
                <button onClick={() => handleWorkflowAction('start-review')} class="btn btn-primary btn-sm fw-bold">Start Technical Review</button>
              )}

              {app.status === 'Under Review' && !decisionMode && (
                <div class="gap-2 d-flex">
                  <button onClick={() => setDecisionMode('Approved')} class="btn btn-success btn-sm fw-bold">Approve</button>
                  <button onClick={() => setDecisionMode('Need More Information')} class="btn btn-warning btn-sm fw-bold">Request More Info</button>
                  <button onClick={() => setDecisionMode('Rejected')} class="btn btn-danger btn-sm fw-bold">Reject</button>
                </div>
              )}

              {app.status === 'Need More Information' && (
                <div class="gap-2 d-flex">
                  <button onClick={() => navigate(`/edit/${app.tracking_number}`)} class="btn btn-outline-secondary btn-sm fw-bold">Edit Form</button>
                  <button onClick={() => handleWorkflowAction('submit')} class="btn btn-success btn-sm fw-bold">Resubmit Changes</button>
                </div>
              )}

              {(app.status === 'Approved' || app.status === 'Rejected') && (
                <p class="text-muted small fst-italic mb-0">This application cycle is finalized and locked from edits.</p>
              )}
            </div>
          )}

          {/* Decision Dialog Input Overlay */}
          {decisionMode && (
            <form onSubmit={submitDecision} class="mt-4 p-3 bg-light border rounded">
              <h6 class="fw-bold text-dark">Provide Review Justification: <span class="text-primary">{decisionMode}</span></h6>
              <div class="mb-3">
                <textarea
                  class="form-control form-control-sm"
                  rows="3"
                  placeholder="Provide brief validation decision reasoning text context..."
                  value={reviewerComment}
                  onChange={(e) => setReviewerComment(e.target.value)}
                />
              </div>
              <div class="gap-2 d-flex">
                <button type="submit" class="btn btn-sm btn-primary fw-bold">Save Decision</button>
                <button type="button" class="btn btn-sm btn-light border" onClick={() => setDecisionMode(null)}>Cancel</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}