import { useState, useMemo } from 'react'
import {
  X, Activity, MapPin, AlertTriangle, Navigation, Clock, Sunrise, Sunset, Moon, Bell, Check, Zap, Settings, Trash2
} from 'lucide-react'
import { useCityStore } from '@/store/useCityStore'
import type { TrafficLightSchedulePreset } from '@/types'

const PRESET_ICONS: Record<string, any> = {
  clock: Clock, sunrise: Sunrise, sunset: Sunset, moon: Moon, alert: AlertTriangle,
}

export default function TrafficPanel() {
  const setActivePanel = useCityStore((s) => s.setActivePanel)
  const trafficFlows = useCityStore((s) => s.trafficFlows)
  const trafficLights = useCityStore((s) => s.trafficLights)
  const updateTrafficLightSchedule = useCityStore((s) => s.updateTrafficLightSchedule)
  const presets = useCityStore((s) => s.lightSchedulePresets)
  const activeLightPreset = useCityStore((s) => s.activeLightPreset)
  const selectedTrafficLights = useCityStore((s) => s.selectedTrafficLights)
  const setSelectedTrafficLights = useCityStore((s) => s.setSelectedTrafficLights)
  const applyPresetToTrafficLights = useCityStore((s) => s.applyPresetToTrafficLights)
  const addLightSchedulePreset = useCityStore((s) => s.addLightSchedulePreset)
  const deleteLightSchedulePreset = useCityStore((s) => s.deleteLightSchedulePreset)

  const [expandedLight, setExpandedLight] = useState<string | null>(null)
  const [startPoint, setStartPoint] = useState('')
  const [endPoint, setEndPoint] = useState('')
  const [routeResult, setRouteResult] = useState<{ time: number; distance: number; lights: number } | null>(null)
  const [lightSchedule, setLightSchedule] = useState<Record<string, { green: number; red: number }>>({})
  const [showPresetManager, setShowPresetManager] = useState(false)
  const [newPreset, setNewPreset] = useState<Omit<TrafficLightSchedulePreset, 'id'>>({
    name: '', description: '', schedule: { green: 30, yellow: 5, red: 30 }, icon: 'clock',
  })
  const [batchMode, setBatchMode] = useState(false)

  const topFlows = useMemo(
    () => [...trafficFlows].sort((a, b) => b.flowIndex - a.flowIndex).slice(0, 10),
    [trafficFlows],
  )

  const globalAvg = useMemo(
    () => trafficFlows.reduce((sum, f) => sum + f.flowIndex, 0) / (trafficFlows.length || 1),
    [trafficFlows],
  )

  const avgSpeed = useMemo(
    () => trafficFlows.reduce((sum, f) => sum + f.speed, 0) / (trafficFlows.length || 1),
    [trafficFlows],
  )

  const handleRoute = () => {
    if (!startPoint || !endPoint) {
      setRouteResult(null); return
    }
    const segs = trafficFlows.length
    const avgFlow = globalAvg
    const time = Math.round(8 + Math.random() * 15 + avgFlow * 20)
    const distance = 1.8 + Math.random() * 4.5
    const lights = 4 + Math.floor(Math.random() * 8)
    setRouteResult({ time, distance: Math.round(distance * 10) / 10, lights })
  }

  const handleAdjustSchedule = (id: string) => {
    const schedule = lightSchedule[id] ?? { green: 30, red: 30 }
    if (schedule.green > 0 && schedule.red > 0) {
      updateTrafficLightSchedule(id, { green: schedule.green, red: schedule.red })
    }
  }

  const toggleSelectLight = (id: string) => {
    setSelectedTrafficLights(
      selectedTrafficLights.includes(id)
        ? selectedTrafficLights.filter(x => x !== id)
        : [...selectedTrafficLights, id],
    )
  }

  const selectAllLights = () => {
    if (selectedTrafficLights.length === trafficLights.length)
      setSelectedTrafficLights([])
    else
      setSelectedTrafficLights(trafficLights.map(l => l.id))
  }

  const applyPreset = (presetId: string) => {
    const targetIds = batchMode && selectedTrafficLights.length > 0
      ? selectedTrafficLights
      : trafficLights.map(l => l.id)
    applyPresetToTrafficLights(presetId, targetIds)
  }

  const handleCreatePreset = () => {
    if (!newPreset.name.trim()) return
    addLightSchedulePreset(newPreset)
    setNewPreset({ name: '', description: '', schedule: { green: 30, yellow: 5, red: 30 }, icon: 'clock' })
  }

  const flowColor = (fi: number) => {
    if (fi < 0.3) return 'bg-cyber-green'; if (fi < 0.6) return 'bg-yellow-500'; return 'bg-cyber-red'
  }
  const flowTextColor = (fi: number) => {
    if (fi < 0.3) return 'text-cyber-green'; if (fi < 0.6) return 'text-yellow-500'; return 'text-cyber-red'
  }

  return (
    <div className="fixed left-0 top-16 bottom-16 z-40 flex w-96 flex-col border-r border-cyber-border bg-cyber-bg/95 backdrop-blur-md animate-slide-in-left">
      <div className="flex items-center justify-between border-b border-cyber-border p-4">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-cyber-green" />
          <h2 className="font-sans text-lg font-bold text-white">交通调度中心</h2>
        </div>
        <button onClick={() => setActivePanel('none')} className="text-cyber-muted hover:text-white">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-5">
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded border border-cyber-border bg-cyber-card/40 p-2">
              <div className="font-mono text-xl font-bold text-cyber-blue text-center">
                {(globalAvg * 100).toFixed(0)}
              </div>
              <div className="text-[10px] text-cyber-muted text-center">拥堵指数
                <span className="text-cyber-muted">%</span>
              </div>
            </div>
            <div className="rounded border border-cyber-border bg-cyber-card/40 p-2">
              <div className="font-mono text-xl font-bold text-cyber-green text-center">
                {avgSpeed.toFixed(0)}<span className="text-sm">km/h</span>
              </div>
              <div className="text-[10px] text-cyber-muted text-center">平均车速</div>
            </div>
            <div className="rounded border border-cyber-border bg-cyber-card/40 p-2">
              <div className="font-mono text-xl font-bold text-cyber-orange text-center">
                {trafficLights.length}
              </div>
              <div className="text-[10px] text-cyber-muted text-center">信号灯路口</div>
            </div>
          </div>

          <div className="rounded border border-cyber-border bg-cyber-card/40 p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-cyber-muted">
                信号灯调度方案
              </span>
              <button
                onClick={() => setShowPresetManager(v => !v)}
                className="flex items-center gap-1 rounded border border-cyber-border bg-cyber-bg/60 px-2 py-1 text-[10px] text-cyber-blue hover:border-cyber-blue/40 transition"
              >
                <Settings className="h-3 w-3" />
                {showPresetManager ? '收起' : '管理'}
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {presets.map((p) => {
                const PIcon = PRESET_ICONS[p.icon] ?? Clock
                const isActive = activeLightPreset === p.id
                return (
                  <button
                    key={p.id}
                    onClick={() => applyPreset(p.id)}
                    className={`flex-1 min-w-[85px] relative rounded border p-2 text-left transition ${
                      isActive
                        ? 'border-cyber-blue/60 bg-cyber-blue/10'
                        : 'border-cyber-border bg-cyber-bg/60 hover:border-cyber-blue/30 hover:bg-cyber-bg'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <PIcon className={`h-3.5 w-3.5 ${isActive ? 'text-cyber-blue' : 'text-cyber-muted'}`} />
                      <span className={`text-xs font-medium ${isActive ? 'text-cyber-blue' : 'text-white'}`}>
                        {p.name}
                      </span>
                    </div>
                    <div className="mt-0.5 text-[9px] text-cyber-muted whitespace-nowrap">
                      G{p.schedule.green}s · R{p.schedule.red}s
                    </div>
                    {isActive && (
                      <div className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-cyber-blue text-white shadow-[0_0_6px_rgba(0,240,255,0.7)]">
                        <Check className="h-2.5 w-2.5" />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>

            {showPresetManager && (
              <div className="animate-fade-in space-y-2 border-t border-cyber-border/50 pt-3">
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <div className="text-[9px] text-cyber-muted">绿灯</div>
                    <input
                      type="number"
                      value={newPreset.schedule.green}
                      onChange={e => setNewPreset({ ...newPreset, schedule: { ...newPreset.schedule, green: Math.max(5, +e.target.value || 0) } })}
                      className="w-full rounded border border-cyber-border bg-cyber-bg/60 px-1.5 py-1 text-xs text-white outline-none focus:border-cyber-blue/60"
                    />
                  </div>
                  <div>
                    <div className="text-[9px] text-cyber-muted">黄灯</div>
                    <input
                      type="number"
                      value={newPreset.schedule.yellow}
                      onChange={e => setNewPreset({ ...newPreset, schedule: { ...newPreset.schedule, yellow: Math.max(2, +e.target.value || 0) } })}
                      className="w-full rounded border border-cyber-border bg-cyber-bg/60 px-1.5 py-1 text-xs text-white outline-none focus:border-cyber-blue/60"
                    />
                  </div>
                  <div>
                    <div className="text-[9px] text-cyber-muted">红灯</div>
                    <input
                      type="number"
                      value={newPreset.schedule.red}
                      onChange={e => setNewPreset({ ...newPreset, schedule: { ...newPreset.schedule, red: Math.max(5, +e.target.value || 0) } })}
                      className="w-full rounded border border-cyber-border bg-cyber-bg/60 px-1.5 py-1 text-xs text-white outline-none focus:border-cyber-blue/60"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <input
                    type="text"
                    value={newPreset.name}
                    onChange={e => setNewPreset({ ...newPreset, name: e.target.value })}
                    placeholder="方案名称"
                    className="rounded border border-cyber-border bg-cyber-bg/60 px-1.5 py-1 text-xs text-white outline-none placeholder:text-cyber-muted/60 focus:border-cyber-blue/60"
                  />
                  <button
                    onClick={handleCreatePreset}
                    disabled={!newPreset.name.trim()}
                    className="flex items-center justify-center gap-1 rounded border border-cyber-green/40 bg-cyber-green/10 px-2 py-1 text-[10px] text-cyber-green enabled:hover:bg-cyber-green/20 disabled:opacity-40 transition"
                  >
                    <Zap className="h-3 w-3" />
                    新增方案
                  </button>
                </div>
                <div className="flex flex-wrap gap-1 pt-1">
                  {presets.filter(p => !p.id.startsWith('preset-normal')).length > 0 && (
                    <span className="text-[9px] text-cyber-muted w-full mb-1">自定义方案：</span>
                  )}
                  {presets.filter(p => !p.id.startsWith('preset-normal')).map((p) => (
                    <span key={p.id} className="flex items-center gap-1 rounded border border-cyber-border bg-cyber-bg/60 px-1.5 py-0.5 text-[10px] text-white">
                      {p.name}
                      <button
                        onClick={() => deleteLightSchedulePreset(p.id)}
                        className="text-cyber-muted hover:text-cyber-red transition"
                      >
                        <Trash2 className="h-2.5 w-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="rounded border border-cyber-border bg-cyber-card/40 p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-cyber-muted">
                实时路况 TOP 10
              </span>
            </div>
            <div className="space-y-1.5">
              {topFlows.map((flow, idx) => (
                <div key={flow.id} className="space-y-1">
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="flex h-4 w-4 items-center justify-center rounded bg-cyber-bg/60 text-cyber-muted font-mono">
                      {idx + 1}
                    </span>
                    <span className="flex items-center gap-1 text-white min-w-0">
                      <MapPin className="h-3 w-3 text-cyber-blue shrink-0" />
                      <span className="truncate">{flow.roadName}</span>
                    </span>
                    <span className={`ml-auto font-mono ${flowTextColor(flow.flowIndex)} shrink-0`}>
                      {flow.speed}km/h
                    </span>
                  </div>
                  <div className="ml-6 h-1 overflow-hidden rounded bg-cyber-bg/60">
                    <div
                      className={`h-full transition-all ${flowColor(flow.flowIndex)}`}
                      style={{ width: `${flow.flowIndex * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded border border-cyber-border bg-cyber-card/40 p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-cyber-muted">
                红绿灯调度
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setBatchMode(b => !b)}
                  className={`flex items-center gap-0.5 rounded border px-1.5 py-0.5 text-[10px] transition ${
                    batchMode
                      ? 'border-cyber-blue/40 bg-cyber-blue/10 text-cyber-blue'
                      : 'border-cyber-border bg-cyber-bg/60 text-cyber-muted hover:text-white hover:border-cyber-blue/30'
                  }`}
                >
                  {batchMode ? '✓ 批量' : '批量'}
                </button>
                {batchMode && (
                  <button
                    onClick={selectAllLights}
                    className="rounded border border-cyber-border bg-cyber-bg/60 px-1.5 py-0.5 text-[10px] text-cyber-muted hover:text-cyber-blue hover:border-cyber-blue/30 transition"
                  >
                    {selectedTrafficLights.length === trafficLights.length ? '取消全选' : '全选'}
                  </button>
                )}
              </div>
            </div>

            {batchMode && selectedTrafficLights.length > 0 && (
              <div className="animate-fade-in rounded border border-cyber-blue/30 bg-cyber-blue/5 p-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-cyber-blue">
                    已选 {selectedTrafficLights.length} 个路口
                  </span>
                  <div className="flex gap-1">
                    {presets.slice(0, 3).map(p => {
                      const PIcon = PRESET_ICONS[p.icon] ?? Clock
                      return (
                        <button
                          key={p.id}
                          onClick={() => applyPreset(p.id)}
                          className="flex items-center gap-0.5 rounded border border-cyber-border bg-cyber-bg/60 px-1.5 py-0.5 text-[10px] text-cyber-muted hover:text-white hover:border-cyber-blue/40 transition"
                        >
                          <PIcon className="h-2.5 w-2.5" />
                          {p.name}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
              {trafficLights.slice(0, 12).map((tl) => {
                const isExpanded = expandedLight === tl.id
                const sch = lightSchedule[tl.id] ?? { green: tl.schedule.green, red: tl.schedule.red }
                const phaseColor = tl.currentPhase === 'red' ? 'bg-cyber-red' : tl.currentPhase === 'yellow' ? 'bg-yellow-500' : 'bg-cyber-green'
                const isSelected = selectedTrafficLights.includes(tl.id)
                return (
                  <div
                    key={tl.id}
                    className={`rounded border p-2 transition ${
                      isSelected
                        ? 'border-cyber-blue/50 bg-cyber-blue/5'
                        : 'border-cyber-border bg-cyber-bg/40 hover:bg-cyber-bg/60'
                    }`}
                  >
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => batchMode ? toggleSelectLight(tl.id) : setExpandedLight(isExpanded ? null : tl.id)}>
                      {batchMode && (
                        <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                          isSelected ? 'border-cyber-blue bg-cyber-blue' : 'border-cyber-border bg-cyber-bg'
                        }`}>
                          {isSelected && <Check className="h-2.5 w-2.5 text-white" />}
                        </div>
                      )}
                      <div className={`h-2.5 w-2.5 shrink-0 rounded-full ${phaseColor} shadow-[0_0_8px_currentColor] animate-pulseGlow`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium text-white">{tl.id.slice(-6)}</span>
                          <span className="text-[10px] text-cyber-blue">#{tl.intersectionName}</span>
                        </div>
                      </div>
                      <div className="font-mono text-xs text-white shrink-0">
                        {tl.remainingSeconds}s
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-2 animate-fade-in space-y-2 border-t border-cyber-border/50 pt-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <div className="flex items-center justify-between text-[9px] text-cyber-muted mb-0.5">
                              <span>绿灯 {sch.green}s</span>
                              <span className="font-mono text-cyber-green">{sch.green}s</span>
                            </div>
                            <input
                              type="range" min={10} max={90} value={sch.green}
                              onChange={e => setLightSchedule({
                                ...lightSchedule,
                                [tl.id]: { ...sch, green: +e.target.value },
                              })}
                              className="cyber-range w-full accent-cyber-green"
                            />
                          </div>
                          <div>
                            <div className="flex items-center justify-between text-[9px] text-cyber-muted mb-0.5">
                              <span>红灯 {sch.red}s</span>
                              <span className="font-mono text-cyber-red">{sch.red}s</span>
                            </div>
                            <input
                              type="range" min={10} max={90} value={sch.red}
                              onChange={e => setLightSchedule({
                                ...lightSchedule,
                                [tl.id]: { ...sch, red: +e.target.value },
                              })}
                              className="cyber-range w-full accent-cyber-red"
                            />
                          </div>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleAdjustSchedule(tl.id) }}
                          className="flex w-full items-center justify-center gap-1 rounded bg-cyber-green/10 border border-cyber-green/30 py-1 text-[10px] text-cyber-green hover:bg-cyber-green/20 transition"
                        >
                          <Zap className="h-3 w-3" />
                          应用调度方案
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="rounded border border-cyber-border bg-cyber-card/40 p-3 space-y-3">
            <div className="flex items-center gap-2">
              <Navigation className="h-4 w-4 text-cyber-blue" />
              <span className="text-xs font-semibold uppercase tracking-wider text-cyber-muted">
                智能路径推荐
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text" placeholder="起点..."
                value={startPoint}
                onChange={e => setStartPoint(e.target.value)}
                className="rounded border border-cyber-border bg-cyber-bg/60 px-2 py-1.5 text-xs text-white placeholder:text-cyber-muted/60 outline-none focus:border-cyber-blue/60"
              />
              <input
                type="text" placeholder="终点..."
                value={endPoint}
                onChange={e => setEndPoint(e.target.value)}
                className="rounded border border-cyber-border bg-cyber-bg/60 px-2 py-1.5 text-xs text-white placeholder:text-cyber-muted/60 outline-none focus:border-cyber-blue/60"
              />
            </div>
            <button
              onClick={handleRoute}
              className="flex w-full items-center justify-center gap-1 rounded bg-cyber-blue/10 border border-cyber-blue/30 py-1.5 text-xs text-cyber-blue hover:bg-cyber-blue/20 transition"
            >
              <Navigation className="h-3 w-3" />
              计算最优路径
            </button>

            {routeResult && (
              <div className="animate-fade-in space-y-1.5 rounded border border-cyber-green/30 bg-cyber-green/5 p-2.5">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="font-mono text-lg font-bold text-cyber-blue">
                      {routeResult.time}<span className="text-[10px] text-cyber-muted">min</span>
                    </div>
                    <div className="text-[9px] text-cyber-muted">预计时间</div>
                  </div>
                  <div>
                    <div className="font-mono text-lg font-bold text-cyber-green">
                      {routeResult.distance}<span className="text-[10px] text-cyber-muted">km</span>
                    </div>
                    <div className="text-[9px] text-cyber-muted">总距离</div>
                  </div>
                  <div>
                    <div className="font-mono text-lg font-bold text-cyber-orange">
                      {routeResult.lights}
                    </div>
                    <div className="text-[9px] text-cyber-muted">途经信号灯</div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px] text-cyber-muted border-t border-cyber-border/50 pt-1.5">
                  <span>实时路况评分</span>
                  <span className="text-cyber-green">推荐通行顺畅 ✓</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
