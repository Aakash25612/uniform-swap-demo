/**
 * Chest-up player portrait with swappable hat + jersey.
 * Keeps the same body silhouette when the kit changes.
 */
export default function PlayerPortrait({
  player,
  team,
  width = 320,
  className = '',
  showNumber = true,
}) {
  const w = 320
  const h = 400
  const jersey = team.primary
  const trim = team.secondary
  const hat = team.hat
  const accent = team.accent

  return (
    <svg
      className={className}
      width={width}
      height={(width / w) * h}
      viewBox={`0 0 ${w} ${h}`}
      role="img"
      aria-label={`${player.name} in ${team.name} kit`}
    >
      <defs>
        <linearGradient id={`bg-${team.id}-${player.id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a2233" />
          <stop offset="100%" stopColor="#0b1018" />
        </linearGradient>
        <clipPath id={`frame-${player.id}-${team.id}`}>
          <rect x="0" y="0" width={w} height={h} rx="8" />
        </clipPath>
        {team.pinstripe && (
          <pattern
            id={`pin-${player.id}`}
            width="10"
            height="10"
            patternUnits="userSpaceOnUse"
          >
            <rect width="10" height="10" fill={trim} />
            <rect x="4.5" width="1.2" height="10" fill={jersey} opacity="0.35" />
          </pattern>
        )}
      </defs>

      <g clipPath={`url(#frame-${player.id}-${team.id})`}>
        <rect width={w} height={h} fill={`url(#bg-${team.id}-${player.id})`} />

        {/* soft stadium glow */}
        <ellipse cx="160" cy="380" rx="140" ry="40" fill={jersey} opacity="0.18" />

        {/* shoulders / jersey body */}
        <path
          d="M40 400 C40 280 80 250 160 250 C240 250 280 280 280 400 Z"
          fill={team.pinstripe ? `url(#pin-${player.id})` : jersey}
        />

        {/* collar */}
        <path
          d="M118 258 C130 278 145 288 160 288 C175 288 190 278 202 258 L160 272 Z"
          fill={trim}
          opacity="0.95"
        />
        <path
          d="M122 255 C134 272 148 280 160 280 C172 280 186 272 198 255"
          fill="none"
          stroke={accent}
          strokeWidth="2.5"
          opacity="0.7"
        />

        {/* placket / buttons hint */}
        <line x1="160" y1="288" x2="160" y2="400" stroke={accent} strokeWidth="1.5" opacity="0.35" />

        {/* jersey number */}
        {showNumber && (
          <text
            x="160"
            y="360"
            textAnchor="middle"
            fill={trim}
            fontFamily="Anton, sans-serif"
            fontSize="72"
            opacity="0.92"
            letterSpacing="2"
          >
            {player.number}
          </text>
        )}

        {/* neck */}
        <path
          d="M138 220 C138 245 145 258 160 258 C175 258 182 245 182 220 Z"
          fill={player.skin}
        />

        {/* head */}
        <ellipse cx="160" cy="168" rx="48" ry="58" fill={player.skin} />

        {/* ears */}
        <ellipse cx="110" cy="170" rx="10" ry="14" fill={player.skin} />
        <ellipse cx="210" cy="170" rx="10" ry="14" fill={player.skin} />

        {/* hair under hat */}
        <path
          d="M112 150 C118 118 140 105 160 105 C180 105 202 118 208 150 L208 140 C200 112 178 98 160 98 C142 98 120 112 112 140 Z"
          fill={player.hair}
        />

        {/* face details */}
        <ellipse cx="142" cy="172" rx="5" ry="6" fill="#2a1f18" opacity="0.75" />
        <ellipse cx="178" cy="172" rx="5" ry="6" fill="#2a1f18" opacity="0.75" />
        <path
          d="M150 198 Q160 206 170 198"
          fill="none"
          stroke="#5c4033"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.55"
        />
        <path
          d="M156 178 L160 188 L164 178"
          fill="none"
          stroke="#5c4033"
          strokeWidth="1.8"
          opacity="0.4"
        />

        {/* baseball cap */}
        <path
          d="M100 148 C108 108 130 92 160 92 C190 92 212 108 220 148 C190 138 130 138 100 148 Z"
          fill={hat}
        />
        {/* brim */}
        <ellipse cx="160" cy="148" rx="72" ry="14" fill={hat} />
        <ellipse cx="160" cy="146" rx="72" ry="10" fill="#000" opacity="0.15" />
        {/* logo on hat */}
        <text
          x="160"
          y="132"
          textAnchor="middle"
          fill={trim === '#FFFFFF' || trim === '#ffffff' ? trim : accent}
          fontFamily="Anton, sans-serif"
          fontSize={team.logoLetter.length > 1 ? 22 : 28}
          letterSpacing="1"
        >
          {team.logoLetter}
        </text>

        {/* subtle shoulder seam */}
        <path
          d="M55 320 Q100 290 160 295 Q220 290 265 320"
          fill="none"
          stroke="#000"
          strokeWidth="2"
          opacity="0.12"
        />
      </g>

      {/* frame border */}
      <rect
        x="0.75"
        y="0.75"
        width={w - 1.5}
        height={h - 1.5}
        rx="8"
        fill="none"
        stroke="rgba(255,255,255,0.12)"
        strokeWidth="1.5"
      />
    </svg>
  )
}
