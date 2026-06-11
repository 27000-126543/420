import { useEffect, useRef, useState } from 'react'
import { Wifi, AlertTriangle, AlertCircle, Zap } from 'lucide-react'
import { useCityStore } from '@/store/useCityStore'
import LayerToggle from './LayerToggle'

function useAnimatedNumber(target: number, duration = 800) {
  const [value, setValue] = useState(0)
  const ref = useRef({ start: 0, startTime: 0 })
  useEffect(() => {
    ref.current = { start: value, startTime: performance.now() }
    const step = (now: number) => {
      const elapsed = now - ref.current.startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(ref.current.start + (target - ref.current.start) * eased))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [target, duration])
  return value
}

function MetricCard({
  icon: Icon,
  label,
  value,
  subtitle,
  color,
  blink,
}: {
  icon: React.ElementType
  label: string
  value: string
  subtitle: string
  color: string
  blink?: boolean
}) {
  return (
    <div className="rounded-lg border border-cyber-border bg-cyber-card/60 p-3 transition-colors hover:border-cyber-blue/30">
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${color} ${blink ? 'animate-blink' : ''}`} />
        <span className="text-xs text-cyber-muted">{label}</span>
      </div>
      <div className={`mt-1 font-mono text-2xl font-bold ${color}`}>{value}</div>
      <div className="mt-0.5 text-[10px] text-cyber-muted">{subtitle}</div>
    </div>
  )
}

export default function DataPanel() {
  const sensors = useCityStore((s) => s.sensors)
  const alerts = useCityStore((s) => s.alerts)
  const events = useCityStore((s) => s.events)
  const energyData = useCityStore((s) => s.energyData)

  const onlineSensors = sensors.filter((s) => s.status === 'online').length
  const totalSensors = sensors.length
  const activeAlerts = alerts.length
  const pendingEvents = events.filter((e) => e.status !== 'resolved').length
  const hasCritical = events.some((e) => e.level === 'critical' && e.status !== 'resolved')
  const totalKw = energyData.reduce((sum, e) => sum + e.currentKw, 0)

  const animOnline = useAnimatedNumber(onlineSensors)
  const animAlerts = useAnimatedNumber(activeAlerts)
  const animPending = useAnimatedNumber(pendingEvents)
  const animKw = useAnimatedNumber(Math.round(totalKw))

  const formattedKw = animKw.toLocaleString('en-US')

  return (
    <aside className="fixed left-0 top-16 bottom-16 z-40 flex w-72 flex-col gap-3 overflow-y-auto border-r border-cyber-blue/20 bg-cyber-bg/90 p-4 backdrop-blur-md">
      <div className="flex flex-col gap-2.5">
        <MetricCard
          icon={Wifi}
          label="传感器在线"
          value={`${animOnline}/${totalSensors}`}
          subtitle={totalSensors > 0 ? `${Math.round((onlineSensors / totalSensors) * 100)}% 在线率` : '暂无数据'}
          color="text-cyber-green"
        />
        <MetricCard
          icon={AlertTriangle}
          label="活跃预警"
          value={String(animAlerts)}
          subtitle={activeAlerts > 0 ? '需要关注' : '系统正常'}
          color="text-cyber-orange"
          blink={activeAlerts > 0}
        />
        <MetricCard
          icon={AlertCircle}
          label="待处理事件"
          value={String(animPending)}
          subtitle={hasCritical ? '存在紧急事件' : '运行平稳'}
          color={hasCritical ? 'text-cyber-red' : 'text-cyber-orange'}
        />
        <MetricCard
          icon={Zap}
          label="总能耗"
          value={`${formattedKw} kW`}
          subtitle="实时功率"
          color="text-cyber-blue"
        />
      </div>

      <div className="mt-auto border-t border-cyber-border pt-3">
        <LayerToggle />
      </div>
    </aside>
  )
}
