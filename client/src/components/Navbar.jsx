import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import API from '../api/axios';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [pendingCount, setPendingCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (user) {
      fetchPendingCount();
    }
  }, [user, location]);

  const fetchPendingCount = async () => {
    try {
      const { data } = await API.get('/collaborations/requests?type=received');
      const pending = data.filter(r => r.status === 'pending').length;
      setPendingCount(pending);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setShowDropdown(false);
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <Link to={user ? '/dashboard' : '/'} className="navbar-brand">
        <div className="navbar-brand-icon">⚡</div>
        Student Networking Platform
      </Link>

      {user && (
        <div className="navbar-links">
          <Link to="/dashboard" className={`navbar-link ${isActive('/dashboard') ? 'active' : ''}`}>
            Dashboard
          </Link>
          <Link to="/discover" className={`navbar-link ${isActive('/discover') ? 'active' : ''}`}>
            Discover
          </Link>
          <Link to="/teams" className={`navbar-link ${isActive('/teams') ? 'active' : ''}`}>
            Teams
          </Link>
          <Link to="/history" className={`navbar-link ${isActive('/history') ? 'active' : ''}`}>
            History
          </Link>
        </div>
      )}

      <div className="navbar-right">
        {user ? (
          <>
            <Link to="/dashboard" className="notification-bell" title="Pending requests">
              🔔
              {pendingCount > 0 && (
                <span className="notification-badge">{pendingCount}</span>
              )}
            </Link>
            <div style={{ position: 'relative' }}>
              <div
                className="navbar-avatar"
                onClick={() => setShowDropdown(!showDropdown)}
                title={user.name}
              >
                {getInitials(user.name)}
              </div>
              {showDropdown && (
                <div style={{
                  position: 'absolute',
                  top: '50px',
                  right: 0,
                  background: 'rgba(20, 20, 60, 0.95)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(108, 92, 231, 0.2)',
                  borderRadius: '12px',
                  padding: '8px',
                  minWidth: '180px',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
                  zIndex: 1001,
                }}>
                  <Link
                    to="/profile"
                    onClick={() => setShowDropdown(false)}
                    style={{
                      display: 'block',
                      padding: '10px 16px',
                      borderRadius: '8px',
                      color: '#e8e8ff',
                      fontSize: '0.9rem',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => e.target.style.background = 'rgba(108,92,231,0.15)'}
                    onMouseLeave={(e) => e.target.style.background = 'transparent'}
                  >
                    👤 My Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '10px 16px',
                      borderRadius: '8px',
                      color: '#e74c3c',
                      fontSize: '0.9rem',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => e.target.style.background = 'rgba(231,76,60,0.1)'}
                    onMouseLeave={(e) => e.target.style.background = 'transparent'}
                  >
                    🚪 Logout
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link to="/login" className="btn btn-secondary btn-sm">Login</Link>
            <Link to="/register" className="btn btn-primary btn-sm">Sign Up</Link>
          </div>
        )}
      </div>
    </nav>
  );
}
