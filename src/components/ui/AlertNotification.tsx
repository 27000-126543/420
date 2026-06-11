import { useEffect } from 'react'
import { AlertTriangle, AlertOctagon, X } from 'lucide-react'
import { useCityStore } from '@/store/useCityStore'

const AUTO_DISMISS_MS = 8000
const MAX_VISIBLE = 3

function AlertItem({
  alert,
  onDismiss,
}: {
  alert: { id: string; message: string; level: 'warning' | 'critical'; timestamp: number }
  onDismiss: () => void
}) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, AUTO_DISMISS_MS)
    return () => clearTimeout(timer)
  }, [onDismiss])

  const isCritical = alert.level === 'critical'
  const borderColor = isCritical ? 'border-l-cyber-red' : 'border-l-cyber-orange'
  const Icon = isCritical ? AlertOctagon : AlertTriangle
  const iconColor = isCritical ? 'text-cyber-red' : 'text-cyber-orange'
  const timeStr = new Date(alert.timestamp).toTimeString().slice(0, 8)

  return (
    <div
      className={`animate-slide-in-right flex items-start gap-3 rounded-lg border border-cyber-border ${borderColor} border-l-4 bg-cyber-card/80 p-3 shadow-lg backdrop-blur-sm`}
    >
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${iconColor}`} />
      <div className="min-w-0 flex-1">
        <p className="text-sm text-white">{alert.message}</p>
        <span className="font-mono text-[10px] text-cyber-muted">{timeStr}</span>
      </div>
      <button
        onClick={onDismiss}
        className="shrink-0 text-cyber-muted transition-colors hover:text-white"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

export default function AlertNotification() {
  const alerts = useCityStore((s) => s.alerts)
  const removeAlert = useCityStore((s) => s.removeAlert)

  const visible = alerts.slice(-MAX_VISIBLE)

  if (visible.length === 0) return null

  return (
    <div className="fixed top-20 right-4 z-50 flex w-80 flex-col gap-2">
      {visible.map((alert) => (
        <AlertItem key={alert.id} alert={alert} onDismiss={() => removeAlert(alert.id)} />
      ))}
    </div>
  )
}
