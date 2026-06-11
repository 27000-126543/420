import { useState, useMemo } from 'react'
import {
  X,
  AlertTriangle,
  ChevronLeft,
  Clock,
  CheckCircle2,
  XCircle,
  AlertOctagon,
  AlertCircle,
  Minus,
  MessageSquare,
  MapPin,
  User,
  ThumbsUp,
  ThumbsDown,
  Flag,
} from 'lucide-react'
import { useCityStore } from '@/store/useCityStore'
import type { CityEvent, EventStatus } from '@/types'

type FilterKey = 'all' | 'pending' | 'processing' | 'resolved'

const filterMap: Record<FilterKey, (e: CityEvent) => boolean> = {
  all: () => true,
  pending: (e) => e.status === 'detected' || e.status === 'reported' || e.status === 'returned',
  processing: (e) => e.status === 'assigned' || e.status === 'processing',
  resolved: (e) => e.status === 'resolved',
}

const filterLabels: Record<FilterKey, string> = {
  all: '全部',
  pending: '待处理',
  processing: '处理中',
  resolved: '已完成',
}

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

export default function EventPanel() {
  const setActivePanel = useCityStore((s) => s.setActivePanel)
  const events = useCityStore((s) => s.events)
  const selectedEvent = useCityStore((s) => s.selectedEvent)
  const setSelectedEvent = useCityStore((s) => s.setSelectedEvent)
  const updateEventStatus = useCityStore((s) => s.updateEventStatus)
  const approveEventStep = useCityStore((s) => s.approveEventStep)
  const addEventAnnotation = useCityStore((s) => s.addEventAnnotation)
  const currentUser = useCityStore((s) => s.currentUser)

  const [filter, setFilter] = useState<FilterKey>('all')
  const [approvalComment, setApprovalComment] = useState('')
  const [annotationText, setAnnotationText] = useState('')

  const filteredEvents = useMemo(
    () => events.filter(filterMap[filter]).sort((a, b) => b.createdAt - a.createdAt),
    [events, filter]
  )

  const selected = useMemo(
    () => events.find((e) => e.id === selectedEvent),
    [events, selectedEvent]
  )

  const currentStepIndex = useMemo(() => {
    if (!selected) return -1
    const rejectedIdx = selected.steps.findIndex((s) => s.status === 'rejected')
    if (rejectedIdx >= 0) return rejectedIdx
    return selected.steps.findIndex((s) => s.status === 'pending')
  }, [selected])

  const canApprove = currentUser.role === 'city' || currentUser.role === 'district'

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

  if (selected) {
    const lvlCfg = levelConfig[selected.level]
    const LevelIcon = lvlCfg.icon
    return (
      <div className="fixed right-0 top-16 bottom-16 z-40 flex w-96 flex-col border-l border-cyber-border bg-cyber-bg/95 backdrop-blur-md animate-slide-in-right">
        <div className="flex items-center justify-between border-b border-cyber-border p-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedEvent(null)}
              className="text-cyber-muted hover:text-white transition-colors"
            >
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
                <span className="rounded border border-cyber-border bg-cyber-bg/50 px-2 py-0.5 text-xs text-cyber-muted">
                  {typeLabels[selected.type]}
                </span>
              </div>
            </div>
            <div className="space-y-1.5 text-xs text-cyber-muted">
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5" />
                <span>位置: [{selected.location[0].toFixed(0)}, {selected.location[2].toFixed(0)}]</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5" />
                <span>时间: {new Date(selected.createdAt).toLocaleString('zh-CN')}</span>
              </div>
            </div>
          </div>

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
                        }`}
                      >
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
                        {new Date(a.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
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

  return (
    <div className="fixed right-0 top-16 bottom-16 z-40 flex w-96 flex-col border-l border-cyber-border bg-cyber-bg/95 backdrop-blur-md animate-slide-in-right">
      <div className="flex items-center justify-between border-b border-cyber-border p-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-cyber-orange" />
          <h2 className="font-sans text-lg font-bold text-white">事件处置中心</h2>
        </div>
        <button onClick={() => setActivePanel('none')} className="text-cyber-muted hover:text-white">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="border-b border-cyber-border px-4 py-2">
        <div className="flex gap-1 rounded bg-cyber-card/40 p-1">
          {(Object.keys(filterLabels) as FilterKey[]).map((k) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={`flex-1 rounded py-1 text-xs font-medium transition ${
                filter === k
                  ? 'bg-cyber-surface text-white shadow-sm'
                  : 'text-cyber-muted hover:text-white'
              }`}
            >
              {filterLabels[k]}
              <span className="ml-1 text-[10px] opacity-70">
                {events.filter(filterMap[k]).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredEvents.length === 0 ? (
          <div className="py-16 text-center text-sm text-cyber-muted">
            暂无事件
          </div>
        ) : (
          filteredEvents.map((e) => {
            const lvlCfg = levelConfig[e.level]
            const LevelIcon = lvlCfg.icon
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
                      <span className="rounded bg-cyber-bg/60 px-1.5 py-0.5">{typeLabels[e.type]}</span>
                      <span className="rounded bg-cyber-bg/60 px-1.5 py-0.5 font-mono">{lvlCfg.label}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-cyber-muted">
                      <Clock className="h-3 w-3" />
                      <span>{new Date(e.createdAt).toLocaleString('zh-CN')}</span>
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
