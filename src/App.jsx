import { Footer, Header, Hero, HowItWorks, Integrate } from './components/Sections'
import Studio from './components/Studio'

export default function App() {
  return (
    <div className="app">
      <Header />
      <main>
        <Hero />
        <Studio />
        <HowItWorks />
        <Integrate />
      </main>
      <Footer />
    </div>
  )
}
