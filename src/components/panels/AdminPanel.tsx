import { useState, useMemo } from 'react'
import {
  X, Shield, Users, Layers, FileText, Edit2, Trash2, Search, LogIn, LogOut, Eye,
  Activity, Wind, Zap, AlertTriangle, Check, MapPin, BarChart3, Boxes,
} from 'lucide-react'
import { useCityStore } from '@/store/useCityStore'
import type { LayerKey, UserData, CityEvent } from '@/types'

const layerLabels: Record<LayerKey, { label: string; icon: any }> = {
  traffic: { label: '交通调度', icon: Activity },
  environment: { label: '环境监测', icon: Wind },
  energy: { label: '能耗分析', icon: Zap },
  sensors: { label: 'IoT传感器', icon: Search },
  events: { label: '事件处置', icon: AlertTriangle },
  annotations: { label: '协同标注', icon: FileText },
}

const eventTypeLabels: Record<CityEvent['type'], { label: string; icon: any; color: string }> = {
  traffic: { label: '交通事件', icon: Activity, color: 'text-cyber-green' },
  environment: { label: '环境事件', icon: Wind, color: 'text-cyber-purple' },
  energy: { label: '能耗事件', icon: Zap, color: 'text-cyber-orange' },
  security: { label: '安全事件', icon: Shield, color: 'text-cyber-red' },
}

type TabKey = 'roles' | 'layers' | 'events' | 'logs'

const roles = [
  { key: 'city', name: '市级管理员', range: '全市范围', rangeDesc: '16区 · 215街道', icon: Shield, description: '所有模块最高权限' },
  { key: 'district', name: '区级管理员', range: '浦东新区', rangeDesc: '38街道 · 562社区', icon: Users, description: '区级模块权限' },
  { key: 'street', name: '街道管理员', range: '陆家嘴街道', rangeDesc: '28社区 · 3,852企业', icon: Users, description: '街道级模块权限' },
  { key: 'enterprise', name: '企业用户', range: '陆家嘴金融中心A', rangeDesc: '1栋建筑 · 28家企业', icon: Zap, description: '仅建筑相关权限' },
]

export default function AdminPanel() {
  const setActivePanel = useCityStore((s) => s.setActivePanel)
  const currentUser = useCityStore((s) => s.currentUser)
  const roleLayerPerms = useCityStore((s) => s.roleLayerPerms)
  const roleEventTypePerms = useCityStore((s) => s.roleEventTypePerms)
  const setCurrentUserRole = useCityStore((s) => s.setCurrentUserRole)
  const setRoleLayerPerms = useCityStore((s) => s.setRoleLayerPerms)
  const setRoleEventTypePerms = useCityStore((s) => s.setRoleEventTypePerms)
  const previewRole = useCityStore((s) => s.previewRole)
  const setPreviewRole = useCityStore((s) => s.setPreviewRole)
  const events = useCityStore((s) => s.events)
  const [impactRoleKey, setImpactRoleKey] = useState<string>('district')

  const [activeTab, setActiveTab] = useState<TabKey>('roles')
  const defaultRoleLayers: Record<string, LayerKey[]> = {
    city: ['traffic', 'environment', 'energy', 'sensors', 'events', 'annotations'],
    district: ['traffic', 'environment', 'energy', 'sensors', 'events'],
    street: ['sensors', 'events', 'annotations'],
    enterprise: ['energy', 'events', 'annotations'],
  }
  const [layerPerms, setLayerPerms] = useState<Record<string, LayerKey[]>>(() => {
    const r: Record<string, LayerKey[]> = {}
    roles.forEach((rl) => (r[rl.key] = [...(roleLayerPerms[rl.key] ?? defaultRoleLayers[rl.key] ?? [])]))
    return r
  })
  const [eventTypePerms, setEventTypePerms] = useState<Record<string, CityEvent['type'][]>>(() => {
    const r: Record<string, CityEvent['type'][]> = {}
    roles.forEach((rl) => (r[rl.key] = [...(roleEventTypePerms[rl.key] ?? [])]))
    return r
  })

  const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
    { key: 'roles', label: '角色管理', icon: Users },
    { key: 'layers', label: '图层授权', icon: Layers },
    { key: 'events', label: '事件类型授权', icon: AlertTriangle },
    { key: 'logs', label: '操作日志', icon: FileText },
  ]

  const toggleLayerPerm = (roleKey: string, layer: LayerKey) => {
    setLayerPerms((prev) => {
      const arr = prev[roleKey] ?? []
      const newArr = arr.includes(layer) ? arr.filter((l) => l !== layer) : [...arr, layer]
      setRoleLayerPerms(roleKey, newArr)
      return { ...prev, [roleKey]: newArr }
    })
  }

  const toggleEventTypePerm = (roleKey: string, type: CityEvent['type']) => {
    setEventTypePerms((prev) => {
      const arr = prev[roleKey] ?? []
      const newArr = arr.includes(type) ? arr.filter((t) => t !== type) : [...arr, type]
      setRoleEventTypePerms(roleKey, newArr)
      return { ...prev, [roleKey]: newArr }
    })
  }

  const logs = [
    { time: '2分钟前', user: '系统管理员', action: '切换角色到区级管理员', type: '权限变更' },
    { time: '18分钟前', user: '王主任（区级）', action: '批准事件 E-1183 派单', type: '审批通过' },
    { time: '35分钟前', user: '系统管理员', action: '修改街道管理员图层授权', type: '权限变更' },
    { time: '1小时前', user: '李处置员', action: '派单事件 E-1180', type: '事件操作' },
    { time: '1.5小时前', user: '李街道', action: '提交协同标注 A-2049', type: '标注操作' },
    { time: '2.2小时前', user: '王主任（区级）', action: '退回事件 E-1178 待复核', type: '审批退回' },
    { time: '3小时前', user: '系统管理员', action: '应用早高峰信号灯方案', type: '调度方案' },
    { time: '4.5小时前', user: '系统管理员', action: '新增角色 "运维工程师"', type: '权限变更' },
    { time: '5.8小时前', user: '企业用户A', action: '查询能耗报告 R-9923', type: '数据访问' },
    { time: '6小时前', user: '赵审核员', action: '关闭事件 E-1175', type: '事件完成' },
  ]

  const effectiveRoleKey = previewRole ?? currentUser.role
  const effectiveRoleName = roles.find(r => r.key === effectiveRoleKey)?.name ?? ''

  return (
    <div className="fixed right-0 top-16 bottom-16 z-40 flex w-[440px] flex-col border-l border-cyber-border bg-cyber-bg/95 backdrop-blur-md animate-slide-in-right">
      <div className="flex items-center justify-between border-b border-cyber-border p-4">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-cyber-blue" />
          <div>
            <h2 className="font-sans text-lg font-bold text-white">权限管控中心</h2>
            {previewRole && (
              <p className="flex items-center gap-1 text-[10px] text-yellow-500">
                <Eye className="h-3 w-3" />
                预览模式：{effectiveRoleName}（不影响实际登录）
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {previewRole && (
            <button
              onClick={() => setPreviewRole(null)}
              className="flex items-center gap-1 rounded border border-cyber-red/40 bg-cyber-red/10 px-2 py-1 text-[10px] text-cyber-red hover:bg-cyber-red/20 transition"
            >
              <LogOut className="h-3 w-3" />
              退出预览
            </button>
          )}
          <button onClick={() => setActivePanel('none')} className="text-cyber-muted hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-1 border-b border-cyber-border bg-cyber-card/40 p-2">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex flex-1 items-center justify-center gap-1 rounded px-2 py-1.5 text-xs font-medium transition ${
              activeTab === key
                ? 'bg-cyber-blue/10 text-cyber-blue shadow-[0_0_0_1px_rgba(0,240,255,0.25)]'
                : 'text-cyber-muted hover:text-white hover:bg-cyber-card/70'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === 'roles' && (
          <div className="p-4 space-y-2.5">
            <div className="mb-2 rounded border border-cyber-blue/30 bg-cyber-blue/5 p-2.5">
              <div className="text-[10px] text-cyber-blue/80 mb-1">当前生效视图</div>
              <div className="text-xs text-white">
                {previewRole ? `🔍 预览：${effectiveRoleName}` : `👤 实际登录：${currentUser.name}（${roles.find(r => r.key === currentUser.role)?.name}）`}
              </div>
              <div className="mt-1 text-[9px] text-cyber-muted">
                图层：{roleLayerPerms[effectiveRoleKey]?.length ?? 0}项 · 事件类型：{roleEventTypePerms[effectiveRoleKey]?.length ?? 0}项
              </div>
            </div>

            <div className="space-y-2.5">
              {roles.map((r) => {
                const RoleIcon = r.icon
                const isCurrent = currentUser.role === r.key
                const isPreview = previewRole === r.key
                const effectiveLayers = layerPerms[r.key] ?? []
                const effectiveEventTypes = eventTypePerms[r.key] ?? []
                return (
                  <div
                    key={r.key}
                    className={`rounded border p-3 transition ${
                      isPreview
                        ? 'border-yellow-500/50 bg-yellow-500/5'
                        : isCurrent
                          ? 'border-cyber-blue/60 bg-cyber-blue/5'
                          : 'border-cyber-border bg-cyber-card/60 hover:bg-cyber-card/80'
                    }`}
                  >
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <div className={`rounded p-1.5 ${
                          isPreview ? 'bg-yellow-500/20' : isCurrent ? 'bg-cyber-blue/20' : 'bg-cyber-bg/60'
                        }`}>
                          <RoleIcon className={`h-4 w-4 ${
                            isPreview ? 'text-yellow-500' : isCurrent ? 'text-cyber-blue' : 'text-cyber-muted'
                          }`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-white">{r.name}</span>
                            {isCurrent && (
                              <span className="rounded bg-cyber-blue/20 px-1.5 py-0.5 text-[10px] font-bold text-cyber-blue">
                                当前登录
                              </span>
                            )}
                            {isPreview && (
                              <span className="flex items-center gap-0.5 rounded bg-yellow-500/20 px-1.5 py-0.5 text-[10px] font-bold text-yellow-500">
                                <Eye className="h-2.5 w-2.5" />
                                预览中
                              </span>
                            )}
                          </div>
                          <div className="mt-0.5 text-xs text-cyber-muted">
                            数据范围: <span className="text-white">{r.range}</span>
                          </div>
                          <div className="mt-0.5 text-[10px] text-cyber-muted/80">{r.rangeDesc}</div>
                          <div className="mt-0.5 text-[10px] text-cyber-muted">
                            {r.description}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1 flex-wrap justify-end max-w-[180px]">
                        {!isCurrent && !isPreview && (
                          <button
                            onClick={() => setPreviewRole(r.key as UserData['role'])}
                            className="flex items-center gap-1 rounded border border-yellow-500/40 bg-yellow-500/10 px-2 py-1 text-[10px] text-yellow-500 hover:bg-yellow-500/20 transition"
                            title="进入角色预览模式"
                          >
                            <Eye className="h-3 w-3" />
                            预览
                          </button>
                        )}
                        {!isCurrent && (
                          <button
                            onClick={() => setCurrentUserRole(r.key as UserData['role'])}
                            className="flex items-center gap-1 rounded border border-cyber-green/40 bg-cyber-green/10 px-2 py-1 text-[10px] text-cyber-green hover:bg-cyber-green/20 transition"
                          >
                            <LogIn className="h-3 w-3" />
                            切换
                          </button>
                        )}
                        <button className="rounded border border-cyber-border bg-cyber-bg/60 p-1 text-cyber-muted hover:border-cyber-blue/40 hover:text-cyber-blue transition">
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button className="rounded border border-cyber-border bg-cyber-bg/60 p-1 text-cyber-muted hover:border-cyber-red/40 hover:text-cyber-red transition">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="border-t border-cyber-border/40 pt-2 space-y-1.5">
                      <div className="flex flex-wrap gap-1">
                        {effectiveLayers.map((l) => {
                          const LIcon = layerLabels[l]?.icon ?? Layers
                          return (
                            <span
                              key={l}
                              className="flex items-center gap-1 rounded bg-cyber-bg/60 px-1.5 py-0.5 text-[10px] text-cyber-blue"
                            >
                              <LIcon className="h-3 w-3" />
                              {layerLabels[l]?.label ?? l}
                            </span>
                          )
                        })}
                        {effectiveLayers.length === 0 && (
                          <span className="text-[10px] text-cyber-muted">（无图层权限）</span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {effectiveEventTypes.map((t) => {
                          const TIcon = eventTypeLabels[t]?.icon ?? AlertTriangle
                          const TColor = eventTypeLabels[t]?.color ?? 'text-cyber-muted'
                          return (
                            <span
                              key={t}
                              className={`flex items-center gap-1 rounded bg-cyber-bg/60 px-1.5 py-0.5 text-[10px] ${TColor}`}
                            >
                              <TIcon className="h-3 w-3" />
                              {eventTypeLabels[t]?.label ?? t}
                            </span>
                          )
                        })}
                        {effectiveEventTypes.length === 0 && (
                          <span className="text-[10px] text-cyber-muted">（无事件类型权限）</span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {activeTab === 'layers' && (
          <ImpactPreviewWrapper
            roleKey={impactRoleKey}
            setRoleKey={setImpactRoleKey}
            roleLabels={Object.fromEntries(roles.map(r => [r.key, r.name]))}
            currentLayers={layerPerms[impactRoleKey] ?? []}
            layerLabels={layerLabels}
          >
            <div className="p-4 space-y-4">
              <div className="text-[10px] text-cyber-muted">
                勾选 / 取消勾选后立刻生效。取消的图层会从左侧控制和3D场景中移除。
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-cyber-border">
                      <th className="py-2 text-left text-cyber-muted font-normal">角色 / 图层</th>
                      {(Object.keys(layerLabels) as LayerKey[]).map(lk => {
                        const LIcon = layerLabels[lk].icon
                        return (
                          <th key={lk} className="py-2 px-1 text-center text-cyber-muted font-normal">
                            <div className="flex flex-col items-center gap-0.5">
                              <LIcon className="h-3.5 w-3.5" />
                              <span className="text-[9px]">{layerLabels[lk].label}</span>
                            </div>
                          </th>
                        )
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {roles.map(r => (
                      <tr
                        key={r.key}
                        onClick={() => setImpactRoleKey(r.key)}
                        className={`cursor-pointer border-b border-cyber-border/40 transition ${
                          impactRoleKey === r.key ? 'bg-cyber-blue/5' : ''
                        }`}
                      >
                        <td className="py-2 pr-2">
                          <span className={`${impactRoleKey === r.key ? 'text-cyber-blue font-medium' : 'text-white'}`}>{r.name}</span>
                        </td>
                        {(Object.keys(layerLabels) as LayerKey[]).map(lk => {
                          const checked = (layerPerms[r.key] ?? []).includes(lk)
                          return (
                            <td key={lk} className="py-2 px-1 text-center">
                              <button
                                onClick={(e) => { e.stopPropagation(); toggleLayerPerm(r.key, lk) }}
                                className={`flex h-4 w-4 mx-auto items-center justify-center rounded border transition ${
                                  checked
                                    ? 'border-cyber-blue bg-cyber-blue/20 text-cyber-blue'
                                    : 'border-cyber-border bg-cyber-bg/60 text-transparent hover:border-cyber-blue/40'
                                }`}
                              >
                                {checked && <Check className="h-3 w-3" />}
                              </button>
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <LayerImpactCard roleKey={impactRoleKey} currentLayers={layerPerms[impactRoleKey] ?? []} />
          </ImpactPreviewWrapper>
        )}

        {activeTab === 'events' && (
          <ImpactPreviewWrapper
            roleKey={impactRoleKey}
            setRoleKey={setImpactRoleKey}
            roleLabels={Object.fromEntries(roles.map(r => [r.key, r.name]))}
            currentLayers={layerPerms[impactRoleKey] ?? []}
            layerLabels={layerLabels}
          >
            <div className="p-4 space-y-4">
              <div className="text-[10px] text-cyber-muted">
                限制每个角色能看到的事件类型；取消授权后事件中心不会出现对应事件。
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-cyber-border">
                      <th className="py-2 text-left text-cyber-muted font-normal">角色 / 事件</th>
                      {(Object.keys(eventTypeLabels) as CityEvent['type'][]).map(ek => {
                        const EIcon = eventTypeLabels[ek].icon
                        const EColor = eventTypeLabels[ek].color
                        return (
                          <th key={ek} className="py-2 px-1 text-center text-cyber-muted font-normal">
                            <div className="flex flex-col items-center gap-0.5">
                              <EIcon className={`h-3.5 w-3.5 ${EColor}`} />
                              <span className="text-[9px]">{eventTypeLabels[ek].label}</span>
                            </div>
                          </th>
                        )
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {roles.map(r => (
                      <tr
                        key={r.key}
                        onClick={() => setImpactRoleKey(r.key)}
                        className={`cursor-pointer border-b border-cyber-border/40 transition ${
                          impactRoleKey === r.key ? 'bg-cyber-blue/5' : ''
                        }`}
                      >
                        <td className="py-2 pr-2">
                          <span className={`${impactRoleKey === r.key ? 'text-cyber-blue font-medium' : 'text-white'}`}>{r.name}</span>
                        </td>
                        {(Object.keys(eventTypeLabels) as CityEvent['type'][]).map(ek => {
                          const checked = (eventTypePerms[r.key] ?? []).includes(ek)
                          return (
                            <td key={ek} className="py-2 px-1 text-center">
                              <button
                                onClick={(e) => { e.stopPropagation(); toggleEventTypePerm(r.key, ek) }}
                                className={`flex h-4 w-4 mx-auto items-center justify-center rounded border transition ${
                                  checked
                                    ? 'border-cyber-blue bg-cyber-blue/20 text-cyber-blue'
                                    : 'border-cyber-border bg-cyber-bg/60 text-transparent hover:border-cyber-blue/40'
                                }`}
                              >
                                {checked && <Check className="h-3 w-3" />}
                              </button>
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <EventTypeImpactCard
              roleKey={impactRoleKey}
              currentTypes={eventTypePerms[impactRoleKey] ?? []}
              events={events}
              eventTypeLabels={eventTypeLabels}
            />
          </ImpactPreviewWrapper>
        )}

        {activeTab === 'logs' && (
          <div className="p-4 space-y-3">
            <div className="space-y-0">
              {logs.map((log, idx) => (
                <div key={idx} className="relative flex gap-3 border-l border-cyber-border/50 pl-4 pb-4 pt-0.5 last:pb-0">
                  <span className="absolute -left-1.5 top-1.5 flex h-3 w-3 items-center justify-center rounded-full bg-cyber-bg ring-2 ring-cyber-blue/40" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-white">{log.action}</span>
                      <span className="rounded bg-cyber-bg/60 px-1.5 py-0.5 text-[9px] text-cyber-blue shrink-0">
                        {log.type}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-[10px] text-cyber-muted">
                      <span>{log.user}</span>
                      <span>·</span>
                      <span>{log.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ImpactPreviewWrapper({
  roleKey, setRoleKey, roleLabels,
  children,
}: {
  roleKey: string
  setRoleKey: (k: string) => void
  roleLabels: Record<string, string>
  currentLayers: LayerKey[]
  layerLabels: Record<LayerKey, { label: string; icon: any }>
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col h-full">
      <div>{children}</div>
    </div>
  )
}

function LayerImpactCard({ roleKey, currentLayers }: { roleKey: string, currentLayers: LayerKey[] }) {
  const allLayers: LayerKey[] = ['traffic', 'environment', 'energy', 'sensors', 'events', 'annotations']
  const totalCount = allLayers.length
  const availableCount = currentLayers.length
  const removedCount = totalCount - availableCount
  const modules = currentLayers.length

  return (
    <div className="border-t border-cyber-border bg-cyber-card/30 px-4 py-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-3.5 w-3.5 text-cyber-blue" />
          <span className="text-xs font-medium text-white">变更影响预览</span>
        </div>
        <span className="text-[10px] text-cyber-muted">{roleKey} 角色</span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded border border-cyber-green/30 bg-cyber-green/5 p-2">
          <Boxes className="h-4 w-4 text-cyber-green mx-auto mb-0.5" />
          <div className="font-mono text-base font-bold text-cyber-green">{modules}</div>
          <div className="text-[9px] text-cyber-green/80">保留模块</div>
        </div>
        <div className="rounded border border-cyber-red/30 bg-cyber-red/5 p-2">
          <X className="h-4 w-4 text-cyber-red mx-auto mb-0.5" />
          <div className="font-mono text-base font-bold text-cyber-red">{removedCount}</div>
          <div className="text-[9px] text-cyber-red/80">移除图层</div>
        </div>
        <div className="rounded border border-cyber-orange/30 bg-cyber-orange/5 p-2">
          <MapPin className="h-4 w-4 text-cyber-orange mx-auto mb-0.5" />
          <div className="font-mono text-base font-bold text-cyber-orange">{availableCount}</div>
          <div className="text-[9px] text-cyber-orange/80">3D可见标记</div>
        </div>
      </div>
      <div>
        <div className="text-[9px] text-cyber-muted mb-1">当前可访问模块：</div>
        <div className="flex flex-wrap gap-1">
          {currentLayers.length === 0 ? (
            <span className="text-[10px] text-cyber-muted">（无）</span>
          ) : currentLayers.map(l => (
            <span key={l} className="rounded bg-cyber-blue/15 px-1.5 py-0.5 text-[9px] text-cyber-blue">
              {layerLabelShort(l)}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

function EventTypeImpactCard({ roleKey, currentTypes, events, eventTypeLabels }: {
  roleKey: string
  currentTypes: CityEvent['type'][]
  events: CityEvent[]
  eventTypeLabels: Record<CityEvent['type'], { label: string; icon: any; color: string }>
}) {
  const allTypes: CityEvent['type'][] = ['traffic', 'environment', 'energy', 'security']
  const allEvents = events.length
  const visibleEvents = events.filter(e => currentTypes.includes(e.type)).length
  const hiddenEvents = allEvents - visibleEvents
  const unresolvedHidden = events.filter(e => currentTypes.includes(e.type) === false && e.status !== 'resolved').length

  return (
    <div className="border-t border-cyber-border bg-cyber-card/30 px-4 py-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-3.5 w-3.5 text-cyber-blue" />
          <span className="text-xs font-medium text-white">变更影响预览</span>
        </div>
        <span className="text-[10px] text-cyber-muted">{roleKey} 角色</span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded border border-cyber-green/30 bg-cyber-green/5 p-2">
          <Check className="h-4 w-4 text-cyber-green mx-auto mb-0.5" />
          <div className="font-mono text-base font-bold text-cyber-green">{visibleEvents}</div>
          <div className="text-[9px] text-cyber-green/80">可见事件</div>
        </div>
        <div className="rounded border border-cyber-red/30 bg-cyber-red/5 p-2">
          <AlertTriangle className="h-4 w-4 text-cyber-red mx-auto mb-0.5" />
          <div className="font-mono text-base font-bold text-cyber-red">{hiddenEvents}</div>
          <div className="text-[9px] text-cyber-red/80">隐藏事件</div>
        </div>
        <div className="rounded border border-yellow-500/30 bg-yellow-500/5 p-2">
          <AlertCircle className="h-4 w-4 text-yellow-500 mx-auto mb-0.5" />
          <div className="font-mono text-base font-bold text-yellow-500">{unresolvedHidden}</div>
          <div className="text-[9px] text-yellow-500/80">未闭环隐藏</div>
        </div>
      </div>
      <div>
        <div className="text-[9px] text-cyber-muted mb-1">当前可见事件类型：</div>
        <div className="flex flex-wrap gap-1">
          {currentTypes.length === 0 ? (
            <span className="text-[10px] text-cyber-muted">（无）</span>
          ) : currentTypes.map(t => {
            const cfg = eventTypeLabels[t]
            return (
              <span key={t} className={`rounded bg-cyber-bg/60 px-1.5 py-0.5 text-[9px] ${cfg.color}`}>
                {cfg.label}
              </span>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function layerLabelShort(k: LayerKey) {
  const m: Record<LayerKey, string> = {
    traffic: '交通', environment: '环境', energy: '能耗', sensors: '传感器', events: '事件', annotations: '标注',
  }
  return m[k] ?? k
}

function AlertCircle(props: any) {
  return <AlertTriangle {...props} />
}
