const TAG_COLORS = ['purple', 'cyan', 'pink', 'green', 'orange'];

export default function SkillTag({ label, variant, onRemove, index = 0 }) {
  const color = variant || TAG_COLORS[index % TAG_COLORS.length];

  return (
    <span className={`skill-tag skill-tag-${color}`}>
      {label}
      {onRemove && (
        <span className="remove-tag" onClick={onRemove}>×</span>
      )}
    </span>
  );
}
