import { Activity, Wind, Zap, AlertTriangle, Shield, Bell, Diamond } from 'lucide-react'
import { useCityStore } from '@/store/useCityStore'
import type { PanelType, LayerKey } from '@/types'

const tabs: { key: PanelType; label: string; icon: React.ElementType; layer?: LayerKey }[] = [
  { key: 'traffic', label: '交通调度', icon: Activity, layer: 'traffic' },
  { key: 'environment', label: '环境监测', icon: Wind, layer: 'environment' },
  { key: 'energy', label: '能耗分析', icon: Zap, layer: 'energy' },
  { key: 'events', label: '事件处置', icon: AlertTriangle, layer: 'events' },
  { key: 'admin', label: '权限管控', icon: Shield },
]

const roleLabels: Record<string, string> = {
  city: '市级',
  district: '区级',
  street: '街道级',
  enterprise: '企业级',
}

export default function TopNav() {
  const activePanel = useCityStore((s) => s.activePanel)
  const setActivePanel = useCityStore((s) => s.setActivePanel)
  const alerts = useCityStore((s) => s.alerts)
  const currentUser = useCityStore((s) => s.currentUser)

  const permittedLayers = currentUser.permittedLayers as LayerKey[]
  const visibleTabs = tabs.filter((t) => !t.layer || permittedLayers.includes(t.layer))

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center border-b border-cyber-border bg-cyber-bg/90 backdrop-blur-md">
      <div className="flex items-center gap-2 px-5">
        <Diamond className="h-5 w-5 text-cyber-blue" />
        <span className="font-mono text-lg font-bold tracking-widest text-cyber-blue">
          CITYTWIN
        </span>
      </div>

      <div className="flex flex-1 items-center justify-center gap-1">
        {visibleTabs.map(({ key, label, icon: Icon }) => {
          const isActive = activePanel === key
          return (
            <button
              key={key}
              onClick={() => setActivePanel(isActive ? 'none' : key)}
              className={`relative flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'text-cyber-blue'
                  : 'text-cyber-muted hover:text-cyber-blue/70'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
              {isActive && (
                <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-cyber-blue shadow-[0_0_8px_rgba(0,240,255,0.6)]" />
              )}
            </button>
          )
        })}
      </div>

      <div className="flex items-center gap-4 px-5">
        <div className="flex items-center gap-2">
          <span className="text-sm text-cyber-muted">{currentUser.name}</span>
          <span className="rounded border border-cyber-blue/40 bg-cyber-blue/10 px-2 py-0.5 font-mono text-xs text-cyber-blue">
            {roleLabels[currentUser.role] ?? currentUser.role}
          </span>
        </div>
        <button className="relative">
          <Bell className="h-5 w-5 text-cyber-muted transition-colors hover:text-cyber-orange" />
          {alerts.length > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-cyber-red px-1 font-mono text-[10px] font-bold text-white">
              {alerts.length > 9 ? '9+' : alerts.length}
            </span>
          )}
        </button>
      </div>
    </nav>
  )
}
