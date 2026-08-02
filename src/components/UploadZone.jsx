import { useCallback, useRef, useState } from 'react'
import { FileImage, Upload, X } from 'lucide-react'

const ACCEPT = '.png,.tif,.tiff,image/png,image/tiff'

export default function UploadZone({ file, previewUrl, onFile, onClear }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  const handleFiles = useCallback(
    (list) => {
      const f = list?.[0]
      if (!f) return
      const ok =
        f.type === 'image/png' ||
        f.type === 'image/tiff' ||
        /\.(png|tif|tiff)$/i.test(f.name)
      if (!ok) {
        window.alert('Please upload a PNG or TIFF file.')
        return
      }
      onFile(f)
    },
    [onFile],
  )

  return (
    <div className="upload-zone">
      {previewUrl ? (
        <div className="upload-preview">
          <img src={previewUrl} alt="Uploaded headshot" />
          <button type="button" className="upload-clear" onClick={onClear} aria-label="Remove file">
            <X size={16} />
          </button>
          <div className="upload-meta">
            <FileImage size={14} />
            <span>{file?.name}</span>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className={`upload-drop ${dragging ? 'is-dragging' : ''}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            handleFiles(e.dataTransfer.files)
          }}
        >
          <span className="upload-icon">
            <Upload size={22} strokeWidth={1.75} />
          </span>
          <strong>Drop player headshot</strong>
          <span>PNG or TIFF · chest-up preferred</span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        hidden
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  )
}
