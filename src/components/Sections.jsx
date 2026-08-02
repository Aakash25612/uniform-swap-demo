import { ArrowRight, Download, Layers, Shirt, Wand2 } from 'lucide-react'

export function Header() {
  return (
    <header className="site-header">
      <a className="brand" href="#top">
        <span className="brand-mark" aria-hidden>
          TK
        </span>
        <span className="brand-name">TradeKit</span>
      </a>
      <nav className="site-nav">
        <a href="#studio">Studio</a>
        <a href="#how">How it works</a>
        <a href="#integrate">Integrate</a>
      </nav>
      <a className="btn btn-ghost" href="#studio">
        Open studio
      </a>
    </header>
  )
}

export function Hero() {
  return (
    <section className="hero" id="top">
      <div className="hero-bg" aria-hidden />
      <div className="hero-copy">
        <p className="eyebrow">Chest-up uniform & hat swap</p>
        <h1 className="brand-hero">TradeKit</h1>
        <p className="lede">
          Switch a traded player into a new team kit — same body, new jersey and hat —
          ready for your headshot templates.
        </p>
        <div className="hero-cta">
          <a className="btn btn-primary" href="#studio">
            Try the demo <ArrowRight size={18} />
          </a>
          <a className="btn btn-ghost" href="#how">
            See the pipeline
          </a>
        </div>
      </div>
    </section>
  )
}

export function HowItWorks() {
  const items = [
    {
      icon: Layers,
      title: 'Lock body composition',
      text: 'Face, neck, and shoulder silhouette stay fixed so the player still looks like themselves.',
    },
    {
      icon: Shirt,
      title: 'Swap kit from chest up',
      text: 'Jersey, collar, number treatment, and cap colors remap to the destination franchise.',
    },
    {
      icon: Wand2,
      title: 'Export for templates',
      text: 'Output PNG/TIFF assets that drop into your existing background-removal & layout pipeline.',
    },
  ]

  return (
    <section className="section" id="how">
      <div className="section-head">
        <h2>Built for trade-day creative</h2>
        <p>This build runs a real client-side color remap in-browser. Production would swap in ML segmentation for photo-real results.</p>
      </div>
      <div className="feature-row">
        {items.map(({ icon: Icon, title, text }) => (
          <article key={title} className="feature">
            <div className="feature-icon">
              <Icon size={20} strokeWidth={1.75} />
            </div>
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

export function Integrate() {
  return (
    <section className="section integrate" id="integrate">
      <div className="integrate-panel">
        <div>
          <h2>Plug into your existing app</h2>
          <p>
            Designed to sit beside background removal, sizing, and template placement.
            Accept PNG/TIFF in, return kit-swapped chest-up assets out — same dimensions, same pose.
          </p>
          <ul className="integrate-list">
            <li>API-shaped job queue for batch trades</li>
            <li>Team kit library with hat + jersey variants</li>
            <li>Preserve transparency for template overlays</li>
          </ul>
        </div>
        <div className="integrate-code" aria-hidden>
          <pre>{`POST /v1/kit-swap
{
  "source": "player.png",
  "from_team": "NYY",
  "to_team": "LAD",
  "region": "chest_up",
  "preserve": ["body", "pose", "face"]
}`}</pre>
        </div>
      </div>
    </section>
  )
}

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="brand">
        <span className="brand-mark" aria-hidden>
          TK
        </span>
        <span className="brand-name">TradeKit</span>
      </div>
      <p>Client-side kit swap · React + Vite · Vercel ready · no server</p>
      <p className="fine">
        Demo remaps jersey/hat colors in the browser. Sample portraits are illustrative; production
        would use licensed team assets and ML segmentation.
      </p>
    </footer>
  )
}

export function ExportBar({ disabled, onExport, teamName, playerName }) {
  return (
    <div className="export-bar">
      <div>
        <strong>{playerName}</strong>
        <span> → {teamName}</span>
      </div>
      <button type="button" className="btn btn-primary" disabled={disabled} onClick={onExport}>
        <Download size={16} /> Export PNG
      </button>
    </div>
  )
}
