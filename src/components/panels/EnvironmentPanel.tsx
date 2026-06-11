import { useState, useMemo } from 'react'
import { X, Wind, AlertTriangle, ShieldCheck, AlertOctagon, Clock, CheckCircle2 } from 'lucide-react'
import { useCityStore } from '@/store/useCityStore'
import type { EnvironmentRegion } from '@/types'
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, CartesianGrid } from 'recharts'

type MetricKey = 'pm25' | 'aqi' | 'noise' | 'waterQuality'

const metricInfo: Record<MetricKey, { label: string; unit: string; thresholds: number[]; color: string }> = {
  pm25: { label: 'PM2.5', unit: 'μg/m³', thresholds: [35, 75, 115, 150], color: '#ff6b2b' },
  aqi: { label: 'AQI', unit: '', thresholds: [50, 100, 150, 200], color: '#a855f7' },
  noise: { label: '噪声', unit: 'dB', thresholds: [55, 65, 75, 85], color: '#facc15' },
  waterQuality: { label: '水质', unit: '级', thresholds: [2, 3, 4, 5], color: '#00f0ff' },
}

const levelLabels = ['优', '良', '轻度', '中度', '重度']

export default function EnvironmentPanel() {
  const setActivePanel = useCityStore((s) => s.setActivePanel)
  const environmentRegions = useCityStore((s) => s.environmentRegions)
  const activeEnvMetric = useCityStore((s) => s.activeEnvMetric)
  const setActiveEnvMetric = useCityStore((s) => s.setActiveEnvMetric)

  const activeMetric = activeEnvMetric as MetricKey
  const metric = metricInfo[activeMetric]

  const getLevel = (val: number) => {
    const ths = metric.thresholds
    for (let i = 0; i < ths.length; i++) {
      if (val <= ths[i]) return i
    }
    return ths.length
  }

  const getLevelColor = (level: number) => {
    const colors = ['text-cyber-green', 'text-cyber-green', 'text-yellow-500', 'text-cyber-orange', 'text-cyber-red']
    return colors[level] ?? colors[4]
  }

  const getLevelBg = (level: number) => {
    const colors = ['bg-cyber-green', 'bg-cyber-green', 'bg-yellow-500', 'bg-cyber-orange', 'bg-cyber-red']
    return colors[level] ?? colors[4]
  }

  const criticalRegions = useMemo(
    () => environmentRegions.filter((r) => r.alertLevel !== 'normal'),
    [environmentRegions]
  )

  const hasCritical = useMemo(
    () => environmentRegions.some((r) => r.alertLevel === 'critical'),
    [environmentRegions]
  )

  const chartData = useMemo(
    () =>
      environmentRegions.slice(0, 12).map((r, i) => ({
        name: `R${i + 1}`,
        value: r.metrics[activeMetric],
      })),
    [environmentRegions, activeMetric]
  )

  const sortedRegions = useMemo(
    () =>
      [...environmentRegions].sort(
        (a, b) => b.metrics[activeMetric] - a.metrics[activeMetric]
      ),
    [environmentRegions, activeMetric]
  )

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
          <h2 className="font-sans text-lg font-bold text-white">环境监测预警</h2>
        </div>
        <button onClick={() => setActivePanel('none')} className="text-cyber-muted hover:text-white">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-5">
        <div className="p-4 space-y-4">
          {hasCritical && (
            <div className="animate-fade-in rounded border border-cyber-red/60 bg-cyber-red/10 p-3">
              <div className="mb-2 flex items-center gap-2">
                <AlertOctagon className="h-5 w-5 text-cyber-red animate-blink" />
                <span className="font-bold text-cyber-red">应急响应已启动</span>
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
                    ? 'bg-cyber-card text-white'
                    : 'text-cyber-muted hover:text-white'
                }`}
              >
                {metricInfo[k].label}
              </button>
            ))}
          </div>

          <div className="rounded border border-cyber-border bg-cyber-card/40 p-3">
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="text-cyber-muted">区域{metric.label}趋势</span>
              <span style={{ color: metric.color }}>单位: {metric.unit}</span>
            </div>
            <div className="h-32 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={metric.color}
                    strokeWidth={2}
                    dot={{ fill: metric.color, r: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm text-cyber-muted">
                {metric.label} 分级阈值
              </span>
              {criticalRegions.length > 0 && (
                <span className="flex items-center gap-1 text-xs text-cyber-orange">
                  <AlertTriangle className="h-3 w-3" />
                  {criticalRegions.length}个区域告警
                </span>
              )}
            </div>
            <div className="flex h-2 w-full overflow-hidden rounded-full">
              {levelLabels.map((_, i) => (
                <div key={i} className={`flex-1 ${getLevelBg(i)}`} title={levelLabels[i]} />
              ))}
            </div>
            <div className="mt-1 flex justify-between text-[10px] text-cyber-muted font-mono">
              {levelLabels.map((l, i) => (
                <span key={i} className={getLevelColor(i)}>{l}</span>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-cyber-blue" />
              <h3 className="font-medium text-white">区域监测详情</h3>
            </div>
            {sortedRegions.map((region) => {
              const val = region.metrics[activeMetric]
              const level = getLevel(val)
              const isAlert = region.alertLevel !== 'normal'
              return (
                <div
                  key={region.regionId}
                  className={`rounded border p-3 transition ${
                    isAlert
                      ? 'border-cyber-orange/50 bg-cyber-orange/5'
                      : 'border-cyber-border bg-cyber-card/60'
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-white">{region.regionId}</span>
                      {isAlert && (
                        <span className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold animate-blink ${
                          region.alertLevel === 'critical' ? 'bg-cyber-red/20 text-cyber-red' : 'bg-cyber-orange/20 text-cyber-orange'
                        }`}>
                          {region.alertLevel === 'critical' ? '严重' : '警告'}
                        </span>
                      )}
                    </div>
                    <div className={`font-mono text-lg font-bold ${getLevelColor(level)}`}>
                      {val.toFixed(0)}
                      <span className="ml-0.5 text-xs">{metric.unit}</span>
                    </div>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-cyber-bg">
                    <div
                      className={`h-full ${getLevelBg(level)} transition-all`}
                      style={{ width: `${Math.min(100, (val / (metric.thresholds[3] * 1.2)) * 100)}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
