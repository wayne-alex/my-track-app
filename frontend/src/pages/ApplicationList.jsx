import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const STATUS_TABS = ['All', 'Draft', 'Submitted', 'Under Review', 'Need More Information', 'Approved', 'Rejected'];

const STATUS_STYLES = {
  Draft:                  { bg: '#F1EFE8', color: '#5F5E5A', icon: '✏️' },
  Submitted:              { bg: '#E6F1FB', color: '#185FA5', icon: '📤' },
  'Under Review':         { bg: '#FAEEDA', color: '#854F0B', icon: '🔍' },
  'Need More Information':{ bg: '#FAECE7', color: '#993C1D', icon: '⚠️' },
  Approved:               { bg: '#EAF3DE', color: '#3B6D11', icon: '✅' },
  Rejected:               { bg: '#FCEBEB', color: '#A32D2D', icon: '❌' },
};

function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || { bg: '#F1EFE8', color: '#444' };
  return (
    <span style={{
      display: 'inline-block',
      background: style.bg,
      color: style.color,
      fontSize: '11px',
      fontWeight: 600,
      padding: '3px 10px',
      borderRadius: '20px',
      whiteSpace: 'nowrap',
      letterSpacing: '0.01em',
    }}>
      {status}
    </span>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #EBEBEB',
      borderRadius: '10px',
      padding: '14px 18px',
      minWidth: 0,
    }}>
      <div style={{ fontSize: '11px', color: '#999', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>{label}</div>
      <div style={{ fontSize: '26px', fontWeight: 700, color: color || '#1a1a1a', lineHeight: 1 }}>{value}</div>
    </div>
  );
}

export default function ApplicationList() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('http://localhost:8000/api/applications')
      .then((res) => {
        setApplications(Array.isArray(res.data) ? res.data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const stats = useMemo(() => ({
    total: applications.length,
    underReview: applications.filter(a => a.status === 'Under Review').length,
    approved: applications.filter(a => a.status === 'Approved').length,
    needInfo: applications.filter(a => a.status === 'Need More Information').length,
  }), [applications]);

  const filtered = useMemo(() => {
    return applications.filter(app => {
      const matchStatus = filterStatus === 'All' || app.status === filterStatus;
      const q = searchQuery.toLowerCase();
      const matchSearch = !q ||
        app.tracking_number?.toLowerCase().includes(q) ||
        app.applicant_name?.toLowerCase().includes(q) ||
        app.company_name?.toLowerCase().includes(q) ||
        app.application_type?.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [applications, filterStatus, searchQuery]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: '12px' }}>
        <div className="spinner-border text-primary" role="status" />
        <p style={{ color: '#888', fontSize: '14px', margin: 0 }}>Loading applications…</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        <StatCard label="Total applications" value={stats.total} />
        <StatCard label="Under review" value={stats.underReview} color="#854F0B" />
        <StatCard label="Approved" value={stats.approved} color="#3B6D11" />
        <StatCard label="Need more info" value={stats.needInfo} color="#A32D2D" />
      </div>

      {/* Main Card */}
      <div style={{ background: '#fff', border: '1px solid #EBEBEB', borderRadius: '12px', overflow: 'hidden' }}>

        {/* Card Header */}
        <div style={{ padding: '18px 20px 0', borderBottom: '1px solid #F2F2F2' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0 , color: '#000'}}>Workflow pipeline</h2>
            <button
              className="btn btn-primary btn-sm fw-semibold"
              onClick={() => navigate('/new')}
            >
              + New application
            </button>
          </div>

          {/* Search */}
          <div style={{ position: 'relative', marginBottom: '14px' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#aaa', fontSize: '15px' }}>🔍</span>
            <input
              type="text"
              placeholder="Search by name, company, tracking number…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                fontSize: '13px',
                border: '1px solid #E8E8E8',
                borderRadius: '8px',
                background: '#FAFAFA',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', fontSize: '16px', lineHeight: 1 }}
              >×</button>
            )}
          </div>

          {/* Filter Tabs */}
          <div style={{ display: 'flex', gap: '2px', overflowX: 'auto', paddingBottom: '1px' }}>
            {STATUS_TABS.map(tab => {
              const count = tab === 'All' ? applications.length : applications.filter(a => a.status === tab).length;
              const active = filterStatus === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setFilterStatus(tab)}
                  style={{
                    padding: '7px 12px',
                    fontSize: '12px',
                    fontWeight: active ? 600 : 400,
                    border: 'none',
                    borderBottom: active ? '2px solid #5340c8' : '2px solid transparent',
                    background: 'transparent',
                    color: active ? '#5340c8' : '#888',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    borderRadius: '0',
                    transition: 'all 0.15s',
                  }}
                >
                  {tab}
                  {count > 0 && (
                    <span style={{
                      marginLeft: '5px',
                      background: active ? '#EDE9FF' : '#F2F2F2',
                      color: active ? '#5340c8' : '#999',
                      fontSize: '10px',
                      fontWeight: 600,
                      padding: '1px 6px',
                      borderRadius: '10px',
                    }}>{count}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: '#aaa' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔎</div>
            <p style={{ margin: 0, fontSize: '14px' }}>No applications match your current filters.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#FAFAFA' }}>
                  {['Tracking no.', 'Applicant name', 'Company', 'Type', 'Status', 'Created', ''].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((app) => (
                  <tr
                    key={app.tracking_number}
                    style={{ borderTop: '1px solid #F5F5F5', transition: 'background 0.1s', cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}
                    onClick={() => navigate(`/application/${app.tracking_number}`)}
                  >
                    <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: 600, color: '#5340c8', fontSize: '12px' }}>
                      {app.tracking_number}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 500 }}>{app.applicant_name}</td>
                    <td style={{ padding: '12px 16px', color: '#555' }}>{app.company_name}</td>
                    <td style={{ padding: '12px 16px', color: '#777' }}>{app.application_type}</td>
                    <td style={{ padding: '12px 16px' }}><StatusBadge status={app.status} /></td>
                    <td style={{ padding: '12px 16px', color: '#aaa', fontSize: '12px', whiteSpace: 'nowrap' }}>
                      {new Date(app.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                      <button
                        className="btn btn-sm btn-outline-primary fw-semibold"
                        onClick={() => navigate(`/application/${app.tracking_number}`)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer count */}
        <div style={{ padding: '10px 16px', borderTop: '1px solid #F5F5F5', fontSize: '12px', color: '#bbb' }}>
          Showing {filtered.length} of {applications.length} application{applications.length !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
}