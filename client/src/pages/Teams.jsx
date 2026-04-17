import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import API from '../api/axios';
import SkillTag from '../components/SkillTag';

export default function Teams() {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(null);
  const [showAddMemberModal, setShowAddMemberModal] = useState(null);
  const [newTeam, setNewTeam] = useState({
    name: '',
    description: '',
    projectTitle: '',
    projectDescription: '',
    techStack: '',
  });
  const [allUsers, setAllUsers] = useState([]);
  const [memberSearch, setMemberSearch] = useState('');

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const { data } = await API.get('/teams');
      setTeams(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const createTeam = async () => {
    try {
      await API.post('/teams', {
        name: newTeam.name,
        description: newTeam.description,
        project: {
          title: newTeam.projectTitle,
          description: newTeam.projectDescription,
          techStack: newTeam.techStack.split(',').map(t => t.trim()).filter(Boolean),
        },
      });
      success('Team Created! 🎉', `${newTeam.name} has been created`);
      setShowCreateModal(false);
      setNewTeam({ name: '', description: '', projectTitle: '', projectDescription: '', techStack: '' });
      fetchTeams();
    } catch (err) {
      error('Error', err.response?.data?.message || 'Failed to create team');
    }
  };

  const fetchUsersForAdd = async () => {
    try {
      const { data } = await API.get('/users');
      setAllUsers(data);
    } catch (err) {
      console.error(err);
    }
  };

  const openAddMember = (team) => {
    setShowAddMemberModal(team);
    fetchUsersForAdd();
    setMemberSearch('');
  };

  const addMember = async (userId) => {
    try {
      await API.post(`/teams/${showAddMemberModal._id}/members`, { userId });
      success('Member Added! 👥', 'New member has been added to the team');
      setShowAddMemberModal(null);
      fetchTeams();
    } catch (err) {
      error('Error', err.response?.data?.message || 'Failed to add member');
    }
  };

  const updateTeamStatus = async (teamId, status) => {
    try {
      await API.put(`/teams/${teamId}`, { project: { status } });
      success('Status Updated', `Team status changed to ${status}`);
      fetchTeams();
      setShowDetailModal(null);
    } catch (err) {
      error('Error', 'Failed to update status');
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getStatusClass = (status) => {
    const map = {
      'planning': 'status-planning',
      'in-progress': 'status-in-progress',
      'completed': 'status-completed',
      'on-hold': 'status-on-hold',
    };
    return map[status] || 'status-planning';
  };

  return (
    <div className="page animate-fade-in-up">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>👥 <span className="page-header-gradient">My Teams</span></h1>
          <p>Manage your project teams and collaborate with peers.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          + Create Team
        </button>
      </div>

      {loading ? (
        <div className="grid-auto">
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton skeleton-card" style={{ height: '200px' }} />
          ))}
        </div>
      ) : teams.length > 0 ? (
        <div className="grid-auto">
          {teams.map((team) => (
            <div key={team._id} className="team-card" onClick={() => setShowDetailModal(team)} style={{ cursor: 'pointer' }}>
              <div className="team-card-header">
                <h3>{team.name}</h3>
                <span className={`team-status ${getStatusClass(team.project?.status)}`}>
                  {team.project?.status || 'planning'}
                </span>
              </div>

              {team.description && (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '12px' }}>
                  {team.description}
                </p>
              )}

              {team.project?.title && (
                <p style={{ fontSize: '0.9rem', marginBottom: '12px' }}>
                  📁 {team.project.title}
                </p>
              )}

              <div className="team-members">
                {(team.members || []).slice(0, 4).map((member, i) => (
                  <div key={i} className="team-member-avatar" title={member.name}>
                    {getInitials(member.name)}
                  </div>
                ))}
                {(team.members || []).length > 4 && (
                  <div className="team-member-count">
                    +{team.members.length - 4}
                  </div>
                )}
                <span style={{ marginLeft: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {team.members?.length || 0} member{(team.members?.length || 0) !== 1 ? 's' : ''}
                </span>
              </div>

              {team.project?.techStack?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {team.project.techStack.map((tech, i) => (
                    <SkillTag key={i} label={tech} variant="green" />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">👥</div>
          <h3>No teams yet</h3>
          <p>Create your first team to start collaborating on projects!</p>
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            Create Your First Team
          </button>
        </div>
      )}

      {/* Create Team Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🚀 Create New Team</h2>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>×</button>
            </div>

            <div className="auth-form">
              <div className="input-group">
                <label>Team Name</label>
                <input
                  className="input"
                  placeholder="e.g., Dream Team Alpha"
                  value={newTeam.name}
                  onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                />
              </div>
              <div className="input-group">
                <label>Description</label>
                <textarea
                  className="input"
                  placeholder="What's your team about?"
                  value={newTeam.description}
                  onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="input-group">
                <label>Project Title</label>
                <input
                  className="input"
                  placeholder="e.g., AI-Powered Study Platform"
                  value={newTeam.projectTitle}
                  onChange={(e) => setNewTeam({ ...newTeam, projectTitle: e.target.value })}
                />
              </div>
              <div className="input-group">
                <label>Project Description</label>
                <textarea
                  className="input"
                  placeholder="Describe the project..."
                  value={newTeam.projectDescription}
                  onChange={(e) => setNewTeam({ ...newTeam, projectDescription: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="input-group">
                <label>Tech Stack (comma-separated)</label>
                <input
                  className="input"
                  placeholder="React, Node.js, MongoDB"
                  value={newTeam.techStack}
                  onChange={(e) => setNewTeam({ ...newTeam, techStack: e.target.value })}
                />
              </div>
              <button className="btn btn-primary" onClick={createTeam}>
                Create Team 🚀
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Team Detail Modal */}
      {showDetailModal && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
            <div className="modal-header">
              <h2>{showDetailModal.name}</h2>
              <button className="modal-close" onClick={() => setShowDetailModal(null)}>×</button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <span className={`team-status ${getStatusClass(showDetailModal.project?.status)}`}>
                {showDetailModal.project?.status || 'planning'}
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                Created {new Date(showDetailModal.createdAt).toLocaleDateString()}
              </span>
            </div>

            {showDetailModal.description && (
              <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>{showDetailModal.description}</p>
            )}

            {showDetailModal.project?.title && (
              <div className="glass-card" style={{ marginBottom: '16px' }}>
                <h4 style={{ marginBottom: '8px' }}>📁 {showDetailModal.project.title}</h4>
                {showDetailModal.project.description && (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    {showDetailModal.project.description}
                  </p>
                )}
                {showDetailModal.project.techStack?.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '10px' }}>
                    {showDetailModal.project.techStack.map((t, i) => (
                      <SkillTag key={i} label={t} variant="green" />
                    ))}
                  </div>
                )}
              </div>
            )}

            <h4 style={{ marginBottom: '12px' }}>👥 Members ({showDetailModal.members?.length || 0})</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              {(showDetailModal.members || []).map((member, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', borderRadius: '10px', background: 'rgba(108,92,231,0.05)' }}>
                  <div className="team-member-avatar" style={{ marginLeft: 0 }}>
                    {getInitials(member.name)}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{member.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {showDetailModal.lead?._id === member._id && '⭐ Lead · '}{member.email}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {showDetailModal.lead?._id === user?._id && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => openAddMember(showDetailModal)}>
                  + Add Member
                </button>
                {showDetailModal.project?.status !== 'completed' && (
                  <button
                    className="btn btn-success btn-sm"
                    onClick={() => updateTeamStatus(showDetailModal._id, 'in-progress')}
                  >
                    ▶ Start Project
                  </button>
                )}
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => updateTeamStatus(showDetailModal._id, 'completed')}
                >
                  ✓ Mark Complete
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <div className="modal-overlay" onClick={() => setShowAddMemberModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Team Member</h2>
              <button className="modal-close" onClick={() => setShowAddMemberModal(null)}>×</button>
            </div>

            <input
              className="input"
              placeholder="Search students..."
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              style={{ marginBottom: '16px' }}
            />

            <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {allUsers
                .filter(u =>
                  u.name.toLowerCase().includes(memberSearch.toLowerCase()) &&
                  !(showAddMemberModal.members || []).some(m => m._id === u._id)
                )
                .map(u => (
                  <div
                    key={u._id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px',
                      borderRadius: '10px',
                      background: 'rgba(108,92,231,0.05)',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                    }}
                    onClick={() => addMember(u._id)}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(108,92,231,0.15)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(108,92,231,0.05)'}
                  >
                    <div className="team-member-avatar" style={{ marginLeft: 0 }}>
                      {getInitials(u.name)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{u.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.university || 'Student'}</div>
                    </div>
                    <span style={{ color: 'var(--accent-secondary)', fontSize: '0.85rem' }}>+ Add</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
