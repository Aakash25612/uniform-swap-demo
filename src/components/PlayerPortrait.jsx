import { buildPortraitSvg } from '../lib/portrait'

export default function PlayerPortrait({
  player,
  team,
  width = 320,
  className = '',
  showNumber = true,
}) {
  const w = 320
  const h = 400
  const svg = buildPortraitSvg(player, team, {
    showNumber,
    uid: `view-${player.id}-${team.id}-${showNumber ? 'n' : 'x'}`,
  })
  // Strip XML declaration for inline SVG
  const inline = svg.replace(/^<\?xml[^>]*>\s*/i, '')

  return (
    <div
      className={className}
      style={{ width, height: (width / w) * h }}
      role="img"
      aria-label={`${player.name} in ${team.name} kit`}
      dangerouslySetInnerHTML={{ __html: inline.replace(/width="320"/, `width="${width}"`).replace(/height="400"/, `height="${(width / w) * h}"`) }}
    />
  )
}
