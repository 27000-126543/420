import { useState, useMemo } from 'react'
import { X, Zap, TrendingUp, TrendingDown, AlertTriangle, Building2, BarChart3 } from 'lucide-react'
import { useCityStore } from '@/store/useCityStore'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
  Tooltip,
  ReferenceDot,
} from 'recharts'

export default function EnergyPanel() {
  const setActivePanel = useCityStore((s) => s.setActivePanel)
  const setSelectedBuilding = useCityStore((s) => s.setSelectedBuilding)
  const energyData = useCityStore((s) => s.energyData)
  const buildings = useCityStore((s) => s.buildings)

  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null)

  const selectedEnergy = useMemo(
    () => energyData.find((e) => e.buildingId === selectedBuildingId),
    [energyData, selectedBuildingId]
  )

  const buildingNameMap = useMemo(() => {
    const m: Record<string, string> = {}
    buildings.forEach((b) => (m[b.id] = b.name))
    energyData.forEach((e) => {
      if (!m[e.buildingId]) m[e.buildingId] = e.buildingName
    })
    return m
  }, [buildings, energyData])

  const rankedEnergy = useMemo(
    () => [...energyData].sort((a, b) => b.currentKw - a.currentKw).slice(0, 15),
    [energyData]
  )

  const maxKw = rankedEnergy[0]?.currentKw ?? 1

  const anomalyEnergy = useMemo(
    () => energyData.filter((e) => e.anomalies.length > 0),
    [energyData]
  )

  const trendData = useMemo(() => {
    if (!selectedEnergy) return []
    return selectedEnergy.trend.map((t) => ({
      time: new Date(t.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      value: t.value,
      isAnomaly: selectedEnergy.anomalies.some(
        (a) => Math.abs(a.timestamp - t.timestamp) < 30000
      ),
      anomalyType: selectedEnergy.anomalies.find(
        (a) => Math.abs(a.timestamp - t.timestamp) < 30000
      )?.type,
    }))
  }, [selectedEnergy])

  const handleSelectBuilding = (id: string) => {
    setSelectedBuildingId(id)
    setSelectedBuilding(id)
  }

  return (
    <div className="fixed right-0 top-16 bottom-16 z-40 flex w-96 flex-col border-l border-cyber-border bg-cyber-bg/95 backdrop-blur-md animate-slide-in-right">
      <div className="flex items-center justify-between border-b border-cyber-border p-4">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-400" />
          <h2 className="font-sans text-lg font-bold text-white">能耗分析</h2>
        </div>
        <button onClick={() => setActivePanel('none')} className="text-cyber-muted hover:text-white">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-5 p-4">
        <section>
          <div className="mb-3 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-cyber-blue" />
            <h3 className="font-medium text-white">建筑能耗排名 TOP 15</h3>
          </div>
          <div className="space-y-1.5">
            {rankedEnergy.map((e, idx) => {
              const isAnomaly = e.anomalies.length > 0
              const isSelected = selectedBuildingId === e.buildingId
              const ratio = e.currentKw / maxKw
              const barColor = ratio > 0.7 ? 'bg-cyber-red' : ratio > 0.4 ? 'bg-cyber-orange' : 'bg-cyber-green'
              return (
                <button
                  key={e.buildingId}
                  onClick={() => handleSelectBuilding(e.buildingId)}
                  className={`w-full rounded border p-2.5 text-left transition ${
                    isSelected
                      ? 'border-cyber-blue/60 bg-cyber-blue/10'
                      : isAnomaly
                        ? 'border-cyber-orange/40 bg-cyber-card/60 hover:bg-cyber-card/80'
                        : 'border-cyber-border bg-cyber-card/40 hover:bg-cyber-card/60'
                  }`}
                >
                  <div className="mb-1.5 flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-xs text-cyber-muted w-5">#{idx + 1}</span>
                      <span className="truncate text-sm text-white">{buildingNameMap[e.buildingId] ?? e.buildingName}</span>
                      {isAnomaly && (
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-cyber-orange animate-blink" />
                      )}
                    </div>
                    <span className="font-mono text-sm font-bold text-cyber-blue whitespace-nowrap">
                      {e.currentKw.toFixed(0)} kW
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-cyber-bg">
                    <div className={`h-full ${barColor}`} style={{ width: `${ratio * 100}%` }} />
                  </div>
                </button>
              )
            })}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-cyber-green" />
            <h3 className="font-medium text-white">分钟级能耗趋势</h3>
          </div>
          <div className="rounded border border-cyber-border bg-cyber-card/60 p-3">
            {selectedEnergy ? (
              <>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm text-white font-medium truncate">
                    {buildingNameMap[selectedEnergy.buildingId] ?? selectedEnergy.buildingName}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-cyber-muted">
                    {selectedEnergy.anomalies.length > 0 ? (
                      <>
                        <AlertTriangle className="h-3 w-3 text-cyber-orange" />
                        {selectedEnergy.anomalies.length}个异常
                      </>
                    ) : null}
                  </div>
                </div>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis
                        dataKey="time"
                        tick={{ fill: '#64748b', fontSize: 9 }}
                        axisLine={false}
                        tickLine={false}
                        interval={Math.floor(trendData.length / 5)}
                      />
                      <YAxis tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false} width={35} />
                      <Tooltip
                        contentStyle={{
                          background: '#1a2035',
                          border: '1px solid #1e293b',
                          borderRadius: 4,
                          color: '#fff',
                          fontSize: 11,
                        }}
                        labelStyle={{ color: '#00f0ff' }}
                        formatter={(v: number) => [`${v.toFixed(0)} kW`, '能耗']}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#00f0ff"
                        strokeWidth={1.5}
                        dot={(props: any) => {
                          const { cx, cy, payload } = props
                          if (payload?.isAnomaly) {
                            const color = payload.anomalyType === 'spike' ? '#ff3355' : '#00f0ff'
                            return (
                              <circle
                                cx={cx}
                                cy={cy}
                                r={4}
                                fill={color}
                                stroke={color}
                                strokeWidth={2}
                                opacity={0.9}
                              />
                            )
                          }
                          return <circle cx={cx} cy={cy} r={1} fill="#00f0ff" opacity={0.6} />
                        }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 flex gap-3 text-[10px] text-cyber-muted">
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-cyber-red" />
                    <span>能耗突增</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingDown className="h-3 w-3 text-cyber-blue" />
                    <span>能耗突降</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex h-48 items-center justify-center text-sm text-cyber-muted">
                点击上方建筑查看能耗趋势
              </div>
            )}
          </div>
        </section>

        {anomalyEnergy.length > 0 && (
          <section>
            <div className="mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-cyber-orange animate-blink" />
              <h3 className="font-medium text-white">异常能耗告警</h3>
            </div>
            <div className="space-y-2">
              {anomalyEnergy.slice(0, 5).map((e) => {
                const lastAnomaly = e.anomalies[e.anomalies.length - 1]
                const type = lastAnomaly?.type === 'spike'
                return (
                  <div
                    key={e.buildingId}
                    className="rounded border border-cyber-orange/40 bg-cyber-orange/5 p-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        {type ? (
                          <TrendingUp className="h-4 w-4 shrink-0 text-cyber-red" />
                        ) : (
                          <TrendingDown className="h-4 w-4 shrink-0 text-cyber-blue" />
                        )}
                        <span className="truncate text-sm text-white">
                          {buildingNameMap[e.buildingId] ?? e.buildingName}
                        </span>
                      </div>
                      <span className="shrink-0 font-mono text-xs text-cyber-muted">
                        {lastAnomaly ? new Date(lastAnomaly.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                    <div className="mt-1.5 text-xs">
                      <span className={type ? 'text-cyber-red' : 'text-cyber-blue'}>
                        {type ? '能耗突增' : '能耗突降'}:
                      </span>
                      <span className="ml-1 font-mono text-cyber-green">{lastAnomaly?.value.toFixed(0)} kW</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
