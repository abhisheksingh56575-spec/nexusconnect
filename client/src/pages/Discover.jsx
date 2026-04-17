import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import API from '../api/axios';
import ProfileCard from '../components/ProfileCard';
import SkillTag from '../components/SkillTag';

export default function Discover() {
  const { user } = useAuth();
  const { success, error, info } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [connectMessage, setConnectMessage] = useState('');
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [viewUser, setViewUser] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await API.get('/users/matches');
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      const { data } = await API.get(`/users?${params.toString()}`);

      // Compute match percent client side for searched users
      const withMatch = data.map(u => {
        const commonSkills = (u.skills || []).filter(s =>
          (user.skills || []).map(cs => cs.toLowerCase()).includes(s.toLowerCase())
        );
        const commonInterests = (u.interests || []).filter(i =>
          (user.interests || []).map(ci => ci.toLowerCase()).includes(i.toLowerCase())
        );
        const totalCurrent = (user.skills || []).length + (user.interests || []).length;
        const totalCommon = commonSkills.length + commonInterests.length;
        const matchPercent = totalCurrent > 0 ? Math.round((totalCommon / totalCurrent) * 100) : 0;
        return { ...u, matchPercent, commonSkills, commonInterests };
      });

      withMatch.sort((a, b) => b.matchPercent - a.matchPercent);
      setUsers(withMatch);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u => {
    if (activeFilter === 'high-match') return u.matchPercent >= 50;
    if (activeFilter === 'has-skills') return (u.skills || []).length > 0;
    if (activeFilter === 'has-projects') return (u.projects || []).length > 0;
    return true;
  });

  const openConnectModal = (targetUser) => {
    setSelectedUser(targetUser);
    setConnectMessage('');
    setProjectTitle('');
    setProjectDesc('');
    setShowConnectModal(true);
  };

  const sendRequest = async () => {
    try {
      await API.post('/collaborations/requests', {
        to: selectedUser._id,
        message: connectMessage,
        projectIdea: {
          title: projectTitle,
          description: projectDesc,
        },
      });
      success('Request Sent! ⚡', `Collaboration request sent to ${selectedUser.name}`);
      setShowConnectModal(false);
    } catch (err) {
      error('Failed', err.response?.data?.message || 'Could not send request');
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const filters = [
    { id: 'all', label: '🌐 All Students' },
    { id: 'high-match', label: '🎯 High Match' },
    { id: 'has-skills', label: '💡 Has Skills' },
    { id: 'has-projects', label: '📁 Has Projects' },
  ];

  return (
    <div className="page">
      <div className="page-header animate-fade-in-up">
        <h1>
          🔍 <span className="page-header-gradient">Discover Collaborators</span>
        </h1>
        <p>Find students with matching skills and interests to build amazing projects together.</p>
      </div>

      {/* Search */}
      <div className="search-bar animate-fade-in-up">
        <span style={{ fontSize: '1.1rem' }}>🔍</span>
        <input
          type="text"
          placeholder="Search by name, skills, or interests..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button className="btn btn-primary btn-sm" onClick={handleSearch}>
          Search
        </button>
      </div>

      {/* Filters */}
      <div className="discover-filters animate-fade-in-up">
        {filters.map(filter => (
          <button
            key={filter.id}
            className={`filter-chip ${activeFilter === filter.id ? 'active' : ''}`}
            onClick={() => setActiveFilter(filter.id)}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Results count */}
      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
        Showing {filteredUsers.length} student{filteredUsers.length !== 1 ? 's' : ''}
      </p>

      {/* Users Grid */}
      {loading ? (
        <div className="grid-auto">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="skeleton skeleton-card" style={{ height: '250px' }} />
          ))}
        </div>
      ) : filteredUsers.length > 0 ? (
        <div className="grid-auto">
          {filteredUsers.map((u) => (
            <ProfileCard
              key={u._id}
              user={u}
              matchPercent={u.matchPercent}
              onConnect={openConnectModal}
              onViewProfile={(user) => setViewUser(user)}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">🔭</div>
          <h3>No students found</h3>
          <p>Try adjusting your search or filters to find collaborators.</p>
        </div>
      )}

      {/* Connect Modal */}
      {showConnectModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowConnectModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>⚡ Send Collaboration Request</h2>
              <button className="modal-close" onClick={() => setShowConnectModal(false)}>×</button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <div className="profile-card-avatar" style={{ width: '48px', height: '48px', fontSize: '1rem' }}>
                {getInitials(selectedUser.name)}
              </div>
              <div>
                <h3 style={{ fontSize: '1rem' }}>{selectedUser.name}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  {selectedUser.university || 'Student'}
                </p>
              </div>
              {selectedUser.matchPercent > 0 && (
                <span className={`profile-card-match ${selectedUser.matchPercent >= 50 ? 'match-high' : 'match-medium'}`} style={{ position: 'static' }}>
                  {selectedUser.matchPercent}% Match
                </span>
              )}
            </div>

            <div className="auth-form">
              <div className="input-group">
                <label>Project Idea Title</label>
                <input
                  className="input"
                  placeholder="e.g., AI-Powered Study Buddy"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                />
              </div>

              <div className="input-group">
                <label>Project Description</label>
                <textarea
                  className="input"
                  placeholder="Describe your project idea..."
                  value={projectDesc}
                  onChange={(e) => setProjectDesc(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="input-group">
                <label>Personal Message</label>
                <textarea
                  className="input"
                  placeholder="Hey! I love your work on..."
                  value={connectMessage}
                  onChange={(e) => setConnectMessage(e.target.value)}
                  rows={2}
                />
              </div>

              <button className="btn btn-primary" onClick={sendRequest}>
                Send Request ⚡
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Profile Modal */}
      {viewUser && (
        <div className="modal-overlay" onClick={() => setViewUser(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '560px' }}>
            <div className="modal-header">
              <h2>👤 Profile</h2>
              <button className="modal-close" onClick={() => setViewUser(null)}>×</button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
              <div className="profile-card-avatar" style={{ width: '64px', height: '64px', fontSize: '1.5rem' }}>
                {getInitials(viewUser.name)}
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem' }}>{viewUser.name}</h3>
                <p style={{ color: 'var(--text-secondary)' }}>
                  {viewUser.university || 'Student'}{viewUser.year ? ` · ${viewUser.year}` : ''}
                </p>
              </div>
            </div>

            {viewUser.bio && (
              <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '0.9rem', lineHeight: 1.6 }}>
                {viewUser.bio}
              </p>
            )}

            {(viewUser.skills || []).length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Skills</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {viewUser.skills.map((s, i) => (
                    <SkillTag key={i} label={s} index={i} />
                  ))}
                </div>
              </div>
            )}

            {(viewUser.interests || []).length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Interests</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {viewUser.interests.map((s, i) => (
                    <SkillTag key={i} label={s} variant="cyan" />
                  ))}
                </div>
              </div>
            )}

            {(viewUser.projects || []).length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Projects</h4>
                {viewUser.projects.map((p, i) => (
                  <div key={i} className="glass-card" style={{ padding: '12px', marginBottom: '8px' }}>
                    <h5 style={{ fontSize: '0.95rem' }}>{p.title}</h5>
                    {p.description && <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{p.description}</p>}
                  </div>
                ))}
              </div>
            )}

            {viewUser.matchPercent > 0 && (
              <div style={{
                background: 'rgba(108,92,231,0.1)',
                borderRadius: '12px',
                padding: '16px',
                textAlign: 'center',
                marginBottom: '16px',
              }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-secondary)' }}>
                  {viewUser.matchPercent}% Match
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {(viewUser.commonSkills || []).length} shared skills · {(viewUser.commonInterests || []).length} shared interests
                </p>
              </div>
            )}

            <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => {
              setViewUser(null);
              openConnectModal(viewUser);
            }}>
              Connect with {viewUser.name?.split(' ')[0]} ⚡
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
