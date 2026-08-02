import Studio from './components/Studio'

export default function App() {
  return (
    <div className="app">
      <header className="topbar">
        <a className="logo" href="/">
          TradeKit
        </a>
      </header>

      <main className="main">
        <section className="intro">
          <h1>Trade kit swap</h1>
          <p>
            Choose who they should look like, then the new player photo. We keep the player and
            copy the kit.
          </p>
        </section>
        <Studio />
      </main>

      <footer className="footer">
        <p>Chest-up uniform & hat swap</p>
      </footer>
    </div>
  )
}
