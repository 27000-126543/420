import { useState, useMemo, useEffect } from 'react'
import {
  X, AlertTriangle, ChevronLeft, Clock, CheckCircle2, XCircle, AlertOctagon, AlertCircle, Minus, MessageSquare, MapPin, User, ThumbsUp, ThumbsDown, Flag, ListOrdered, Wind, Zap, Shield, Link2, Eye, Send, CalendarDays, Filter, RotateCcw,
} from 'lucide-react'
import { useCityStore } from '@/store/useCityStore'
import type { CityEvent, EventStatus, EventActionLog, EnvMetricKey, EventFilter } from '@/types'

const levelConfig = {
  critical: { label: '紧急', color: 'bg-cyber-red', text: 'text-cyber-red', icon: AlertOctagon },
  major: { label: '重大', color: 'bg-cyber-orange', text: 'text-cyber-orange', icon: AlertTriangle },
  minor: { label: '一般', color: 'bg-yellow-500', text: 'text-yellow-500', icon: AlertCircle },
}

const statusLabels: Record<EventStatus, string> = {
  detected: '已检测',
  reported: '已上报',
  assigned: '已派单',
  processing: '处置中',
  resolved: '已完成',
  returned: '退回待处理',
}

const statusColors: Record<EventStatus, string> = {
  detected: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  reported: 'bg-cyber-orange/20 text-cyber-orange border-cyber-orange/30',
  assigned: 'bg-cyber-blue/20 text-cyber-blue border-cyber-blue/30',
  processing: 'bg-cyber-purple/20 text-cyber-purple border-cyber-purple/30',
  resolved: 'bg-cyber-green/20 text-cyber-green border-cyber-green/30',
  returned: 'bg-cyber-red/20 text-cyber-red border-cyber-red/30',
}

const typeLabels: Record<CityEvent['type'], string> = {
  traffic: '交通',
  environment: '环境',
  energy: '能源',
  security: '安防',
}

const typeIcons: Record<CityEvent['type'], any> = {
  traffic: AlertTriangle,
  environment: Wind,
  energy: Zap,
  security: Shield,
}

const actionLogConfig: Record<EventActionLog['type'], { label: string; icon: any; color: string }> = {
  created: { label: '事件创建', icon: Plus, color: 'text-cyber-blue' },
  env_generated: { label: '环境告警生成', icon: Wind, color: 'text-cyber-purple' },
  assigned: { label: '事件派单', icon: Send, color: 'text-cyber-blue' },
  eta_updated: { label: '预计完成更新', icon: CalendarDays, color: 'text-cyber-purple' },
  step_approved: { label: '审批通过', icon: CheckCircle2, color: 'text-cyber-green' },
  step_rejected: { label: '审批退回', icon: XCircle, color: 'text-cyber-red' },
  annotation_added: { label: '协同标注', icon: MessageSquare, color: 'text-cyber-blue' },
  status_changed: { label: '状态变更', icon: Flag, color: 'text-cyber-orange' },
}

const metricLabels: Record<EnvMetricKey, string> = {
  pm25: 'PM2.5',
  aqi: 'AQI',
  noise: '噪声',
  waterQuality: '水质',
}

const candidateAssignees = [
  { id: 'u-caozhirou', name: '曹之柔' },
  { id: 'u-linjiali', name: '林佳丽' },
  { id: 'u-weifan', name: '魏帆' },
  { id: 'u-chenjie', name: '陈洁' },
  { id: 'u-system', name: '系统联动' },
]

function Plus() {
  return <span>+</span>
}

export default function EventPanel() {
  const setActivePanel = useCityStore((s) => s.setActivePanel)
  const events = useCityStore((s) => s.events)
  const selectedEvent = useCityStore((s) => s.selectedEvent)
  const setSelectedEvent = useCityStore((s) => s.setSelectedEvent)
  const approveEventStep = useCityStore((s) => s.approveEventStep)
  const addEventAnnotation = useCityStore((s) => s.addEventAnnotation)
  const assignEvent = useCityStore((s) => s.assignEvent)
  const getEffectivePermittedEventTypes = useCityStore((s) => s.getEffectivePermittedEventTypes)
  const currentUser = useCityStore((s) => s.currentUser)
  const previewRole = useCityStore((s) => s.previewRole)
  const eventFilter = useCityStore((s) => s.eventFilter)
  const toggleFilterType = useCityStore((s) => s.toggleFilterType)
  const toggleFilterLevel = useCityStore((s) => s.toggleFilterLevel)
  const toggleFilterStatus = useCityStore((s) => s.toggleFilterStatus)
  const resetEventFilter = useCityStore((s) => s.resetEventFilter)

  const permittedTypes = getEffectivePermittedEventTypes()

  const [approvalComment, setApprovalComment] = useState('')
  const [annotationText, setAnnotationText] = useState('')
  const [assignUserId, setAssignUserId] = useState<string>('')
  const [assignEtaHours, setAssignEtaHours] = useState<number>(24)

  const typeFilteredEvents = useMemo(
    () => events.filter(e => permittedTypes.includes(e.type)),
    [events, permittedTypes]
  )

  const filteredEvents = useMemo(() => {
    const f: EventFilter = eventFilter
    return typeFilteredEvents
      .filter(e => f.types.length === 0 || f.types.includes(e.type))
      .filter(e => f.levels.length === 0 || f.levels.includes(e.level))
      .filter(e => f.statuses.length === 0 || f.statuses.includes(e.status))
      .sort((a, b) => b.createdAt - a.createdAt)
  }, [typeFilteredEvents, eventFilter])

  const selected = useMemo(
    () => typeFilteredEvents.find((e) => e.id === selectedEvent),
    [typeFilteredEvents, selectedEvent]
  )

  useEffect(() => {
    if (selectedEvent && !typeFilteredEvents.some(e => e.id === selectedEvent)) {
      setSelectedEvent(null)
    }
  }, [selectedEvent, typeFilteredEvents, setSelectedEvent])

  const currentStepIndex = useMemo(() => {
    if (!selected) return -1
    const rejectedIdx = selected.steps.findIndex((s) => s.status === 'rejected')
    if (rejectedIdx >= 0) return rejectedIdx
    return selected.steps.findIndex((s) => s.status === 'pending')
  }, [selected])

  const canApprove = currentUser.role === 'city' || currentUser.role === 'district'
  const canAssign = currentUser.role === 'city' || currentUser.role === 'district'

  const handleApprove = (approved: boolean) => {
    if (selected && currentStepIndex >= 0 && canApprove) {
      approveEventStep(selected.id, currentStepIndex, approved, approvalComment)
      setApprovalComment('')
    }
  }

  const handleAddAnnotation = () => {
    if (!selected || !annotationText.trim()) return
    addEventAnnotation(selected.id, {
      id: `ann-${Date.now()}`,
      userId: currentUser.id,
      position: selected.location,
      content: annotationText.trim(),
      timestamp: Date.now(),
    })
    setAnnotationText('')
  }

  const handleAssign = () => {
    if (!selected || !assignUserId) return
    const eta = Date.now() + assignEtaHours * 3600 * 1000
    const user = candidateAssignees.find(u => u.id === assignUserId)
    assignEvent(selected.id, user?.name ?? assignUserId, eta)
    setAssignUserId('')
    setAssignEtaHours(24)
  }

  const sortedActionLogs = useMemo(() => {
    if (!selected) return []
    const seen = new Set<string>()
    const all: EventActionLog[] = []
    const pushUnique = (log: EventActionLog) => {
      const key = `${log.type}-${log.timestamp}-${log.description}`
      if (!seen.has(key)) {
        seen.add(key)
        all.push(log)
      }
    }
    const hasEnvGenerated = selected.actionLogs.some(l => l.type === 'env_generated')
    const hasCreated = selected.actionLogs.some(l => l.type === 'created')
    if (selected.generatedFrom && !hasEnvGenerated) {
      pushUnique({
        id: 'log-created',
        type: 'env_generated',
        timestamp: selected.createdAt,
        userId: 'system',
        userName: '环境监测系统',
        description: `由环境告警自动生成（${metricLabels[selected.generatedFrom.metric]} ${selected.generatedFrom.value}）`,
      })
    } else if (!selected.generatedFrom && !hasCreated) {
      pushUnique({
        id: 'log-created',
        type: 'created',
        timestamp: selected.createdAt,
        userId: 'system',
        userName: '系统自动检测',
        description: `事件${selected.title}`,
      })
    }
    selected.actionLogs.forEach(pushUnique)
    return all.sort((a, b) => a.timestamp - b.timestamp)
  }, [selected])

  if (selectedEvent && !selected) {
    return (
      <div className="fixed right-0 top-16 bottom-16 z-40 flex w-96 flex-col border-l border-cyber-border bg-cyber-bg/95 backdrop-blur-md animate-slide-in-right">
        <div className="flex items-center justify-between border-b border-cyber-border p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-cyber-red" />
            <h2 className="font-sans text-base font-bold text-white">无访问权限</h2>
          </div>
          <button onClick={() => { setSelectedEvent(null); setActivePanel('none') }} className="text-cyber-muted hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
          <Shield className="h-16 w-16 text-cyber-red/40" />
          <p className="text-sm text-white">当前账号无权限查看该事件</p>
          <p className="text-xs text-cyber-muted">该事件类型已被权限收回或当前预览角色未授权</p>
          <button
            onClick={() => { setSelectedEvent(null); setActivePanel('none') }}
            className="mt-4 rounded border border-cyber-blue/40 bg-cyber-blue/10 px-4 py-1.5 text-xs text-cyber-blue hover:bg-cyber-blue/20 transition"
          >
            返回列表
          </button>
        </div>
      </div>
    )
  }

  if (selected) {
    const lvlCfg = levelConfig[selected.level]
    const LevelIcon = lvlCfg.icon
    const canAssignState = selected.status === 'detected' || selected.status === 'reported' || selected.status === 'returned'
    return (
      <div className="fixed right-0 top-16 bottom-16 z-40 flex w-96 flex-col border-l border-cyber-border bg-cyber-bg/95 backdrop-blur-md animate-slide-in-right">
        <div className="flex items-center justify-between border-b border-cyber-border p-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedEvent(null)}
              className="text-cyber-muted hover:text-white transition-colors">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <LevelIcon className={`h-5 w-5 ${lvlCfg.text}`} />
              <h2 className="font-sans text-base font-bold text-white">事件详情</h2>
            </div>
          </div>
          <button onClick={() => setActivePanel('none')} className="text-cyber-muted hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-5 p-4">
          <div className="rounded border border-cyber-border bg-cyber-card/60 p-4 space-y-3">
            <div>
              <div className="mb-2 flex items-start justify-between gap-2">
                <h3 className="text-base font-bold text-white">{selected.title}</h3>
                <span className={`shrink-0 rounded px-2 py-0.5 text-xs font-bold ${lvlCfg.color} text-white`}>
                  {lvlCfg.label}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className={`rounded border px-2 py-0.5 text-xs ${statusColors[selected.status]}`}>
                  {statusLabels[selected.status]}
                </span>
                <span className="rounded border border-cyber-border bg-cyber-bg/50 px-2 py-0.5 text-xs text-cyber-muted flex items-center gap-1">
                  {(() => { const TI = typeIcons[selected.type]; return <><TI className="h-3 w-3" /></> })()}
                  {typeLabels[selected.type]}
                </span>
                {previewRole && (
                  <span className="flex items-center gap-0.5 rounded border border-yellow-500/40 bg-yellow-500/10 px-1.5 py-0.5 text-[10px] text-yellow-500">
                    <Eye className="h-2.5 w-2.5" />
                    预览模式
                  </span>
                )}
              </div>
            </div>
            <div className="space-y-1.5 text-xs text-cyber-muted">
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5" />
                <span>位置: [{selected.location[0].toFixed(0)}, {selected.location[2].toFixed(0)}]</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5" />
                <span>创建时间: {new Date(selected.createdAt).toLocaleString('zh-CN')}</span>
              </div>
              <div className="flex items-center gap-2">
                <ListOrdered className="h-3.5 w-3.5" />
                <span>ID: {selected.id}</span>
              </div>
              {selected.assignee && (
                <div className="flex items-center gap-2">
                  <User className="h-3.5 w-3.5" />
                  <span>处置人: <span className="text-white">{selected.assignee}</span></span>
                </div>
              )}
              {selected.eta && (
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-3.5 w-3.5" />
                  <span>预计完成: <span className={selected.eta < Date.now() ? 'text-cyber-red' : 'text-cyber-green'}>{new Date(selected.eta).toLocaleString('zh-CN')}</span></span>
                </div>
              )}
            </div>
            {selected.generatedFrom && (
              <div className="animate-fade-in mt-1 rounded border border-cyber-purple/40 bg-cyber-purple/5 p-2.5">
                <div className="mb-1 flex items-center gap-1.5 text-[10px] font-medium text-cyber-purple">
                  <Link2 className="h-3 w-3" />
                  联动来源：环境监测系统
                </div>
                <div className="text-[10px] text-cyber-muted space-y-0.5">
                  <div>
                    区域编号：<span className="text-white">{selected.generatedFrom.regionId}</span>
                  </div>
                  <div>
                    超标指标：<span className="text-white">{metricLabels[selected.generatedFrom.metric]}</span>
                    <span className="ml-1 text-cyber-red font-mono">
                      当前值 {selected.generatedFrom.value}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {canAssign && canAssignState && (
            <div className="rounded border border-cyber-blue/30 bg-cyber-blue/5 p-3 space-y-3">
              <div className="flex items-center gap-2">
                <Send className="h-3.5 w-3.5 text-cyber-blue" />
                <h3 className="font-medium text-white text-sm">一键派单</h3>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-cyber-muted">处置人</label>
                  <select
                    value={assignUserId}
                    onChange={(e) => setAssignUserId(e.target.value)}
                    className="mt-1 w-full rounded border border-cyber-border bg-cyber-bg/80 px-2 py-1.5 text-xs text-white focus:border-cyber-blue focus:outline-none"
                  >
                    <option value="">选择处置人</option>
                    {candidateAssignees.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-cyber-muted">预计完成(小时)</label>
                  <input
                    type="number"
                    min={1}
                    max={720}
                    value={assignEtaHours}
                    onChange={(e) => setAssignEtaHours(Math.max(1, Number(e.target.value) || 1))}
                    className="mt-1 w-full rounded border border-cyber-border bg-cyber-bg/80 px-2 py-1.5 text-xs text-white focus:border-cyber-blue focus:outline-none"
                  />
                </div>
              </div>
              <button
                onClick={handleAssign}
                disabled={!assignUserId}
                className="w-full rounded bg-cyber-blue py-1.5 text-xs font-medium text-black hover:bg-cyber-blue/90 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center gap-1.5"
              >
                <Send className="h-3 w-3" />
                派发工单
              </button>
            </div>
          )}

          <div>
            <div className="mb-3 flex items-center gap-2">
              <Flag className="h-4 w-4 text-cyber-blue" />
              <h3 className="font-medium text-white">审批流程</h3>
            </div>
            <div className="relative space-y-0">
              {selected.steps.map((step, idx) => {
                const isDone = step.status === 'approved' || step.status === 'done'
                const isRejected = step.status === 'rejected'
                const isCurrent = idx === currentStepIndex
                const StepIcon = isDone ? CheckCircle2 : isRejected ? XCircle : Minus
                return (
                  <div key={idx} className="relative flex gap-3 pb-5 last:pb-0">
                    <div className="relative flex flex-col items-center">
                      <div
                        className={`relative z-10 rounded-full p-0.5 ${
                          isDone
                            ? 'bg-cyber-green/20'
                            : isRejected
                              ? 'bg-cyber-red/20 ring-2 ring-cyber-red/40 animate-pulse'
                              : isCurrent
                                ? 'bg-cyber-blue/20 ring-2 ring-cyber-blue/40'
                                : 'bg-cyber-muted/20'
                        }`}>
                        <StepIcon
                          className={`h-4 w-4 ${
                            isDone
                              ? 'text-cyber-green'
                              : isRejected
                                ? 'text-cyber-red animate-blink'
                                : isCurrent
                                  ? 'text-cyber-blue animate-pulse'
                                  : 'text-cyber-muted'
                          }`}
                        />
                      </div>
                      {idx < selected.steps.length - 1 && (
                        <div
                          className={`absolute top-7 w-px flex-1 ${
                            isDone ? 'bg-cyber-green/30' : 'bg-cyber-border'
                          }`}
                          style={{ height: 'calc(100% - 24px)' }}
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-medium ${isDone || isCurrent || isRejected ? 'text-white' : 'text-cyber-muted'}`}>
                        {step.action}
                        {isRejected && (
                          <span className="ml-2 rounded bg-cyber-red/20 px-1.5 py-0.5 text-[10px] font-bold text-cyber-red">
                            已退回
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 flex items-center gap-1.5 text-xs text-cyber-muted">
                        <User className="h-3 w-3" />
                        <span>{step.assignee}</span>
                        {step.timestamp && (
                          <>
                            <span>·</span>
                            <span>{new Date(step.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>
                          </>
                        )}
                      </div>
                      {step.comment && (
                        <div className={`mt-1.5 rounded px-2 py-1 text-xs ${isRejected ? 'bg-cyber-red/10 text-cyber-red' : 'bg-cyber-bg/60 text-cyber-muted'}`}>
                          {step.comment}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {currentStepIndex >= 0 && canApprove && (
              <div className={`mt-4 space-y-3 rounded border p-3 ${
                selected.steps[currentStepIndex]?.status === 'rejected'
                  ? 'border-cyber-red/40 bg-cyber-red/5'
                  : 'border-cyber-blue/40 bg-cyber-blue/5'
              }`}>
                <div>
                  <label className="text-xs text-cyber-muted">审批意见</label>
                  <textarea
                    value={approvalComment}
                    onChange={(e) => setApprovalComment(e.target.value)}
                    rows={2}
                    placeholder="输入审批意见（可选）..."
                    className="mt-1 w-full resize-none rounded border border-cyber-border bg-cyber-bg/80 px-3 py-2 text-sm text-white placeholder-cyber-muted focus:border-cyber-blue focus:outline-none"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(true)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded bg-cyber-green py-2 text-sm font-medium text-black hover:bg-cyber-green/90 transition"
                  >
                    <ThumbsUp className="h-4 w-4" />
                    通过
                  </button>
                  <button
                    onClick={() => handleApprove(false)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded border border-cyber-red/50 bg-cyber-red/10 py-2 text-sm font-medium text-cyber-red hover:bg-cyber-red/20 transition"
                  >
                    <ThumbsDown className="h-4 w-4" />
                    退回
                  </button>
                </div>
              </div>
            )}
          </div>

          <div>
            <div className="mb-3 flex items-center gap-2">
              <ListOrdered className="h-4 w-4 text-cyber-purple" />
              <h3 className="font-medium text-white">
                处置时间线 / 联动记录 ({sortedActionLogs.length})
              </h3>
            </div>
            {sortedActionLogs.length === 0 ? (
              <div className="rounded border border-dashed border-cyber-border py-6 text-center text-xs text-cyber-muted">
                暂无联动记录
              </div>
            ) : (
              <div className="relative space-y-0">
                {sortedActionLogs.map((log, idx) => {
                  const cfg = actionLogConfig[log.type]
                  const LogIcon = cfg.icon
                  const isLast = idx === sortedActionLogs.length - 1
                  return (
                    <div key={log.id} className="relative flex gap-3 pb-4">
                      <div className="relative flex flex-col items-center">
                        <div className="relative z-10 rounded-full p-0.5 bg-cyber-card/80 ring-1 ring-cyber-border">
                          <LogIcon className={`h-3.5 w-3.5 ${cfg.color}`} />
                        </div>
                        {!isLast && (
                          <div
                            className="absolute top-6 w-px bg-cyber-border/70"
                            style={{ height: 'calc(100% - 20px)' }}
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-white flex items-center gap-1.5">
                          <span className={`font-medium ${cfg.color}`}>
                            {cfg.label}
                          </span>
                        </div>
                        <div className="mt-0.5 text-[10px] text-cyber-muted space-y-0.5">
                          <div>{log.description}</div>
                          <div className="flex items-center gap-1.5">
                            <User className="h-2.5 w-2.5" />
                            <span>{log.userName}</span>
                            <span>·</span>
                            <Clock className="h-2.5 w-2.5" />
                            <span>{new Date(log.timestamp).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div>
            <div className="mb-3 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-cyber-green" />
              <h3 className="font-medium text-white">协同标注 ({selected.annotations.length})</h3>
            </div>
            <div className="space-y-2 mb-3">
              {selected.annotations.length === 0 ? (
                <div className="rounded border border-dashed border-cyber-border py-6 text-center text-xs text-cyber-muted">
                  暂无标注
                </div>
              ) : (
                selected.annotations.map((a) => (
                  <div key={a.id} className="rounded border border-cyber-border bg-cyber-card/40 p-2.5">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-xs font-medium text-cyber-blue">{a.userId}</span>
                      <span className="font-mono text-[10px] text-cyber-muted">
                        {new Date(a.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-xs text-white">{a.content}</p>
                  </div>
                ))
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={annotationText}
                onChange={(e) => setAnnotationText(e.target.value)}
                placeholder="添加协同标注..."
                onKeyDown={(e) => e.key === 'Enter' && handleAddAnnotation()}
                className="flex-1 rounded border border-cyber-border bg-cyber-bg/80 px-3 py-2 text-sm text-white placeholder-cyber-muted focus:border-cyber-blue focus:outline-none"
              />
              <button
                onClick={handleAddAnnotation}
                disabled={!annotationText.trim()}
                className="rounded bg-cyber-blue px-4 text-sm font-medium text-black hover:bg-cyber-blue/90 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                提交
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const filterTypeOptions: CityEvent['type'][] = ['traffic', 'environment', 'energy', 'security']
  const filterLevelOptions: CityEvent['level'][] = ['critical', 'major', 'minor']
  const filterStatusOptions: EventStatus[] = ['detected', 'reported', 'assigned', 'processing', 'resolved', 'returned']
  const totalFiltered = filteredEvents.length
  const hasActiveFilter = eventFilter.types.length + eventFilter.levels.length + eventFilter.statuses.length > 0

  return (
    <div className="fixed right-0 top-16 bottom-16 z-40 flex w-96 flex-col border-l border-cyber-border bg-cyber-bg/95 backdrop-blur-md animate-slide-in-right">
      <div className="flex items-center justify-between border-b border-cyber-border p-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-cyber-orange" />
          <div>
            <h2 className="font-sans text-lg font-bold text-white">事件处置中心</h2>
            {previewRole && (
              <p className="flex items-center gap-1 text-[10px] text-yellow-500">
                <Eye className="h-3 w-3" />
                预览模式 · 仅 {permittedTypes.map(t => typeLabels[t]).join(' / ')} 类型
              </p>
            )}
          </div>
        </div>
        <button onClick={() => setActivePanel('none')} className="text-cyber-muted hover:text-white">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="border-b border-cyber-border px-4 py-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-cyber-muted">
            <Filter className="h-3 w-3" />
            组合筛选
          </div>
          {hasActiveFilter && (
            <button
              onClick={resetEventFilter}
              className="flex items-center gap-1 text-[10px] text-cyber-muted hover:text-white transition"
            >
              <RotateCcw className="h-2.5 w-2.5" />
              重置
            </button>
          )}
        </div>
        <div className="space-y-1.5">
          <div className="flex flex-wrap gap-1">
            <span className="text-[10px] text-cyber-muted self-center mr-1">类型:</span>
            {filterTypeOptions.filter(t => permittedTypes.includes(t)).map(t => {
              const active = eventFilter.types.includes(t)
              return (
                <button
                  key={t}
                  onClick={() => toggleFilterType(t)}
                  className={`rounded px-2 py-0.5 text-[10px] transition ${
                    active
                      ? 'bg-cyber-blue/20 text-cyber-blue border border-cyber-blue/40'
                      : 'bg-cyber-card/40 text-cyber-muted border border-cyber-border hover:text-white hover:border-cyber-blue/30'
                  }`}
                >
                  {typeLabels[t]}
                </button>
              )
            })}
          </div>
          <div className="flex flex-wrap gap-1">
            <span className="text-[10px] text-cyber-muted self-center mr-1">等级:</span>
            {filterLevelOptions.map(l => {
              const active = eventFilter.levels.includes(l)
              const lvlC = levelConfig[l]
              return (
                <button
                  key={l}
                  onClick={() => toggleFilterLevel(l)}
                  className={`rounded px-2 py-0.5 text-[10px] transition ${
                    active
                      ? `${lvlC.color} bg-opacity-20 text-white border ${lvlC.text.replace('text-', 'border-')}`
                      : 'bg-cyber-card/40 text-cyber-muted border border-cyber-border hover:text-white hover:border-cyber-blue/30'
                  }`}
                >
                  {lvlC.label}
                </button>
              )
            })}
          </div>
          <div className="flex flex-wrap gap-1">
            <span className="text-[10px] text-cyber-muted self-center mr-1">状态:</span>
            {filterStatusOptions.map(s => {
              const active = eventFilter.statuses.includes(s)
              return (
                <button
                  key={s}
                  onClick={() => toggleFilterStatus(s)}
                  className={`rounded px-2 py-0.5 text-[10px] transition ${
                    active
                      ? 'bg-cyber-blue/20 text-cyber-blue border border-cyber-blue/40'
                      : 'bg-cyber-card/40 text-cyber-muted border border-cyber-border hover:text-white hover:border-cyber-blue/30'
                  }`}
                >
                  {statusLabels[s]}
                </button>
              )
            })}
          </div>
        </div>
        <div className="flex items-center justify-between pt-1 border-t border-cyber-border/40">
          <span className="text-[10px] text-cyber-muted">
            共 <span className="text-white font-mono">{typeFilteredEvents.length}</span> 条事件，筛选后 <span className="text-cyber-blue font-mono">{totalFiltered}</span> 条
          </span>
          <span className="text-[10px] text-cyber-muted">
            可见类型：{permittedTypes.map(t => typeLabels[t]).join('、')}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredEvents.length === 0 ? (
          <div className="py-16 text-center text-sm text-cyber-muted">
            {hasActiveFilter ? '当前筛选条件下无事件' : '暂无事件'}
          </div>
        ) : (
          filteredEvents.map((e) => {
            const lvlCfg = levelConfig[e.level]
            const LevelIcon = lvlCfg.icon
            const TypeIcon = typeIcons[e.type]
            return (
              <button
                key={e.id}
                onClick={() => setSelectedEvent(e.id)}
                className="w-full rounded border border-cyber-border bg-cyber-card/60 p-3.5 text-left hover:border-cyber-blue/50 hover:bg-cyber-card transition"
              >
                <div className="flex items-start gap-2.5">
                  <div className={`mt-0.5 shrink-0 rounded p-1 ${lvlCfg.color} bg-opacity-20`}>
                    <LevelIcon className={`h-4 w-4 ${lvlCfg.text}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium text-white">{e.title}</span>
                      <span className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] ${statusColors[e.status]}`}>
                        {statusLabels[e.status]}
                      </span>
                    </div>
                    <div className="mb-1.5 flex items-center gap-2 text-[11px] text-cyber-muted">
                      <span className="flex items-center gap-0.5 rounded bg-cyber-bg/60 px-1.5 py-0.5">
                        <TypeIcon className="h-2.5 w-2.5" />
                        {typeLabels[e.type]}
                      </span>
                      <span className="rounded bg-cyber-bg/60 px-1.5 py-0.5 font-mono">{lvlCfg.label}</span>
                      {e.assignee && (
                        <span className="flex items-center gap-0.5 rounded bg-cyber-green/10 px-1.5 py-0.5 text-cyber-green">
                          <User className="h-2.5 w-2.5" />
                          {e.assignee.length > 4 ? e.assignee.slice(0, 4) + '…' : e.assignee}
                        </span>
                      )}
                      {e.generatedFrom && (
                        <span className="flex items-center gap-0.5 rounded bg-cyber-purple/20 px-1.5 py-0.5 text-cyber-purple">
                          <Wind className="h-2.5 w-2.5" />
                          联动
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-cyber-muted">
                      <Clock className="h-3 w-3" />
                      <span>{new Date(e.createdAt).toLocaleString('zh-CN')}</span>
                      {e.annotations.length > 0 && (
                        <>
                          <span>·</span>
                          <MessageSquare className="h-2.5 w-2.5" />
                          <span>{e.annotations.length}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
