import { useState, useMemo } from 'react'
import { X, MapPin, Navigation, Lightbulb, ChevronDown, ChevronRight, Route } from 'lucide-react'
import { useCityStore } from '@/store/useCityStore'

export default function TrafficPanel() {
  const setActivePanel = useCityStore((s) => s.setActivePanel)
  const trafficFlows = useCityStore((s) => s.trafficFlows)
  const trafficLights = useCityStore((s) => s.trafficLights)
  const updateTrafficLightSchedule = useCityStore((s) => s.updateTrafficLightSchedule)

  const [expandedLight, setExpandedLight] = useState<string | null>(null)
  const [startPoint, setStartPoint] = useState('')
  const [endPoint, setEndPoint] = useState('')
  const [routeResult, setRouteResult] = useState<{ time: number; distance: number; lights: number } | null>(null)
  const [lightSchedule, setLightSchedule] = useState<Record<string, { green: number; red: number }>>({})

  const allSegments = useMemo(() => {
    return trafficFlows.flatMap((f) =>
      f.segments.map((s, idx) => ({ ...s, roadId: f.roadId, segId: idx }))
    )
  }, [trafficFlows])

  const sortedSegments = useMemo(
    () => [...allSegments].sort((a, b) => b.flowIndex - a.flowIndex).slice(0, 10),
    [allSegments]
  )

  const getFlowColor = (f: number) => {
    if (f < 0.33) return 'bg-cyber-green'
    if (f < 0.66) return 'bg-yellow-500'
    return 'bg-cyber-red'
  }

  const getFlowTextColor = (f: number) => {
    if (f < 0.33) return 'text-cyber-green'
    if (f < 0.66) return 'text-yellow-500'
    return 'text-cyber-red'
  }

  const handleRecommend = () => {
    if (startPoint && endPoint) {
      const time = Math.floor(15 + Math.random() * 45)
      const distance = +(3 + Math.random() * 15).toFixed(1)
      const lights = Math.floor(3 + Math.random() * 12)
      setRouteResult({ time, distance, lights })
    }
  }

  const handleAdjustSchedule = (id: string) => {
    const schedule = lightSchedule[id] ?? { green: 30, red: 30 }
    if (schedule.green > 0 && schedule.red > 0) {
      updateTrafficLightSchedule(id, { green: schedule.green, red: schedule.red })
    }
  }

  return (
    <div className="fixed right-0 top-16 bottom-16 z-40 flex w-96 flex-col border-l border-cyber-border bg-cyber-bg/95 backdrop-blur-md animate-slide-in-right">
      <div className="flex items-center justify-between border-b border-cyber-border p-4">
        <div className="flex items-center gap-2">
          <Navigation className="h-5 w-5 text-cyber-blue" />
          <h2 className="font-sans text-lg font-bold text-white">智能交通调度</h2>
        </div>
        <button onClick={() => setActivePanel('none')} className="text-cyber-muted hover:text-white">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <section>
          <div className="mb-3 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-cyber-blue" />
            <h3 className="font-medium text-white">实时路况监控</h3>
          </div>
          <div className="space-y-2">
            {sortedSegments.map((seg, idx) => (
              <div key={idx} className="rounded border border-cyber-border bg-cyber-card/60 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-mono text-xs text-cyber-muted">{seg.roadId}-{seg.segId}</span>
                  <span className={`font-mono text-sm font-bold ${getFlowTextColor(seg.flowIndex)}`}>
                    {Math.round(seg.flowIndex * 100)}%
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-cyber-bg">
                  <div
                    className={`h-full ${getFlowColor(seg.flowIndex)} transition-all`}
                    style={{ width: `${seg.flowIndex * 100}%` }}
                  />
                </div>
                <div className="mt-1 flex justify-between text-xs text-cyber-muted">
                  <span>车速: {seg.speed.toFixed(0)} km/h</span>
                  <span>{seg.flowIndex < 0.33 ? '畅通' : seg.flowIndex < 0.66 ? '缓行' : '拥堵'}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-yellow-500" />
            <h3 className="font-medium text-white">红绿灯调度</h3>
          </div>
          <div className="space-y-2">
            {trafficLights.slice(0, 6).map((tl) => {
              const isExpanded = expandedLight === tl.id
              const sch = lightSchedule[tl.id] ?? { green: tl.schedule.green, red: tl.schedule.red }
              const phaseColor = tl.currentPhase === 'red' ? 'bg-cyber-red' : tl.currentPhase === 'yellow' ? 'bg-yellow-500' : 'bg-cyber-green'
              return (
                <div key={tl.id} className="rounded border border-cyber-border bg-cyber-card/60 overflow-hidden">
                  <button
                    onClick={() => setExpandedLight(isExpanded ? null : tl.id)}
                    className="flex w-full items-center justify-between p-3 hover:bg-cyber-bg/40"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`h-3 w-3 rounded-full ${phaseColor} shadow-[0_0_6px_currentColor] animate-blink`} />
                      <span className="font-mono text-sm text-white">{tl.id}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs text-cyber-muted">{tl.remainingSeconds}s</span>
                      {isExpanded ? <ChevronDown className="h-4 w-4 text-cyber-muted" /> : <ChevronRight className="h-4 w-4 text-cyber-muted" />}
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="space-y-3 border-t border-cyber-border p-3">
                      <div className="space-y-2">
                        <div>
                          <label className="text-xs text-cyber-muted">绿灯时长: {sch.green}s</label>
                          <input
                            type="range"
                            min="5"
                            max="120"
                            value={sch.green}
                            onChange={(e) => setLightSchedule({ ...lightSchedule, [tl.id]: { ...sch, green: +e.target.value } })}
                            className="w-full accent-cyber-green"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-cyber-muted">红灯时长: {sch.red}s</label>
                          <input
                            type="range"
                            min="5"
                            max="120"
                            value={sch.red}
                            onChange={(e) => setLightSchedule({ ...lightSchedule, [tl.id]: { ...sch, red: +e.target.value } })}
                            className="w-full accent-cyber-red"
                          />
                        </div>
                        <button
                          onClick={() => handleAdjustSchedule(tl.id)}
                          className="w-full rounded border border-cyber-blue/50 bg-cyber-blue/10 py-1.5 text-sm text-cyber-blue hover:bg-cyber-blue/20"
                        >
                          应用调度方案
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center gap-2">
            <Route className="h-4 w-4 text-cyber-green" />
            <h3 className="font-medium text-white">智能路径推荐</h3>
          </div>
          <div className="space-y-3 rounded border border-cyber-border bg-cyber-card/60 p-3">
            <div>
              <label className="text-xs text-cyber-muted">起点</label>
              <input
                type="text"
                value={startPoint}
                onChange={(e) => setStartPoint(e.target.value)}
                placeholder="选择起点或输入地址..."
                className="mt-1 w-full rounded border border-cyber-border bg-cyber-bg/80 px-3 py-2 text-sm text-white placeholder-cyber-muted focus:border-cyber-blue focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-cyber-muted">终点</label>
              <input
                type="text"
                value={endPoint}
                onChange={(e) => setEndPoint(e.target.value)}
                placeholder="选择终点或输入地址..."
                className="mt-1 w-full rounded border border-cyber-border bg-cyber-bg/80 px-3 py-2 text-sm text-white placeholder-cyber-muted focus:border-cyber-blue focus:outline-none"
              />
            </div>
            <button
              onClick={handleRecommend}
              disabled={!startPoint || !endPoint}
              className="w-full rounded bg-cyber-blue py-2 text-sm font-medium text-black transition hover:bg-cyber-blue/90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              推荐最优路径
            </button>
            {routeResult && (
              <div className="animate-fade-in space-y-2 rounded border border-cyber-green/50 bg-cyber-green/5 p-3">
                <div className="flex justify-between text-sm">
                  <span className="text-cyber-muted">预计时间</span>
                  <span className="font-mono font-bold text-cyber-green">{routeResult.time} 分钟</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-cyber-muted">行驶距离</span>
                  <span className="font-mono font-bold text-white">{routeResult.distance} km</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-cyber-muted">途经路口</span>
                  <span className="font-mono font-bold text-cyber-blue">{routeResult.lights} 个</span>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
