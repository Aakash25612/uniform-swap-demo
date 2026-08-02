export default function TeamPicker({ teams, value, onChange, label, excludeId }) {
  return (
    <div className="team-picker">
      <div className="field-label">{label}</div>
      <div className="team-grid" role="listbox" aria-label={label}>
        {teams.map((team) => {
          const disabled = excludeId && team.id === excludeId
          const selected = value === team.id
          return (
            <button
              key={team.id}
              type="button"
              role="option"
              aria-selected={selected}
              disabled={disabled}
              className={`team-chip ${selected ? 'is-selected' : ''}`}
              onClick={() => onChange(team.id)}
              style={{
                '--chip-primary': team.primary,
                '--chip-secondary': team.secondary,
                '--chip-accent': team.accent,
              }}
            >
              <span className="team-chip-swatch" aria-hidden />
              <span className="team-chip-text">
                <strong>{team.short}</strong>
                <small>{team.city}</small>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
