import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const APPLICATION_TYPES = [
  'Recordation',
  'Renewal',
  'Change of Ownership',
  'Change of Name',
  'Discontinuation',
];

// Save status config
const SAVE_STATUS_STYLE = {
  Idle:       { bg: '#F5F5F5', color: '#aaa',    label: 'Not saved' },
  Loading:    { bg: '#E6F1FB', color: '#185FA5', label: 'Loading…' },
  Typing:     { bg: '#F5F5F5', color: '#aaa',    label: 'Typing…' },
  Saving:     { bg: '#FAEEDA', color: '#854F0B', label: 'Saving…' },
  Saved:      { bg: '#EAF3DE', color: '#3B6D11', label: 'Saved ✓' },
  Error:      { bg: '#FCEBEB', color: '#A32D2D', label: 'Save error' },
};

export default function ApplicationForm() {
  const { trackingNumber } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    tracking_number: trackingNumber || '',
    applicant_name: '',
    applicant_email: '',
    company_name: '',
    application_type: APPLICATION_TYPES[0],
    description: '',
  });

  const [saveStatus, setSaveStatus] = useState('Idle');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Track whether this is the initial mount or a load-triggered update
  // to prevent autosave firing immediately on load
  const skipNextSave = useRef(true);
  const saveTimerRef = useRef(null);

  // Load existing application if editing
  useEffect(() => {
    if (!trackingNumber) {
      skipNextSave.current = true;
      return;
    }
    setSaveStatus('Loading');
    axios.get(`http://localhost:8000/api/applications/${trackingNumber}`)
      .then(res => {
        if (res.data.status !== 'Draft' && res.data.status !== 'Need More Information') {
          alert('This application can no longer be edited.');
          navigate(`/application/${trackingNumber}`);
          return;
        }
        // Flag: the next formData change is from loading, not the user typing
        skipNextSave.current = true;
        setFormData(res.data);
        setSaveStatus('Saved');
      })
      .catch(() => setSaveStatus('Error'));
  }, [trackingNumber, navigate]);

  // Pass data directly to avoid stale closure. useCallback keeps reference stable.
  const handleAutoSave = useCallback(async (dataToSave) => {
    setSaveStatus('Saving');
    try {
      // Send null (not empty string) for new drafts so the backend
      // takes the "create" path instead of hitting get_object_or_404
      const payload = {
        ...dataToSave,
        tracking_number: dataToSave.tracking_number || null,
      };
      const response = await axios.post(
        'http://localhost:8000/api/applications/draft',
        payload
      );
      setSaveStatus('Saved');
      // New draft: store the generated tracking number so submit unlocks
      if (!dataToSave.tracking_number && response.data.tracking_number) {
        setFormData(prev => ({ ...prev, tracking_number: response.data.tracking_number }));
        window.history.replaceState(null, '', `/edit/${response.data.tracking_number}`);
      }
    } catch {
      setSaveStatus('Error');
    }
  }, []); // stable — data is passed in, no external deps needed

  // Autosave effect: fires 1.5s after the user stops typing
  useEffect(() => {
    // Skip saves triggered by loading or initial mount
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }

    setSaveStatus('Typing');

    // Clear any pending save before scheduling a new one
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    // Capture current data at schedule time so closure is never stale
    const snapshot = { ...formData };
    saveTimerRef.current = setTimeout(() => {
      handleAutoSave(snapshot);
    }, 1500);

    // Cleanup: cancel the pending save if the component unmounts
    // or if formData changes again before the timer fires
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [formData, handleAutoSave]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.tracking_number) return;
    setIsSubmitting(true);
    try {
      await axios.post(`http://localhost:8000/api/applications/${formData.tracking_number}/submit`);
      navigate('/');
    } catch {
      alert('Failed to submit application.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusConfig = SAVE_STATUS_STYLE[saveStatus] || SAVE_STATUS_STYLE.Idle;

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto' }}>

      {/* Back button */}
      <button
        onClick={() => navigate('/')}
        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: '#888', padding: '0 0 14px 0', display: 'flex', alignItems: 'center', gap: '4px' }}
      >
        ← Back to dashboard
      </button>

      <div style={{ background: '#fff', border: '1px solid #EBEBEB', borderRadius: '12px', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #F5F5F5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>
              {formData.tracking_number ? 'Edit application' : 'New application'}
            </h3>
            {formData.tracking_number && (
              <div style={{ fontSize: '12px', color: '#aaa', fontFamily: 'monospace', marginTop: '2px' }}>
                {formData.tracking_number}
              </div>
            )}
          </div>

          {/* Autosave chip */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: statusConfig.bg, color: statusConfig.color,
            fontSize: '12px', fontWeight: 600,
            padding: '5px 12px', borderRadius: '20px',
            transition: 'background 0.3s, color 0.3s',
          }}>
            {saveStatus === 'Saving' && (
              <div className="spinner-border spinner-border-sm" role="status" style={{ width: '12px', height: '12px', borderWidth: '2px' }} />
            )}
            {statusConfig.label}
          </div>
        </div>

        {/* Form body */}
        <form onSubmit={handleSubmit}>
          <div style={{ padding: '24px' }}>

            {/* Row 1: Name & Email */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                  Applicant name *
                </label>
                <input
                  type="text"
                  name="applicant_name"
                  value={formData.applicant_name}
                  onChange={handleInputChange}
                  placeholder="John Doe"
                  required
                  className="form-control"
                  style={{ fontSize: '14px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                  Applicant email *
                </label>
                <input
                  type="email"
                  name="applicant_email"
                  value={formData.applicant_email}
                  onChange={handleInputChange}
                  placeholder="john@example.com"
                  required
                  className="form-control"
                  style={{ fontSize: '14px' }}
                />
              </div>
            </div>

            {/* Row 2: Company & Type */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                  Company name *
                </label>
                <input
                  type="text"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleInputChange}
                  placeholder="Acme Corp"
                  required
                  className="form-control"
                  style={{ fontSize: '14px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                  Application type
                </label>
                <select
                  name="application_type"
                  value={formData.application_type}
                  onChange={handleInputChange}
                  className="form-select"
                  style={{ fontSize: '14px' }}
                >
                  {APPLICATION_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 3: Description */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                Description / purpose
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                placeholder="Provide context or describe the purpose of this filing…"
                className="form-control"
                style={{ fontSize: '14px', resize: 'vertical' }}
              />
            </div>

            {/* Autosave note */}
            <div style={{ background: '#F8F8FF', border: '1px solid #E8E5FF', borderRadius: '8px', padding: '10px 14px', marginBottom: '20px', fontSize: '12px', color: '#7060c0' }}>
              💾 Your draft is saved automatically as you type. You can close this page and return at any time.
            </div>

          </div>

          {/* Footer */}
          <div style={{ padding: '16px 24px', borderTop: '1px solid #F5F5F5', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FAFAFA' }}>
            <button
              type="button"
              className="btn btn-light border"
              onClick={() => navigate('/')}
            >
              Back to dashboard
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {!formData.tracking_number && saveStatus !== 'Saving' && saveStatus !== 'Idle' && (
                <span style={{ fontSize: '12px', color: '#aaa' }}>Draft will be created on first save…</span>
              )}
              {saveStatus === 'Saving' && (
                <span style={{ fontSize: '12px', color: '#854F0B' }}>Saving draft…</span>
              )}
              <button
                type="submit"
                className="btn btn-primary fw-bold px-4"
                disabled={isSubmitting || !formData.tracking_number || saveStatus === 'Saving'}
                title={
                  saveStatus === 'Saving' ? 'Please wait — saving draft…' :
                  !formData.tracking_number ? 'Start typing to auto-create a draft, then submit' : ''
                }
              >
                {isSubmitting ? (
                  <><span className="spinner-border spinner-border-sm me-2" role="status" />Submitting…</>
                ) : 'Submit application'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}