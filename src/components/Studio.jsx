import { useState } from 'react'
import { ArrowRight, Download } from 'lucide-react'
import { SAMPLE_PLAYERS } from '../data/players'
import { requestAiKitSwap } from '../lib/aiKitSwap'
import PhotoSlot, { ResultCompare, WorkingOverlay, useObjectUrl } from './PhotoSlot'

export default function Studio() {
  const [referenceFile, setReferenceFile] = useState(null)
  const [referenceSample, setReferenceSample] = useState(SAMPLE_PLAYERS[0].photo)
  const [playerFile, setPlayerFile] = useState(null)
  const [playerSample, setPlayerSample] = useState(SAMPLE_PLAYERS[1].photo)

  const referenceObject = useObjectUrl(referenceFile)
  const playerObject = useObjectUrl(playerFile)

  const referenceUrl = referenceObject || referenceSample
  const playerUrl = playerObject || playerSample

  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [beforeUrl, setBeforeUrl] = useState(null)
  const [afterUrl, setAfterUrl] = useState(null)

  const canRun = Boolean(referenceUrl && playerUrl) && !processing

  const run = async () => {
    if (!canRun) return
    setProcessing(true)
    setError('')
    setBeforeUrl(null)
    setAfterUrl(null)
    try {
      const result = await requestAiKitSwap({
        playerUrl,
        referenceUrl,
      })
      setBeforeUrl(result.beforeUrl)
      setAfterUrl(result.afterUrl)
    } catch (err) {
      console.error(err)
      setError(err.message || 'Something went wrong')
    } finally {
      setProcessing(false)
    }
  }

  const exportPng = () => {
    if (!afterUrl) return
    const a = document.createElement('a')
    a.href = afterUrl
    a.download = 'tradekit-swap.png'
    a.click()
  }

  return (
    <section className="studio">
      <WorkingOverlay active={processing} />

      <div className="inputs">
        <PhotoSlot
          label="Look like"
          hint="Kit reference — the uniform and hat to copy"
          previewUrl={referenceUrl}
          onFile={(f) => {
            setReferenceFile(f)
            setReferenceSample(null)
            setBeforeUrl(null)
            setAfterUrl(null)
          }}
          onClear={() => {
            setReferenceFile(null)
            setReferenceSample(null)
            setBeforeUrl(null)
            setAfterUrl(null)
          }}
          samples={SAMPLE_PLAYERS}
          onSample={(s) => {
            setReferenceFile(null)
            setReferenceSample(s.photo)
            setBeforeUrl(null)
            setAfterUrl(null)
          }}
        />

        <PhotoSlot
          label="New player"
          hint="The player to keep — face and body stay the same"
          previewUrl={playerUrl}
          onFile={(f) => {
            setPlayerFile(f)
            setPlayerSample(null)
            setBeforeUrl(null)
            setAfterUrl(null)
          }}
          onClear={() => {
            setPlayerFile(null)
            setPlayerSample(null)
            setBeforeUrl(null)
            setAfterUrl(null)
          }}
          samples={SAMPLE_PLAYERS}
          onSample={(s) => {
            setPlayerFile(null)
            setPlayerSample(s.photo)
            setBeforeUrl(null)
            setAfterUrl(null)
          }}
        />
      </div>

      <div className="actions">
        <button type="button" className="btn-primary" disabled={!canRun} onClick={run}>
          Generate
          <ArrowRight size={16} />
        </button>
        {error ? <p className="error">{error}</p> : null}
      </div>

      {beforeUrl && afterUrl ? (
        <div className="output">
          <ResultCompare beforeUrl={beforeUrl} afterUrl={afterUrl} />
          <button type="button" className="btn-secondary" onClick={exportPng}>
            <Download size={16} />
            Download PNG
          </button>
        </div>
      ) : null}
    </section>
  )
}
