import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import API from '../api/axios';
import SkillTag from '../components/SkillTag';
import RadarChart from '../components/RadarChart';

export default function Profile() {
  const { user, updateUser, fetchUser } = useAuth();
  const { success, error } = useToast();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    university: '',
    year: '',
    skills: [],
    interests: [],
    projects: [],
  });
  const [newSkill, setNewSkill] = useState('');
  const [newInterest, setNewInterest] = useState('');
  const [newProject, setNewProject] = useState({ title: '', description: '', techStack: '', link: '' });
  const [skillLevels, setSkillLevels] = useState({});

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        bio: user.bio || '',
        university: user.university || '',
        year: user.year || '',
        skills: user.skills || [],
        interests: user.interests || [],
        projects: user.projects || [],
      });
      // Build skill levels from user data or defaults
      const levels = {};
      (user.skills || []).forEach(s => {
        levels[s] = user.skillLevels?.[s] || 70;
      });
      setSkillLevels(levels);
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const addSkill = (e) => {
    e.preventDefault();
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData({ ...formData, skills: [...formData.skills, newSkill.trim()] });
      setSkillLevels({ ...skillLevels, [newSkill.trim()]: 70 });
      setNewSkill('');
    }
  };

  const removeSkill = (skill) => {
    setFormData({ ...formData, skills: formData.skills.filter(s => s !== skill) });
    const newLevels = { ...skillLevels };
    delete newLevels[skill];
    setSkillLevels(newLevels);
  };

  const addInterest = (e) => {
    e.preventDefault();
    if (newInterest.trim() && !formData.interests.includes(newInterest.trim())) {
      setFormData({ ...formData, interests: [...formData.interests, newInterest.trim()] });
      setNewInterest('');
    }
  };

  const removeInterest = (interest) => {
    setFormData({ ...formData, interests: formData.interests.filter(i => i !== interest) });
  };

  const addProject = () => {
    if (newProject.title.trim()) {
      const project = {
        ...newProject,
        techStack: newProject.techStack.split(',').map(t => t.trim()).filter(Boolean),
      };
      setFormData({ ...formData, projects: [...formData.projects, project] });
      setNewProject({ title: '', description: '', techStack: '', link: '' });
    }
  };

  const removeProject = (index) => {
    setFormData({
      ...formData,
      projects: formData.projects.filter((_, i) => i !== index),
    });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data } = await API.put('/users/profile', {
        ...formData,
        skillLevels,
      });
      updateUser(data);
      await fetchUser();
      success('Profile Updated! ✨', 'Your changes have been saved');
      setEditing(false);
    } catch (err) {
      error('Update Failed', err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="page animate-fade-in-up">
      {/* Profile Hero */}
      <div className="profile-hero">
        <div className="profile-hero-content">
          <div className="profile-hero-avatar">
            {getInitials(user?.name)}
          </div>
          <div className="profile-hero-info" style={{ flex: 1 }}>
            {editing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input
                  name="name"
                  className="input"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your name"
                  style={{ fontSize: '1.3rem', fontWeight: 600 }}
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <input
                    name="university"
                    className="input"
                    value={formData.university}
                    onChange={handleChange}
                    placeholder="University"
                  />
                  <select name="year" className="input" value={formData.year} onChange={handleChange}>
                    <option value="">Select Year</option>
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                    <option value="Graduate">Graduate</option>
                    <option value="PhD">PhD</option>
                  </select>
                </div>
                <textarea
                  name="bio"
                  className="input"
                  value={formData.bio}
                  onChange={handleChange}
                  placeholder="Tell us about yourself..."
                  rows={3}
                />
              </div>
            ) : (
              <>
                <h1>{user?.name}</h1>
                <p className="university">
                  {user?.university || 'University not set'}{user?.year ? ` · ${user.year}` : ''}
                </p>
                <p className="bio">{user?.bio || 'No bio yet. Click edit to add one!'}</p>
              </>
            )}
          </div>
          <div>
            {editing ? (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={loading}>
                  {loading ? '⏳' : '💾'} Save
                </button>
                <button className="btn btn-outline btn-sm" onClick={() => setEditing(false)}>
                  Cancel
                </button>
              </div>
            ) : (
              <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}>
                ✏️ Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Skills */}
        <div className="profile-section">
          <h2>💡 Skills</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: editing ? '16px' : 0 }}>
            {formData.skills.length > 0 ? (
              formData.skills.map((skill, i) => (
                <SkillTag
                  key={i}
                  label={skill}
                  index={i}
                  onRemove={editing ? () => removeSkill(skill) : undefined}
                />
              ))
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No skills added yet</p>
            )}
          </div>
          {editing && (
            <form onSubmit={addSkill} style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <input
                className="input"
                placeholder="Add a skill (e.g., React, Python)"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                style={{ flex: 1 }}
              />
              <button type="submit" className="btn btn-primary btn-sm">+ Add</button>
            </form>
          )}
        </div>

        {/* Interests */}
        <div className="profile-section">
          <h2>❤️ Interests</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: editing ? '16px' : 0 }}>
            {formData.interests.length > 0 ? (
              formData.interests.map((interest, i) => (
                <SkillTag
                  key={i}
                  label={interest}
                  variant="cyan"
                  onRemove={editing ? () => removeInterest(interest) : undefined}
                />
              ))
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No interests added yet</p>
            )}
          </div>
          {editing && (
            <form onSubmit={addInterest} style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <input
                className="input"
                placeholder="Add an interest (e.g., AI, Web3)"
                value={newInterest}
                onChange={(e) => setNewInterest(e.target.value)}
                style={{ flex: 1 }}
              />
              <button type="submit" className="btn btn-primary btn-sm">+ Add</button>
            </form>
          )}
        </div>
      </div>

      {/* Radar Chart */}
      {formData.skills.length >= 3 && (
        <div className="profile-section" style={{ marginTop: '24px' }}>
          <h2>📊 Skill Radar</h2>
          {editing && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '16px' }}>
              Adjust skill levels using the sliders below:
            </p>
          )}
          <RadarChart skills={skillLevels} size={320} />
          {editing && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px' }}>
              {formData.skills.map((skill) => (
                <div key={skill} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', minWidth: '80px' }}>{skill}</span>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={skillLevels[skill] || 70}
                    onChange={(e) => setSkillLevels({ ...skillLevels, [skill]: parseInt(e.target.value) })}
                    style={{ flex: 1, accentColor: '#6c5ce7' }}
                  />
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', minWidth: '30px' }}>
                    {skillLevels[skill] || 70}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Projects */}
      <div className="profile-section" style={{ marginTop: '24px' }}>
        <h2>🚀 Projects</h2>
        {formData.projects.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {formData.projects.map((project, i) => (
              <div key={i} className="glass-card" style={{ position: 'relative' }}>
                {editing && (
                  <button
                    onClick={() => removeProject(i)}
                    style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      background: 'rgba(231,76,60,0.15)',
                      border: '1px solid rgba(231,76,60,0.3)',
                      color: '#e74c3c',
                      width: '28px',
                      height: '28px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.8rem',
                    }}
                  >
                    ×
                  </button>
                )}
                <h3 style={{ fontSize: '1.05rem', marginBottom: '8px' }}>{project.title}</h3>
                {project.description && (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '10px' }}>
                    {project.description}
                  </p>
                )}
                {project.techStack && project.techStack.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {(Array.isArray(project.techStack) ? project.techStack : []).map((tech, j) => (
                      <SkillTag key={j} label={tech} variant="green" />
                    ))}
                  </div>
                )}
                {project.link && (
                  <a
                    href={project.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--accent-secondary)', fontSize: '0.85rem', display: 'block', marginTop: '8px' }}
                  >
                    🔗 View Project
                  </a>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No projects added yet</p>
        )}

        {editing && (
          <div className="glass-card" style={{ marginTop: '16px', background: 'rgba(108,92,231,0.05)' }}>
            <h4 style={{ fontSize: '0.95rem', marginBottom: '12px' }}>Add New Project</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input
                className="input"
                placeholder="Project Title"
                value={newProject.title}
                onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
              />
              <textarea
                className="input"
                placeholder="Project Description"
                value={newProject.description}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                rows={2}
              />
              <input
                className="input"
                placeholder="Tech Stack (comma-separated, e.g., React, Node.js, MongoDB)"
                value={newProject.techStack}
                onChange={(e) => setNewProject({ ...newProject, techStack: e.target.value })}
              />
              <input
                className="input"
                placeholder="Project Link (optional)"
                value={newProject.link}
                onChange={(e) => setNewProject({ ...newProject, link: e.target.value })}
              />
              <button className="btn btn-primary btn-sm" onClick={addProject}>
                + Add Project
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
