import { useMemo } from 'react'
import { Car, Trees, Zap, Wifi, AlertTriangle, Tag } from 'lucide-react'
import { useCityStore } from '@/store/useCityStore'
import type { LayerKey } from '@/types'

const layers: { key: LayerKey; label: string; icon: React.ElementType }[] = [
  { key: 'traffic', label: '交通', icon: Car },
  { key: 'environment', label: '环境', icon: Trees },
  { key: 'energy', label: '能耗', icon: Zap },
  { key: 'sensors', label: '传感器', icon: Wifi },
  { key: 'events', label: '事件', icon: AlertTriangle },
  { key: 'annotations', label: '标注', icon: Tag },
]

export default function LayerToggle() {
  const visibleLayers = useCityStore((s) => s.visibleLayers)
  const toggleLayer = useCityStore((s) => s.toggleLayer)
  const previewRole = useCityStore((s) => s.previewRole)
  const currentUserRole = useCityStore((s) => s.currentUser.role)
  const roleLayerPerms = useCityStore((s) => s.roleLayerPerms)
  const getEffectivePermittedLayers = useCityStore((s) => s.getEffectivePermittedLayers)
  const permittedLayers = useMemo(() => getEffectivePermittedLayers(), [
    getEffectivePermittedLayers,
    previewRole,
    currentUserRole,
    roleLayerPerms,
  ])

  return (
    <div className="flex flex-col gap-1.5">
      <span className="mb-1 flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-cyber-muted">
        图层控制
        {previewRole && (
          <span className="rounded bg-yellow-500/10 px-1 py-0.5 font-mono text-[9px] normal-case text-yellow-400">
            预览中
          </span>
        )}
      </span>
      {layers.map(({ key, label, icon: Icon }) => {
        const isActive = visibleLayers.includes(key)
        const isPermitted = permittedLayers.includes(key)
        return (
          <button
            key={key}
            onClick={() => isPermitted && toggleLayer(key)}
            disabled={!isPermitted}
            className={`flex items-center justify-between rounded px-3 py-1.5 transition-colors ${
              isPermitted ? 'hover:bg-cyber-surface/60' : 'opacity-40 cursor-not-allowed'
            }`}
          >
            <span className="flex items-center gap-2">
              <Icon className={`h-3.5 w-3.5 ${isActive && isPermitted ? 'text-cyber-blue' : 'text-cyber-muted'}`} />
              <span className={`text-xs ${isActive && isPermitted ? 'text-white' : 'text-cyber-muted'}`}>
                {label}
                {!isPermitted && <span className="ml-1 text-[9px]">（无权限）</span>}
              </span>
            </span>
            <span
              className={`relative h-4 w-7 rounded-full transition-colors ${
                isActive && isPermitted ? 'bg-cyber-blue/30' : 'bg-cyber-border'
              }`}
            >
              <span
                className={`absolute top-0.5 h-3 w-3 rounded-full transition-all ${
                  isActive && isPermitted
                    ? 'left-3.5 bg-cyber-blue shadow-[0_0_6px_rgba(0,240,255,0.5)]'
                    : 'left-0.5 bg-cyber-muted'
                }`}
              />
            </span>
          </button>
        )
      })}
    </div>
  )
}
