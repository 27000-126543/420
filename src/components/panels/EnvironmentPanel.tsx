import { useMemo, useState } from 'react'
import { X, Wind, AlertTriangle, ShieldCheck, AlertOctagon, Clock, CheckCircle2, Plus, ExternalLink } from 'lucide-react'
import { useCityStore } from '@/store/useCityStore'
import type { EnvironmentRegion, EnvMetricKey, LayerKey } from '@/types'
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, CartesianGrid } from 'recharts'

type MetricKey = EnvMetricKey

const metricInfo: Record<MetricKey, { label: string; unit: string; thresholds: number[]; color: string; thresholdAlerts: [number, number] }> = {
  pm25: { label: 'PM2.5', unit: 'μg/m³', thresholds: [35, 75, 115, 150, 300], color: '#ff6b2b', thresholdAlerts: [75, 150] },
  aqi: { label: 'AQI', unit: '', thresholds: [50, 100, 150, 200, 500], color: '#a855f7', thresholdAlerts: [100, 200] },
  noise: { label: '噪声', unit: 'dB', thresholds: [55, 65, 75, 85, 100], color: '#facc15', thresholdAlerts: [65, 85] },
  waterQuality: { label: '水质', unit: '级', thresholds: [2, 3, 4, 5, 6], color: '#00f0ff', thresholdAlerts: [3, 5] },
}

const levelLabels = ['优', '良', '轻度', '中度', '重度']

export default function EnvironmentPanel() {
  const setActivePanel = useCityStore((s) => s.setActivePanel)
  const environmentRegions = useCityStore((s) => s.environmentRegions)
  const activeEnvMetric = useCityStore((s) => s.activeEnvMetric)
  const setActiveEnvMetric = useCityStore((s) => s.setActiveEnvMetric)
  const generateEventFromEnvAlert = useCityStore((s) => s.generateEventFromEnvAlert)
  const setSelectedEvent = useCityStore((s) => s.setSelectedEvent)
  const events = useCityStore((s) => s.events)
  const toggleLayer = useCityStore((s) => s.toggleLayer)
  const visibleLayers = useCityStore((s) => s.visibleLayers)

  const activeMetric = activeEnvMetric as MetricKey
  const metric = metricInfo[activeMetric]
  const [warningTh, criticalTh] = metric.thresholdAlerts

  const getLevel = (val: number) => {
    const ths = metric.thresholds
    for (let i = 0; i < ths.length; i++) {
      if (val <= ths[i]) return i
    }
    return ths.length
  }

  const getAlertLevel = (val: number): 'normal' | 'warning' | 'critical' => {
    if (val >= criticalTh) return 'critical'
    if (val >= warningTh) return 'warning'
    return 'normal'
  }

  const getLevelColor = (level: number) => {
    const colors = ['text-cyber-green', 'text-cyber-green', 'text-yellow-500', 'text-cyber-orange', 'text-cyber-red']
    return colors[level] ?? colors[4]
  }

  const getLevelBg = (level: number) => {
    const colors = ['bg-cyber-green', 'bg-cyber-green', 'bg-yellow-500', 'bg-cyber-orange', 'bg-cyber-red']
    return colors[level] ?? colors[4]
  }

  const analyzedRegions = useMemo(() => {
    return environmentRegions.map(r => ({
      ...r,
      metricValue: r.metrics[activeMetric],
      alertLevel: getAlertLevel(r.metrics[activeMetric]),
    }))
  }, [environmentRegions, activeMetric, warningTh, criticalTh])

  const criticalRegions = useMemo(
    () => analyzedRegions.filter((r) => r.alertLevel !== 'normal'),
    [analyzedRegions]
  )

  const warningCount = criticalRegions.filter(r => r.alertLevel === 'warning').length
  const criticalCount = criticalRegions.filter(r => r.alertLevel === 'critical').length

  const hasCritical = criticalCount > 0

  const chartData = useMemo(
    () =>
      analyzedRegions.slice(0, 12).map((r, i) => ({
        name: `R${i + 1}`,
        value: r.metricValue,
      })),
    [analyzedRegions]
  )

  const sortedRegions = useMemo(
    () => [...analyzedRegions].sort((a, b) => b.metricValue - a.metricValue),
    [analyzedRegions]
  )

  const hasEventsLayer = visibleLayers.includes('events' as LayerKey)

  const handleGenerateEvent = (regionId: string) => {
    if (!hasEventsLayer) toggleLayer('events' as LayerKey)
    const evt = generateEventFromEnvAlert(regionId, activeMetric)
    if (evt) {
      setSelectedEvent(evt.id)
      setActivePanel('events')
    }
  }

  const isRegionEventOpen = (regionId: string) =>
    events.some(e => e.generatedFrom?.regionId === regionId && e.generatedFrom?.metric === activeMetric && e.status !== 'resolved')

  const responseSteps = [
    { key: 'verify', label: '预警确认' },
    { key: 'block', label: '区域封锁' },
    { key: 'evacuate', label: '人员疏散' },
    { key: 'mitigate', label: '环境治理' },
  ]

  return (
    <div className="fixed right-0 top-16 bottom-16 z-40 flex w-96 flex-col border-l border-cyber-border bg-cyber-bg/95 backdrop-blur-md animate-slide-in-right">
      <div className="flex items-center justify-between border-b border-cyber-border p-4">
        <div className="flex items-center gap-2">
          <Wind className="h-5 w-5 text-cyber-purple" />
          <div>
            <h2 className="font-sans text-lg font-bold text-white">环境监测预警</h2>
            <p className="text-[10px] text-cyber-muted">当前指标：{metric.label} · 告警阈值 ≥{warningTh}{metric.unit}警告 / ≥{criticalTh}{metric.unit}严重</p>
          </div>
        </div>
        <button onClick={() => setActivePanel('none')} className="text-cyber-muted hover:text-white">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-5">
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded border border-cyber-border bg-cyber-card/40 p-2">
              <div className="font-mono text-xl font-bold text-white">{environmentRegions.length}</div>
              <div className="text-[10px] text-cyber-muted">监测区域</div>
            </div>
            <div className="rounded border border-yellow-500/40 bg-yellow-500/10 p-2">
              <div className="font-mono text-xl font-bold text-yellow-500">{warningCount}</div>
              <div className="text-[10px] text-yellow-500/80">警告区域</div>
            </div>
            <div className="rounded border border-cyber-red/40 bg-cyber-red/10 p-2">
              <div className="font-mono text-xl font-bold text-cyber-red">{criticalCount}</div>
              <div className="text-[10px] text-cyber-red/80">严重区域</div>
            </div>
          </div>

          {hasCritical && (
            <div className="animate-fade-in rounded border border-cyber-red/60 bg-cyber-red/10 p-3">
              <div className="mb-2 flex items-center gap-2">
                <AlertOctagon className="h-5 w-5 text-cyber-red animate-blink" />
                <span className="font-bold text-cyber-red">{metric.label}应急响应已启动</span>
              </div>
              <div className="space-y-2">
                {responseSteps.map((s, i) => {
                  const done = i < 2
                  return (
                    <div key={s.key} className="flex items-center gap-2 text-sm">
                      {done ? (
                        <CheckCircle2 className="h-4 w-4 text-cyber-green" />
                      ) : (
                        <Clock className="h-4 w-4 text-cyber-muted" />
                      )}
                      <span className={done ? 'text-cyber-green' : 'text-cyber-muted'}>{s.label}</span>
                      <div className="ml-auto font-mono text-xs text-cyber-muted">
                        {done ? `${String(i + 1).padStart(2, '0')}:${String((i * 15) % 60).padStart(2, '0')}` : '--:--'}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className="flex gap-1 rounded border border-cyber-border bg-cyber-card/40 p-1">
            {(Object.keys(metricInfo) as MetricKey[]).map((k) => (
              <button
                key={k}
                onClick={() => setActiveEnvMetric(k)}
                className={`flex-1 rounded py-1.5 text-xs font-medium transition ${
                  activeMetric === k
                    ? 'bg-cyber-card text-white shadow-[0_0_0_1px_rgba(0,240,255,0.3)]'
                    : 'text-cyber-muted hover:text-white'
                }`}
              >
                {metricInfo[k].label}
              </button>
            ))}
          </div>

          <div className="rounded border border-cyber-border bg-cyber-card/40 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-white">区域趋势（前12）</span>
              <span className="text-[10px] text-cyber-muted">{metric.label}（{metric.unit}）</span>
            </div>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4a" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false} width={28} />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={metric.color}
                    strokeWidth={2}
                    dot={{ r: 2, fill: metric.color, strokeWidth: 0 }}
                    activeDot={{ r: 4, fill: metric.color }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-2">
            <div className="mb-1 flex items-center justify-between px-0.5">
              <span className="text-xs font-medium text-white">{metric.label}分级阈值</span>
            </div>
            <div className="h-3 relative overflow-hidden rounded bg-cyber-card/40">
              {levelLabels.map((lbl, idx) => {
                const step = 100 / levelLabels.length
                return (
                  <div
                    key={lbl}
                    className={`absolute top-0 h-full ${getLevelBg(idx)}`}
                    style={{ left: `${idx * step}%`, width: `${step}%`, opacity: 0.45 }}
                  />
                )
              })}
              {warningTh < metric.thresholds[4] && (
                <div className="absolute top-0 bottom-0 border-l-2 border-yellow-500/80" style={{ left: `${(warningTh / metric.thresholds[4]) * 100}%` }} />
              )}
              {criticalTh < metric.thresholds[4] && (
                <div className="absolute top-0 bottom-0 border-l-2 border-cyber-red/90" style={{ left: `${(criticalTh / metric.thresholds[4]) * 100}%` }} />
              )}
            </div>
            <div className="grid grid-cols-5 text-center text-[10px] text-cyber-muted">
              {levelLabels.map((lbl, idx) => (
                <div key={lbl}>
                  <div className={getLevelColor(idx)}>{lbl}</div>
                  <div>≤{metric.thresholds[idx]}{metric.unit}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-cyber-border px-4 pb-4 pt-3 space-y-2.5">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-cyber-muted">
              区域监测（按{metric.label}排序）
            </h3>
            <span className="text-[10px] text-cyber-muted">{criticalRegions.length} / {environmentRegions.length} 告警</span>
          </div>
          {sortedRegions.map((r) => {
            const level = getLevel(r.metricValue)
            const alertLevel = r.alertLevel
            const eventOpen = isRegionEventOpen(r.regionId)
            return (
              <div
                key={r.regionId}
                className={`rounded border p-2.5 transition ${
                  alertLevel === 'critical'
                    ? 'border-cyber-red/50 bg-cyber-red/5 hover:bg-cyber-red/10'
                    : alertLevel === 'warning'
                      ? 'border-yellow-500/40 bg-yellow-500/5 hover:bg-yellow-500/10'
                      : 'border-cyber-border bg-cyber-card/40 hover:bg-cyber-card/70'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-white">{r.regionId}</span>
                      {alertLevel === 'critical' && (
                        <span className="flex items-center gap-0.5 rounded bg-cyber-red/20 px-1.5 py-0.5 text-[10px] font-bold text-cyber-red animate-blink">
                          <AlertTriangle className="h-3 w-3" />
                          严重
                        </span>
                      )}
                      {alertLevel === 'warning' && (
                        <span className="flex items-center gap-0.5 rounded bg-yellow-500/20 px-1.5 py-0.5 text-[10px] font-bold text-yellow-500">
                          <AlertTriangle className="h-3 w-3" />
                          警告
                        </span>
                      )}
                      {eventOpen && (
                        <span className="flex items-center gap-0.5 rounded bg-cyber-blue/20 px-1.5 py-0.5 text-[10px] text-cyber-blue">
                          <ShieldCheck className="h-3 w-3" />
                          已派单
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-[10px] text-cyber-muted">
                      {r.district} · {r.street}
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-cyber-bg/60">
                      <div
                        className={`h-full transition-all ${getLevelBg(level)}`}
                        style={{ width: `${Math.min(100, (r.metricValue / metric.thresholds[4]) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-mono text-base font-bold ${getLevelColor(level)}`}>
                      {r.metricValue.toFixed(1)}
                    </div>
                    <div className="text-[9px] text-cyber-muted">{metric.unit}</div>
                  </div>
                </div>
                {alertLevel !== 'normal' && (
                  <div className="mt-2 flex gap-1.5 border-t border-cyber-border/50 pt-2">
                    <button
                      onClick={() => handleGenerateEvent(r.regionId)}
                      className={`flex flex-1 items-center justify-center gap-1 rounded px-2 py-1 text-[10px] font-medium transition ${
                        eventOpen
                          ? 'bg-cyber-blue/20 text-cyber-blue hover:bg-cyber-blue/30'
                          : alertLevel === 'critical'
                            ? 'bg-cyber-red/20 text-cyber-red hover:bg-cyber-red/30'
                            : 'bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30'
                      }`}
                    >
                      {eventOpen ? (
                        <>
                          <ExternalLink className="h-3 w-3" />
                          查看事件
                        </>
                      ) : (
                        <>
                          <Plus className="h-3 w-3" />
                          生成事件工单
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
