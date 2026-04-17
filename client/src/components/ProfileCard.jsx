import SkillTag from './SkillTag';

export default function ProfileCard({ user, matchPercent, onConnect, onViewProfile }) {
  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getMatchClass = (percent) => {
    if (percent >= 60) return 'match-high';
    if (percent >= 30) return 'match-medium';
    return 'match-low';
  };

  return (
    <div className="profile-card animate-fade-in-up">
      {matchPercent !== undefined && matchPercent > 0 && (
        <div className={`profile-card-match ${getMatchClass(matchPercent)}`}>
          {matchPercent}% Match
        </div>
      )}

      <div className="profile-card-header">
        <div className="profile-card-avatar">
          {getInitials(user.name)}
        </div>
        <div className="profile-card-info">
          <h3>{user.name}</h3>
          <p>{user.university || 'Student'}{user.year ? ` · ${user.year}` : ''}</p>
        </div>
      </div>

      {user.bio && (
        <p className="profile-card-bio">{user.bio}</p>
      )}

      <div className="profile-card-skills">
        {(user.skills || []).slice(0, 4).map((skill, i) => (
          <SkillTag key={i} label={skill} index={i} />
        ))}
        {(user.skills || []).length > 4 && (
          <span className="skill-tag skill-tag-purple" style={{ opacity: 0.6 }}>
            +{user.skills.length - 4}
          </span>
        )}
      </div>

      <div className="profile-card-actions">
        {onViewProfile && (
          <button className="btn btn-secondary btn-sm" onClick={() => onViewProfile(user)}>
            View Profile
          </button>
        )}
        {onConnect && (
          <button className="btn btn-primary btn-sm" onClick={() => onConnect(user)}>
            Connect ⚡
          </button>
        )}
      </div>
    </div>
  );
}
