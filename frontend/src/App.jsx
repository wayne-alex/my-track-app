import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import ApplicationList from './pages/ApplicationList';
import ApplicationForm from './pages/ApplicationForm';
import ApplicationDetail from './pages/ApplicationDetail';

function NavBar() {
  const location = useLocation();
  const isNew = location.pathname === '/new';

  return (
    <header style={{
      background: '#fff',
      borderBottom: '1px solid #EBEBEB',
      padding: '0 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: '56px',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      {/* Brand */}
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
        <div style={{
          width: '32px', height: '32px',
          background: '#5340c8',
          borderRadius: '8px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '16px',
        }}>
          📋
        </div>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#1a1a1a', lineHeight: 1.1 }}>WorkflowTracker</div>
          <div style={{ fontSize: '11px', color: '#aaa', lineHeight: 1.1 }}>Application management</div>
        </div>
      </Link>

      {/* Nav links */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <Link
          to="/"
          style={{
            fontSize: '13px',
            fontWeight: 500,
            color: location.pathname === '/' ? '#5340c8' : '#666',
            textDecoration: 'none',
            padding: '6px 12px',
            borderRadius: '6px',
            background: location.pathname === '/' ? '#EDE9FF' : 'transparent',
            transition: 'all 0.15s',
          }}
        >
          All applications
        </Link>

        <Link
          to="/new"
          style={{
            fontSize: '13px',
            fontWeight: 600,
            color: isNew ? '#3d2ea0' : '#fff',
            textDecoration: 'none',
            padding: '7px 16px',
            borderRadius: '8px',
            background: isNew ? '#EDE9FF' : '#5340c8',
            border: isNew ? '1px solid #c0b4f5' : '1px solid transparent',
            transition: 'all 0.15s',
            marginLeft: '4px',
          }}
        >
          + New application
        </Link>
      </nav>
    </header>
  );
}

function Layout() {
  return (
    <div style={{ minHeight: '100vh', background: '#F7F7F8', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <NavBar />
      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '28px 24px' }}>
        <Routes>
          <Route path="/" element={<ApplicationList />} />
          <Route path="/new" element={<ApplicationForm />} />
          <Route path="/edit/:trackingNumber" element={<ApplicationForm />} />
          <Route path="/application/:trackingNumber" element={<ApplicationDetail />} />
        </Routes>
      </main>
      <footer style={{ textAlign: 'center', padding: '24px', fontSize: '12px', color: '#ccc', borderTop: '1px solid #EBEBEB', marginTop: '40px', background: '#fff' }}>
        WorkflowTracker — Application Management System
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Layout />
    </Router>
  );
}