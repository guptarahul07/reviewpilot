// src/components/CSVImportModal.jsx
// Modal for importing historical Play Store reviews via CSV
// Handles: file upload → progress polling → completion/error states

import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { API_URL } from '../config/api'
import Button from './ui/Button'
import { X, Upload, FileText, ExternalLink, CheckCircle, AlertTriangle, Clock } from 'lucide-react'

const POLL_INTERVAL = 2000

export default function CSVImportModal({ packageName, appName, plan, onClose, onComplete }) {
  const { user } = useAuth()
  const fileInputRef = useRef(null)

  const [file, setFile]       = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [stage, setStage]     = useState('select') // select | uploading | processing | completed | error
  const [jobId, setJobId]     = useState(null)
  const [progress, setProgress] = useState(null) // { progress, importedReviews, skippedReviews, totalReviews, processedReviews }
  const [errorMsg, setErrorMsg] = useState('')
  const [uploadInfo, setUploadInfo] = useState(null) // { totalInFile, toImport, truncated, message }

  const isLockedPlan = !['growth', 'pro', 'bundle_growth', 'bundle_suite', 'admin'].includes(plan)

  /* ── Polling ── */
  useEffect(() => {
    if (stage !== 'processing' || !jobId) return
    const interval = setInterval(async () => {
      try {
        const token = await user.getIdToken()
        const res = await fetch(`${API_URL}/api/play/import-status/${jobId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (data.success) {
          setProgress(data)
          if (data.status === 'completed') {
            setStage('completed')
            clearInterval(interval)
            onComplete?.()
          } else if (data.status === 'failed') {
            setErrorMsg(data.error || 'Import failed unexpectedly.')
            setStage('error')
            clearInterval(interval)
          }
        }
      } catch { /* keep polling */ }
    }, POLL_INTERVAL)
    return () => clearInterval(interval)
  }, [stage, jobId, user, onComplete])

  /* ── File handling ── */
  function handleFileSelect(f) {
    if (!f) return
    if (!f.name.toLowerCase().endsWith('.csv')) {
      setErrorMsg('Please select a .csv file exported from Play Console.')
      return
    }
    setErrorMsg('')
    setFile(f)
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragOver(false)
    handleFileSelect(e.dataTransfer.files?.[0])
  }

  async function handleUpload() {
    if (!file) return
    setStage('uploading')
    setErrorMsg('')
    try {
      const token = await user.getIdToken()
      const formData = new FormData()
      formData.append('reviewsCsv', file)
      formData.append('packageName', packageName)

      const res  = await fetch(`${API_URL}/api/play/import-csv`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        setErrorMsg(data.message || data.error || 'Import failed. Please check your CSV file.')
        setStage('error')
        return
      }

      setUploadInfo(data)
      setJobId(data.jobId)
      setProgress({ progress: 0, importedReviews: 0, skippedReviews: 0, totalReviews: data.toImport, processedReviews: 0 })
      setStage('processing')
    } catch (err) {
      setErrorMsg('Network error — please try again.')
      setStage('error')
    }
  }

  function handleRetry() {
    setFile(null)
    setErrorMsg('')
    setUploadInfo(null)
    setProgress(null)
    setJobId(null)
    setStage('select')
  }

  /* ── Render helpers ── */
  const overlayStyle = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, padding: 20,
  }
  const cardStyle = {
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 18, maxWidth: 480, width: '100%',
    maxHeight: '90vh', overflow: 'auto', padding: 28,
  }

  /* ── Locked plan state ── */
  if (isLockedPlan) {
    return (
      <div style={overlayStyle} onClick={onClose}>
        <div style={cardStyle} onClick={e => e.stopPropagation()}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ margin: 0, fontSize: 18, fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--ink)' }}>
              📂 Historical Reviews Import
            </h2>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)' }}><X size={20} /></button>
          </div>
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🔒</div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', marginBottom: 10 }}>Available on Growth plan</h3>
            <p style={{ fontSize: 13.5, color: 'var(--ink-3)', lineHeight: 1.65, marginBottom: 24, maxWidth: 340, margin: '0 auto 24px' }}>
              Import your full review history beyond the last 7 days. Unlock version trends, sentiment analysis, and keyword insights from all your historical reviews.
            </p>
            <a href="/checkout?plan=growth" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--accent)', color: '#fff', textDecoration: 'none', borderRadius: 8, padding: '10px 22px', fontSize: 14, fontWeight: 600 }}>
              ⚡ Upgrade to Growth — ₹999/mo
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={overlayStyle} onClick={stage === 'processing' ? undefined : onClose}>
      <div style={cardStyle} onClick={e => e.stopPropagation()}>

        {/* ── Select stage ── */}
        {(stage === 'select' || stage === 'uploading') && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--ink)' }}>
                📂 Import Historical Reviews
              </h2>
              <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)' }}><X size={20} /></button>
            </div>
            <p style={{ fontSize: 12.5, color: 'var(--ink-3)', fontFamily: 'monospace', marginBottom: 18 }}>{packageName}</p>

            {/* How to export */}
            <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, marginBottom: 18 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 10 }}>
                How to export from Play Console
              </div>
              <ol style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {[
                  'Go to play.google.com/console',
                  'Select your app',
                  'Ratings & reviews → Reviews',
                  'Click ⬇ Download → "Download CSV"',
                ].map((step, i) => (
                  <li key={i} style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.7 }}>{step}</li>
                ))}
              </ol>
              <a href="https://play.google.com/console" target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 10, fontSize: 13, color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>
                Open Play Console <ExternalLink size={12} />
              </a>
            </div>

            {/* Dropzone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              style={{
                border: `2px dashed ${dragOver ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 12, padding: '28px 16px', textAlign: 'center',
                cursor: 'pointer', background: dragOver ? 'rgba(79,124,255,.05)' : 'var(--bg)',
                transition: 'all .15s', marginBottom: 14,
              }}
            >
              <input ref={fileInputRef} type="file" accept=".csv" onChange={e => handleFileSelect(e.target.files?.[0])} style={{ display: 'none' }} />
              {file ? (
                <>
                  <FileText size={28} style={{ color: 'var(--accent)', marginBottom: 8 }} />
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', marginBottom: 2 }}>{file.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{(file.size / 1024).toFixed(1)} KB — click to change</div>
                </>
              ) : (
                <>
                  <Upload size={28} style={{ color: 'var(--ink-3)', marginBottom: 8 }} />
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', marginBottom: 2 }}>Drop your CSV file here</div>
                  <div style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>or click to browse — accepts reviews.csv only</div>
                </>
              )}
            </div>

            {errorMsg && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 8, padding: '10px 12px', marginBottom: 14, fontSize: 13, color: '#fca5a5' }}>
                <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                {errorMsg}
              </div>
            )}

            {/* Plan limit notice */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, background: 'rgba(245,166,35,.06)', border: '1px solid rgba(245,166,35,.15)', borderRadius: 8, padding: '10px 12px', marginBottom: 20, fontSize: 12.5, color: 'var(--ink-2)' }}>
              <AlertTriangle size={14} style={{ color: 'var(--amber)', flexShrink: 0, marginTop: 1 }} />
              {plan === 'pro' || plan === 'bundle_suite'
                ? 'Pro plan: unlimited historical review import.'
                : 'Growth plan: up to 1,000 reviews per import. Upgrade to Pro for unlimited.'}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={onClose} style={{ flex: 1, background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 0', fontSize: 14, fontWeight: 600, color: 'var(--ink-3)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                Cancel
              </button>
              <Button onClick={handleUpload} disabled={!file || stage === 'uploading'} style={{ flex: 1, justifyContent: 'center' }}>
                {stage === 'uploading' ? 'Uploading…' : 'Upload & Analyze →'}
              </Button>
            </div>
          </>
        )}

        {/* ── Processing stage ── */}
        {stage === 'processing' && (
          <>
            <h2 style={{ margin: '0 0 4px', fontSize: 18, fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--ink)' }}>
              📂 Importing Reviews...
            </h2>
            {uploadInfo?.truncated && (
              <p style={{ fontSize: 12.5, color: 'var(--amber)', marginBottom: 14 }}>{uploadInfo.message}</p>
            )}

            <div style={{ marginTop: 18, marginBottom: 18 }}>
              <div style={{ height: 10, background: 'var(--border)', borderRadius: 5, overflow: 'hidden', marginBottom: 8 }}>
                <div style={{ width: `${progress?.progress || 0}%`, height: '100%', background: 'var(--accent)', borderRadius: 5, transition: 'width .4s ease' }} />
              </div>
              <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{progress?.progress || 0}%</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, color: 'var(--ink-2)' }}>
                <CheckCircle size={14} style={{ color: 'var(--green)' }} />
                {progress?.importedReviews || 0} reviews imported
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, color: 'var(--ink-2)' }}>
                <span style={{ fontSize: 14 }}>⏭</span>
                {progress?.skippedReviews || 0} skipped (already in system)
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, color: 'var(--ink-3)' }}>
                <Clock size={14} />
                {Math.max(0, (progress?.totalReviews || 0) - (progress?.processedReviews || 0))} remaining…
              </div>
            </div>

            <p style={{ fontSize: 12.5, color: 'var(--ink-3)', textAlign: 'center' }}>
              You can close this — we'll update your analytics when done.
            </p>
          </>
        )}

        {/* ── Completed stage ── */}
        {stage === 'completed' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
            <h2 style={{ margin: '0 0 4px', fontSize: 19, fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--ink)' }}>
              Import Complete!
            </h2>
            <p style={{ fontSize: 14, color: 'var(--ink-2)', marginBottom: 4 }}>
              <strong>{progress?.importedReviews || 0}</strong> reviews imported
            </p>
            <p style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 20 }}>
              {progress?.skippedReviews || 0} skipped (duplicates)
            </p>
            <p style={{ fontSize: 13.5, color: 'var(--ink-3)', marginBottom: 24 }}>
              Your analytics have been updated.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <a href="/reviews" style={{ flex: 1, textDecoration: 'none' }}>
                <Button style={{ width: '100%' }}>View Analytics →</Button>
              </a>
              <button onClick={onClose} style={{ flex: 1, background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 0', fontSize: 14, fontWeight: 600, color: 'var(--ink-3)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                Close
              </button>
            </div>
          </div>
        )}

        {/* ── Error stage ── */}
        {stage === 'error' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>❌</div>
            <h2 style={{ margin: '0 0 8px', fontSize: 19, fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--ink)' }}>
              Import Failed
            </h2>
            <p style={{ fontSize: 13.5, color: 'var(--ink-3)', lineHeight: 1.65, marginBottom: 24, maxWidth: 360, margin: '0 auto 24px' }}>
              {errorMsg || "This doesn't look like a Play Console CSV. Export from: Play Console → Reviews → Download CSV"}
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={handleRetry} style={{ flex: 1, background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 0', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                Try Again
              </button>
              <a href="/support" style={{ flex: 1, textDecoration: 'none' }}>
                <button style={{ width: '100%', background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 0', fontSize: 14, fontWeight: 600, color: 'var(--ink-3)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                  Contact Support
                </button>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
