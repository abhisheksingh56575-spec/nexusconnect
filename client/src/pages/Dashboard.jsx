import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import API from '../api/axios';
import ProfileCard from '../components/ProfileCard';
import SkillTag from '../components/SkillTag';

export default function Dashboard() {
  const { user } = useAuth();
  const { success, error, info } = useToast();
  const [stats, setStats] = useState({ matches: 0, teams: 0, requests: 0, history: 0 });
  const [topMatches, setTopMatches] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [matchesRes, requestsRes, teamsRes, historyRes] = await Promise.all([
        API.get('/users/matches'),
        API.get('/collaborations/requests?type=received'),
        API.get('/teams'),
        API.get('/collaborations/history'),
      ]);

      setTopMatches(matchesRes.data.slice(0, 3));
      const pending = requestsRes.data.filter(r => r.status === 'pending');
      setPendingRequests(pending);

      setStats({
        matches: matchesRes.data.filter(m => m.matchPercent > 0).length,
        teams: teamsRes.data.length,
        requests: pending.length,
        history: historyRes.data.length,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAction = async (requestId, status) => {
    try {
      await API.put(`/collaborations/requests/${requestId}`, { status });
      if (status === 'accepted') {
        success('Request Accepted! 🎉', 'A new collaboration has been created');
      } else {
        info('Request Declined', 'The request has been declined');
      }
      fetchDashboardData();
    } catch (err) {
      error('Error', 'Failed to update request');
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <div className="page">
        <div className="dashboard-stats">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="skeleton skeleton-card" style={{ height: '120px' }} />
          ))}
        </div>
        <div className="grid-3" style={{ marginTop: '24px' }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton skeleton-card" style={{ height: '200px' }} />
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    { icon: '🎯', value: stats.matches, label: 'Skill Matches', color: 'rgba(108, 92, 231, 0.15)' },
    { icon: '👥', value: stats.teams, label: 'Active Teams', color: 'rgba(0, 206, 201, 0.15)' },
    { icon: '📨', value: stats.requests, label: 'Pending Requests', color: 'rgba(253, 121, 168, 0.15)' },
    { icon: '🏆', value: stats.history, label: 'Collaborations', color: 'rgba(0, 184, 148, 0.15)' },
  ];

  return (
    <div className="page animate-fade-in-up">
      <div className="dashboard-welcome">
        <h1>
          <span className="wave">👋</span> Welcome back, {user?.name?.split(' ')[0]}!
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
          Here's what's happening in your network today.
        </p>
      </div>

      {/* Stats */}
      <div className="dashboard-stats">
        {statCards.map((stat, i) => (
          <div key={i} className="stat-card">
            <div className="stat-card-icon" style={{ background: stat.color }}>
              {stat.icon}
            </div>
            <div className="stat-card-value">{stat.value}</div>
            <div className="stat-card-label">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="dashboard-section">
          <div className="dashboard-section-header">
            <h2>📨 Pending Requests</h2>
            <Link to="/discover" className="btn btn-secondary btn-sm">View All</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {pendingRequests.slice(0, 3).map((req) => (
              <div key={req._id} className="request-card">
                <div className="profile-card-avatar" style={{ width: '48px', height: '48px', fontSize: '1rem' }}>
                  {getInitials(req.from?.name)}
                </div>
                <div className="request-card-content">
                  <h4>{req.from?.name}</h4>
                  <p>{req.projectIdea?.title || req.message || 'Wants to collaborate with you!'}</p>
                  <div className="request-card-actions">
                    <button
                      className="btn btn-success btn-sm"
                      onClick={() => handleRequestAction(req._id, 'accepted')}
                    >
                      ✓ Accept
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleRequestAction(req._id, 'rejected')}
                    >
                      ✕ Decline
                    </button>
                  </div>
                </div>
                <span className="request-card-time">
                  {new Date(req.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Matches */}
      <div className="dashboard-section">
        <div className="dashboard-section-header">
          <h2>🎯 Top Matches for You</h2>
          <Link to="/discover" className="btn btn-secondary btn-sm">Discover More</Link>
        </div>
        {topMatches.length > 0 ? (
          <div className="grid-3">
            {topMatches.map((match) => (
              <ProfileCard
                key={match._id}
                user={match}
                matchPercent={match.matchPercent}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">🌱</div>
            <h3>No matches yet</h3>
            <p>Add skills and interests to your profile to find matching collaborators!</p>
            <Link to="/profile" className="btn btn-primary">
              Complete Your Profile
            </Link>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="dashboard-section">
        <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.3rem', marginBottom: '16px' }}>
          ⚡ Quick Actions
        </h2>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Link to="/profile" className="btn btn-secondary">👤 Edit Profile</Link>
          <Link to="/discover" className="btn btn-secondary">🔍 Find Collaborators</Link>
          <Link to="/teams" className="btn btn-secondary">👥 Create Team</Link>
          <Link to="/history" className="btn btn-secondary">📊 View History</Link>
        </div>
      </div>
    </div>
  );
}
