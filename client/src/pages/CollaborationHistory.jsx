import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import API from '../api/axios';
import SkillTag from '../components/SkillTag';

export default function CollaborationHistory() {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [collaborations, setCollaborations] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('history');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [historyRes, requestsRes] = await Promise.all([
        API.get('/collaborations/history'),
        API.get('/collaborations/requests'),
      ]);
      setCollaborations(historyRes.data);
      setRequests(requestsRes.data);
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
        success('Accepted! 🎉', 'Collaboration started');
      } else {
        success('Declined', 'Request has been declined');
      }
      fetchData();
    } catch (err) {
      error('Error', 'Failed to update request');
    }
  };

  const markCompleted = async (collabId) => {
    try {
      await API.put(`/collaborations/${collabId}`, {
        status: 'completed',
        endDate: new Date().toISOString(),
      });
      success('Completed! 🏆', 'Collaboration marked as completed');
      fetchData();
    } catch (err) {
      error('Error', 'Failed to update collaboration');
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const pendingReceived = requests.filter(r => r.status === 'pending' && r.to?._id === user?._id);
  const sentRequests = requests.filter(r => r.from?._id === user?._id);

  return (
    <div className="page animate-fade-in-up">
      <div className="page-header">
        <h1>📊 <span className="page-header-gradient">Collaboration Hub</span></h1>
        <p>Track your collaboration history, requests, and connections.</p>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          🏆 History ({collaborations.length})
        </button>
        <button
          className={`tab ${activeTab === 'received' ? 'active' : ''}`}
          onClick={() => setActiveTab('received')}
        >
          📨 Received ({pendingReceived.length})
        </button>
        <button
          className={`tab ${activeTab === 'sent' ? 'active' : ''}`}
          onClick={() => setActiveTab('sent')}
        >
          📤 Sent ({sentRequests.length})
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton skeleton-card" style={{ height: '120px' }} />
          ))}
        </div>
      ) : (
        <>
          {/* History Tab */}
          {activeTab === 'history' && (
            collaborations.length > 0 ? (
              <div className="timeline">
                {collaborations.map((collab) => (
                  <div key={collab._id} className="timeline-item">
                    <div className={`timeline-dot ${collab.status === 'active' ? 'active' : 'completed'}`} />
                    <div className="timeline-content">
                      <div className="timeline-date">
                        {formatDate(collab.startDate || collab.createdAt)}
                        {collab.endDate && ` — ${formatDate(collab.endDate)}`}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <h3>{collab.project?.title || 'Untitled Collaboration'}</h3>
                        <span className={`team-status ${collab.status === 'active' ? 'status-in-progress' : 'status-completed'}`}>
                          {collab.status}
                        </span>
                      </div>
                      {collab.project?.description && (
                        <p>{collab.project.description}</p>
                      )}
                      {collab.project?.outcome && (
                        <p style={{ color: 'var(--accent-green)', fontSize: '0.85rem' }}>
                          ✓ Outcome: {collab.project.outcome}
                        </p>
                      )}
                      <div className="timeline-participants">
                        {(collab.participants || []).map((p, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div className="team-member-avatar" style={{ marginLeft: 0, width: '28px', height: '28px', fontSize: '0.65rem' }}>
                              {getInitials(p.name)}
                            </div>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{p.name}</span>
                          </div>
                        ))}
                      </div>
                      {collab.status === 'active' && (
                        <button
                          className="btn btn-success btn-sm"
                          style={{ marginTop: '12px' }}
                          onClick={() => markCompleted(collab._id)}
                        >
                          ✓ Mark as Completed
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">📜</div>
                <h3>No collaboration history yet</h3>
                <p>Start by discovering collaborators and sending requests!</p>
              </div>
            )
          )}

          {/* Received Requests Tab */}
          {activeTab === 'received' && (
            pendingReceived.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {pendingReceived.map((req) => (
                  <div key={req._id} className="request-card">
                    <div className="profile-card-avatar" style={{ width: '48px', height: '48px', fontSize: '1rem' }}>
                      {getInitials(req.from?.name)}
                    </div>
                    <div className="request-card-content">
                      <h4>{req.from?.name}</h4>
                      {req.projectIdea?.title && (
                        <p style={{ fontWeight: 500, color: 'var(--text-primary)', marginBottom: '4px' }}>
                          📁 {req.projectIdea.title}
                        </p>
                      )}
                      <p>{req.message || req.projectIdea?.description || 'Wants to collaborate with you!'}</p>
                      {(req.from?.skills || []).length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
                          {req.from.skills.slice(0, 4).map((s, i) => (
                            <SkillTag key={i} label={s} index={i} />
                          ))}
                        </div>
                      )}
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
                    <span className="request-card-time">{formatDate(req.createdAt)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">📨</div>
                <h3>No pending requests</h3>
                <p>You're all caught up! Check back later for new requests.</p>
              </div>
            )
          )}

          {/* Sent Requests Tab */}
          {activeTab === 'sent' && (
            sentRequests.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {sentRequests.map((req) => (
                  <div key={req._id} className="request-card">
                    <div className="profile-card-avatar" style={{ width: '48px', height: '48px', fontSize: '1rem' }}>
                      {getInitials(req.to?.name)}
                    </div>
                    <div className="request-card-content">
                      <h4>To: {req.to?.name}</h4>
                      {req.projectIdea?.title && (
                        <p style={{ fontWeight: 500, color: 'var(--text-primary)' }}>📁 {req.projectIdea.title}</p>
                      )}
                      <p>{req.message || 'Collaboration request sent'}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className={`team-status ${
                        req.status === 'accepted' ? 'status-completed' :
                        req.status === 'rejected' ? 'status-on-hold' :
                        'status-planning'
                      }`}>
                        {req.status}
                      </span>
                      <div className="request-card-time" style={{ marginTop: '4px' }}>
                        {formatDate(req.createdAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">📤</div>
                <h3>No sent requests</h3>
                <p>Head to Discover to find and connect with collaborators!</p>
              </div>
            )
          )}
        </>
      )}
    </div>
  );
}
