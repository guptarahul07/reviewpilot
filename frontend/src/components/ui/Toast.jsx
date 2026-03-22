import { useEffect } from 'react'
import { CheckCircle, XCircle, X } from 'lucide-react'
import './Toast.css'

export default function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000)
    return () => clearTimeout(t)
  }, [onClose])

  const Icon = type === 'success' ? CheckCircle : XCircle

  return (
    <div className={`toast toast--${type} animate-fade-up`}>
      <Icon size={16} className="toast__icon" />
      <span className="toast__msg">{message}</span>
      <button className="toast__close" onClick={onClose} aria-label="Dismiss">
        <X size={14} />
      </button>
    </div>
  )
}
