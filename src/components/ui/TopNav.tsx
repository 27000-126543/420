import { useMemo } from 'react'
import { Activity, Wind, Zap, AlertTriangle, Shield, Bell, Diamond, X, Eye } from 'lucide-react'
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
  city: '市级管理员',
  district: '区级管理员',
  street: '街道管理员',
  enterprise: '企业用户',
}

export default function TopNav() {
  const activePanel = useCityStore((s) => s.activePanel)
  const setActivePanel = useCityStore((s) => s.setActivePanel)
  const alerts = useCityStore((s) => s.alerts)
  const currentUser = useCityStore((s) => s.currentUser)
  const previewRole = useCityStore((s) => s.previewRole)
  const setPreviewRole = useCityStore((s) => s.setPreviewRole)
  const roleLayerPerms = useCityStore((s) => s.roleLayerPerms)
  const roleEventTypePerms = useCityStore((s) => s.roleEventTypePerms)
  const getEffectiveUser = useCityStore((s) => s.getEffectiveUser)

  const effectiveUser = useMemo(() => getEffectiveUser(), [
    getEffectiveUser,
    previewRole,
    currentUser.role,
    roleLayerPerms,
    roleEventTypePerms,
  ])

  const permittedLayers = effectiveUser.permittedLayers as LayerKey[]
  const visibleTabs = tabs.filter((t) => !t.layer || permittedLayers.includes(t.layer))

  const displayUser = effectiveUser
  const isPreviewMode = previewRole !== null

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex flex-col border-b border-cyber-border bg-cyber-bg/90 backdrop-blur-md">
      {isPreviewMode && (
        <div className="flex items-center justify-between border-b border-yellow-500/30 bg-yellow-500/10 px-5 py-1.5">
          <div className="flex items-center gap-2">
            <Eye className="h-3.5 w-3.5 text-yellow-400" />
            <span className="font-mono text-xs text-yellow-400">
              🔍 预览模式：当前以「{roleLabels[previewRole] ?? previewRole}」角色查看（不影响实际登录账户）
            </span>
          </div>
          <button
            onClick={() => setPreviewRole(null)}
            className="flex items-center gap-1 rounded border border-yellow-500/40 bg-yellow-500/10 px-2 py-0.5 text-xs text-yellow-400 transition-colors hover:bg-yellow-500/20"
          >
            <X className="h-3 w-3" />
            退出预览
          </button>
        </div>
      )}
      <div className="flex h-16 items-center">
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
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2">
              <span className="text-sm text-cyber-muted">{displayUser.name}</span>
              <span
                className={`rounded border px-2 py-0.5 font-mono text-xs ${
                  isPreviewMode
                    ? 'border-yellow-500/40 bg-yellow-500/10 text-yellow-400'
                    : 'border-cyber-blue/40 bg-cyber-blue/10 text-cyber-blue'
                }`}
              >
                {isPreviewMode && <Eye className="mr-1 inline h-3 w-3" />}
                {roleLabels[displayUser.role] ?? displayUser.role}
              </span>
            </div>
            {isPreviewMode && (
              <span className="font-mono text-[10px] text-cyber-muted/70">
                实际登录：{currentUser.name} ({roleLabels[currentUser.role]})
              </span>
            )}
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
      </div>
    </nav>
  )
}
