import { useState } from 'react'
import {
  X,
  Shield,
  Users,
  Layers,
  FileText,
  Edit2,
  Trash2,
  Plus,
  Check,
  MapPin,
  Building,
  Home,
  Factory,
} from 'lucide-react'
import { useCityStore } from '@/store/useCityStore'
import type { LayerKey, UserData } from '@/types'

type TabKey = 'roles' | 'layers' | 'logs'

const layerLabels: Record<LayerKey, { label: string; icon: React.ElementType }> = {
  traffic: { label: '交通调度', icon: MapPin },
  environment: { label: '环境监测', icon: Layers },
  energy: { label: '能耗分析', icon: Building },
  sensors: { label: '传感器', icon: Home },
  events: { label: '事件数据', icon: FileText },
  annotations: { label: '协同标注', icon: Users },
}

const roles = [
  {
    key: 'city',
    name: '市级管理员',
    range: '全城',
    rangeDesc: '全市所有区域数据完全可见',
    layers: ['traffic', 'environment', 'energy', 'sensors', 'events', 'annotations'] as LayerKey[],
    icon: Shield,
  },
  {
    key: 'district',
    name: '区级管理员',
    range: '本区',
    rangeDesc: '仅可见本区数据与事件',
    layers: ['traffic', 'environment', 'energy', 'sensors', 'events'] as LayerKey[],
    icon: Building,
  },
  {
    key: 'street',
    name: '街道管理员',
    range: '本街道',
    rangeDesc: '仅可见街道范围数据',
    layers: ['sensors', 'events', 'annotations'] as LayerKey[],
    icon: Home,
  },
  {
    key: 'enterprise',
    name: '企业用户',
    range: '本企业',
    rangeDesc: '仅可见自有建筑数据',
    layers: ['energy', 'events', 'annotations'] as LayerKey[],
    icon: Factory,
  },
]

const mockLogs = [
  { time: '10:42:18', user: '系统管理员', action: '调整红绿灯调度方案', target: 'TL-0042', type: 'edit' },
  { time: '10:38:05', user: '王主任（区级）', action: '审批通过事件', target: 'EVT-20260611-007', type: 'approve' },
  { time: '10:35:22', user: '李街道', action: '上报异常事件', target: 'PM2.5超标-区域R12', type: 'create' },
  { time: '10:28:49', user: '企业用户A', action: '查看能耗报告', target: '科技产业园B栋', type: 'view' },
  { time: '10:22:11', user: '系统管理员', action: '新增权限角色', target: '临时督查组', type: 'create' },
  { time: '10:15:33', user: '赵局长', action: '启动应急响应', target: '区域R08-水污染', type: 'action' },
  { time: '10:08:02', user: '系统', action: '自动检测告警', target: '能耗异常-金融中心A', type: 'alert' },
  { time: '09:55:47', user: '系统管理员', action: '修改图层权限', target: '区级管理员', type: 'edit' },
  { time: '09:42:18', user: '钱技术员', action: '处置完成事件', target: 'EVT-20260611-003', type: 'resolve' },
  { time: '09:30:25', user: '孙管理员', action: '标注位置信息', target: '道路R-15-3', type: 'annotate' },
]

export default function AdminPanel() {
  const setActivePanel = useCityStore((s) => s.setActivePanel)
  const currentUser = useCityStore((s) => s.currentUser)
  const roleLayerPerms = useCityStore((s) => s.roleLayerPerms)
  const setCurrentUserRole = useCityStore((s) => s.setCurrentUserRole)
  const setRoleLayerPerms = useCityStore((s) => s.setRoleLayerPerms)

  const [activeTab, setActiveTab] = useState<TabKey>('roles')
  const [layerPerms, setLayerPerms] = useState<Record<string, LayerKey[]>>(() => {
    const r: Record<string, LayerKey[]> = {}
    roles.forEach((rl) => (r[rl.key] = [...(roleLayerPerms[rl.key] ?? rl.layers)]))
    return r
  })

  const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
    { key: 'roles', label: '角色管理', icon: Users },
    { key: 'layers', label: '图层授权', icon: Layers },
    { key: 'logs', label: '操作日志', icon: FileText },
  ]

  const toggleLayerPerm = (roleKey: string, layer: LayerKey) => {
    setLayerPerms((prev) => {
      const arr = prev[roleKey] ?? []
      const newArr = arr.includes(layer) ? arr.filter((l) => l !== layer) : [...arr, layer]
      setRoleLayerPerms(roleKey, newArr)
      return {
        ...prev,
        [roleKey]: newArr,
      }
    })
  }

  const logTypeColors: Record<string, string> = {
    edit: 'bg-cyber-blue/15 text-cyber-blue border-cyber-blue/30',
    approve: 'bg-cyber-green/15 text-cyber-green border-cyber-green/30',
    create: 'bg-yellow-500/15 text-yellow-500 border-yellow-500/30',
    view: 'bg-cyber-purple/15 text-cyber-purple border-cyber-purple/30',
    action: 'bg-cyber-orange/15 text-cyber-orange border-cyber-orange/30',
    alert: 'bg-cyber-red/15 text-cyber-red border-cyber-red/30',
    resolve: 'bg-cyber-green/15 text-cyber-green border-cyber-green/30',
    annotate: 'bg-cyan-500/15 text-cyan-500 border-cyan-500/30',
  }

  const logTypeLabels: Record<string, string> = {
    edit: '修改',
    approve: '审批',
    create: '创建',
    view: '查看',
    action: '操作',
    alert: '告警',
    resolve: '办结',
    annotate: '标注',
  }

  return (
    <div className="fixed right-0 top-16 bottom-16 z-40 flex w-[440px] flex-col border-l border-cyber-border bg-cyber-bg/95 backdrop-blur-md animate-slide-in-right">
      <div className="flex items-center justify-between border-b border-cyber-border p-4">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-cyber-blue" />
          <h2 className="font-sans text-lg font-bold text-white">权限管控中心</h2>
        </div>
        <button onClick={() => setActivePanel('none')} className="text-cyber-muted hover:text-white">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="border-b border-cyber-border px-4 py-2">
        <div className="flex gap-1 rounded bg-cyber-card/40 p-1">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded py-1.5 text-xs font-medium transition ${
                activeTab === key
                  ? 'bg-cyber-surface text-white shadow-sm'
                  : 'text-cyber-muted hover:text-white'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'roles' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-cyber-muted">共 {roles.length} 个角色</span>
              <button className="flex items-center gap-1 rounded border border-cyber-blue/40 bg-cyber-blue/10 px-3 py-1 text-xs text-cyber-blue hover:bg-cyber-blue/20 transition">
                <Plus className="h-3.5 w-3.5" />
                新增角色
              </button>
            </div>
            <div className="space-y-2.5">
              {roles.map((r) => {
                const RoleIcon = r.icon
                const isCurrent = currentUser.role === r.key
                const effectiveLayers = layerPerms[r.key] ?? r.layers
                return (
                  <div
                    key={r.key}
                    className={`rounded border p-3 transition ${
                      isCurrent
                        ? 'border-cyber-blue/60 bg-cyber-blue/5'
                        : 'border-cyber-border bg-cyber-card/60 hover:bg-cyber-card/80'
                    }`}
                  >
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <div className={`rounded p-1.5 ${
                          isCurrent ? 'bg-cyber-blue/20' : 'bg-cyber-bg/60'
                        }`}>
                          <RoleIcon className={`h-4 w-4 ${isCurrent ? 'text-cyber-blue' : 'text-cyber-muted'}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-white">{r.name}</span>
                            {isCurrent && (
                              <span className="rounded bg-cyber-blue/20 px-1.5 py-0.5 text-[10px] font-bold text-cyber-blue">
                                当前角色
                              </span>
                            )}
                          </div>
                          <div className="mt-0.5 text-xs text-cyber-muted">
                            数据范围: <span className="text-white">{r.range}</span>
                          </div>
                          <div className="mt-0.5 text-[10px] text-cyber-muted/80">{r.rangeDesc}</div>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {!isCurrent && (
                          <button
                            onClick={() => setCurrentUserRole(r.key as UserData['role'])}
                            className="rounded border border-cyber-green/40 bg-cyber-green/10 px-2 py-1 text-[10px] text-cyber-green hover:bg-cyber-green/20 transition"
                          >
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
                    <div className="flex flex-wrap gap-1">
                      {effectiveLayers.map((l) => {
                        const LIcon = layerLabels[l].icon
                        return (
                          <span
                            key={l}
                            className="flex items-center gap-1 rounded bg-cyber-bg/60 px-1.5 py-0.5 text-[10px] text-cyber-blue"
                          >
                            <LIcon className="h-3 w-3" />
                            {layerLabels[l].label}
                          </span>
                        )
                      })}
                      {effectiveLayers.length === 0 && (
                        <span className="text-[10px] text-cyber-muted">（无授权图层）</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {activeTab === 'layers' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-cyber-border">
                  <th className="sticky left-0 bg-cyber-bg/95 px-2 py-3 text-left text-cyber-muted font-medium">
                    角色 \ 图层
                  </th>
                  {(Object.keys(layerLabels) as LayerKey[]).map((lk) => {
                    const LIcon = layerLabels[lk].icon
                    return (
                      <th key={lk} className="px-2 py-3 text-center text-cyber-muted font-medium whitespace-nowrap">
                        <div className="flex flex-col items-center gap-1">
                          <LIcon className="h-3.5 w-3.5" />
                          <span>{layerLabels[lk].label}</span>
                        </div>
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {roles.map((r) => {
                  const isCurrent = currentUser.role === r.key
                  return (
                    <tr
                      key={r.key}
                      className={`border-b border-cyber-border/60 ${
                        isCurrent ? 'bg-cyber-blue/5' : 'hover:bg-cyber-card/30'
                      }`}
                    >
                      <td className={`sticky left-0 px-2 py-3 text-left font-medium whitespace-nowrap ${
                        isCurrent ? 'bg-cyber-blue/5 text-cyber-blue' : 'bg-cyber-bg/95 text-white'
                      }`}>
                        {r.name}
                      </td>
                      {(Object.keys(layerLabels) as LayerKey[]).map((lk) => {
                        const checked = layerPerms[r.key]?.includes(lk) ?? false
                        return (
                          <td key={lk} className="px-2 py-3 text-center">
                            <button
                              onClick={() => toggleLayerPerm(r.key, lk)}
                              className={`mx-auto flex h-5 w-5 items-center justify-center rounded border transition ${
                                checked
                                  ? 'border-cyber-green bg-cyber-green/20 text-cyber-green'
                                  : 'border-cyber-border bg-cyber-bg/60 text-transparent hover:border-cyber-muted'
                              }`}
                            >
                              <Check className="h-3 w-3" strokeWidth={3} />
                            </button>
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <div className="mt-4 rounded border border-cyber-border bg-cyber-card/40 p-3">
              <div className="mb-2 text-xs font-medium text-white">权限说明</div>
              <ul className="space-y-1 text-[11px] text-cyber-muted list-disc list-inside">
                <li>市级管理员拥有全平台最高权限，可查看所有数据图层</li>
                <li>区级管理员仅可查看其管辖区域内的数据</li>
                <li>街道管理员侧重执行层面，可上报及处置分配的事件</li>
                <li>企业用户仅能访问与自身企业建筑相关的数据</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-cyber-muted">今日操作记录 {mockLogs.length} 条</span>
              <button className="text-xs text-cyber-blue hover:text-cyber-blue/80 transition">
                导出日志
              </button>
            </div>
            <div className="relative space-y-0 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-px before:bg-cyber-border">
              {mockLogs.map((log, idx) => (
                <div key={idx} className="relative pl-8 pb-3 last:pb-0">
                  <div className="absolute left-[9px] top-1 h-2 w-2 rounded-full border-2 border-cyber-bg bg-cyber-blue" />
                  <div className="rounded border border-cyber-border bg-cyber-card/40 p-2.5">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="font-mono text-[10px] text-cyber-muted">{log.time}</span>
                      <span className={`rounded border px-1.5 py-0.5 text-[10px] ${logTypeColors[log.type] ?? ''}`}>
                        {logTypeLabels[log.type] ?? log.type}
                      </span>
                    </div>
                    <div className="text-xs">
                      <span className="text-cyber-blue">{log.user}</span>
                      <span className="text-cyber-muted mx-1">·</span>
                      <span className="text-white">{log.action}</span>
                    </div>
                    <div className="mt-0.5 truncate text-[11px] text-cyber-muted">
                      目标: <span className="text-cyber-muted/90">{log.target}</span>
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
