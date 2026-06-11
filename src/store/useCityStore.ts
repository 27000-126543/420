import { create } from 'zustand'
import type {
  SensorData,
  TrafficFlow,
  TrafficLight,
  EnvironmentRegion,
  EnergyConsumption,
  CityEvent,
  BuildingData,
  UserData,
  LayerKey,
  ViewMode,
  PanelType,
  Annotation,
  EventStatus,
  EventStep,
  EventActionLog,
  TrafficLightSchedulePreset,
  EnvMetricKey,
} from '@/types'

const DEFAULT_PRESETS: TrafficLightSchedulePreset[] = [
  {
    id: 'preset-normal',
    name: '标准配时',
    description: '平峰时段均衡配时',
    schedule: { green: 30, yellow: 5, red: 30 },
    icon: 'clock',
  },
  {
    id: 'preset-morning',
    name: '早高峰',
    description: '7:00-9:00 主干道优先放行',
    schedule: { green: 50, yellow: 5, red: 20 },
    icon: 'sunrise',
  },
  {
    id: 'preset-evening',
    name: '晚高峰',
    description: '17:00-19:00 出城方向优先',
    schedule: { green: 45, yellow: 5, red: 25 },
    icon: 'sunset',
  },
  {
    id: 'preset-night',
    name: '夜间模式',
    description: '22:00-6:00 缩短等候',
    schedule: { green: 20, yellow: 5, red: 15 },
    icon: 'moon',
  },
  {
    id: 'preset-emergency',
    name: '应急疏导',
    description: '突发事件/事故处理',
    schedule: { green: 60, yellow: 5, red: 15 },
    icon: 'alert',
  },
]

const DEFAULT_EVENT_TYPES: Record<string, CityEvent['type'][]> = {
  city: ['traffic', 'environment', 'energy', 'security'],
  district: ['traffic', 'environment', 'energy', 'security'],
  street: ['environment', 'security'],
  enterprise: ['energy', 'security'],
}

interface CityState {
  currentUser: UserData
  buildings: BuildingData[]
  sensors: SensorData[]
  trafficFlows: TrafficFlow[]
  trafficLights: TrafficLight[]
  environmentRegions: EnvironmentRegion[]
  energyData: EnergyConsumption[]
  events: CityEvent[]
  annotations: Annotation[]

  visibleLayers: LayerKey[]
  viewMode: ViewMode
  activePanel: PanelType
  selectedBuilding: string | null
  selectedEvent: string | null
  timelinePosition: number
  isPlaying: boolean
  alerts: { id: string; message: string; level: 'warning' | 'critical'; timestamp: number }[]
  activeEnvMetric: EnvMetricKey
  roleLayerPerms: Record<string, LayerKey[]>
  roleEventTypePerms: Record<string, CityEvent['type'][]>
  lightSchedulePresets: TrafficLightSchedulePreset[]
  activeLightPreset: string | null
  selectedTrafficLights: string[]
  previewRole: UserData['role'] | null

  setBuildings: (b: BuildingData[]) => void
  setSensors: (s: SensorData[]) => void
  setTrafficFlows: (f: TrafficFlow[]) => void
  setTrafficLights: (l: TrafficLight[]) => void
  setEnvironmentRegions: (r: EnvironmentRegion[]) => void
  setEnergyData: (e: EnergyConsumption[]) => void
  setEvents: (e: CityEvent[]) => void
  toggleLayer: (layer: LayerKey) => void
  setViewMode: (m: ViewMode) => void
  setActivePanel: (p: PanelType) => void
  setSelectedBuilding: (id: string | null) => void
  setSelectedEvent: (id: string | null) => void
  setTimelinePosition: (p: number) => void
  setIsPlaying: (p: boolean) => void
  addAlert: (a: { id: string; message: string; level: 'warning' | 'critical'; timestamp: number }) => void
  removeAlert: (id: string) => void
  updateEventStatus: (id: string, status: EventStatus) => void
  approveEventStep: (eventId: string, stepIndex: number, approved: boolean, comment?: string) => void
  addAnnotation: (a: Annotation) => void
  addEventAnnotation: (eventId: string, a: Annotation) => void
  updateSensorValue: (id: string, value: number) => void
  updateTrafficLight: (id: string, phase: TrafficLight['currentPhase'], remaining: number) => void
  updateTrafficLightSchedule: (id: string, schedule: Partial<TrafficLight['schedule']>) => void
  setCurrentUserRole: (role: UserData['role']) => void
  setRoleLayerPerms: (roleKey: string, layers: LayerKey[]) => void
  setRoleEventTypePerms: (roleKey: string, types: CityEvent['type'][]) => void
  setActiveEnvMetric: (m: EnvMetricKey) => void
  setPreviewRole: (role: UserData['role'] | null) => void
  generateEventFromEnvAlert: (regionId: string, metric: EnvMetricKey) => CityEvent | null
  addEventActionLog: (eventId: string, log: Omit<EventActionLog, 'id' | 'timestamp'>) => void
  setActiveLightPreset: (presetId: string | null) => void
  setSelectedTrafficLights: (ids: string[]) => void
  applyPresetToTrafficLights: (presetId: string, lightIds: string[]) => void
  addLightSchedulePreset: (preset: Omit<TrafficLightSchedulePreset, 'id'>) => void
  deleteLightSchedulePreset: (presetId: string) => void
  getEffectiveUser: () => UserData
  getEffectivePermittedLayers: () => LayerKey[]
  getEffectivePermittedEventTypes: () => CityEvent['type'][]
}

const makeDefaultUser = (role: UserData['role']): UserData => {
  const nameMap: Record<string, string> = {
    city: '系统管理员',
    district: '王主任（区级）',
    street: '李街道',
    enterprise: '企业用户A',
  }
  const defaultLayers: Record<string, LayerKey[]> = {
    city: ['traffic', 'environment', 'energy', 'sensors', 'events', 'annotations'],
    district: ['traffic', 'environment', 'energy', 'sensors', 'events'],
    street: ['sensors', 'events', 'annotations'],
    enterprise: ['energy', 'events', 'annotations'],
  }
  return {
    id: 'user-001',
    name: nameMap[role] ?? '系统管理员',
    role,
    permittedLayers: defaultLayers[role] ?? [],
    permittedEventTypes: DEFAULT_EVENT_TYPES[role] ?? [],
  }
}

export const useCityStore = create<CityState>((set, get) => ({
  currentUser: makeDefaultUser('city'),
  buildings: [],
  sensors: [],
  trafficFlows: [],
  trafficLights: [],
  environmentRegions: [],
  energyData: [],
  events: [],
  annotations: [],

  visibleLayers: ['traffic', 'sensors'],
  viewMode: 'city',
  activePanel: 'none',
  selectedBuilding: null,
  selectedEvent: null,
  timelinePosition: Date.now(),
  isPlaying: true,
  alerts: [],
  activeEnvMetric: 'pm25',
  roleLayerPerms: {
    city: ['traffic', 'environment', 'energy', 'sensors', 'events', 'annotations'],
    district: ['traffic', 'environment', 'energy', 'sensors', 'events'],
    street: ['sensors', 'events', 'annotations'],
    enterprise: ['energy', 'events', 'annotations'],
  },
  roleEventTypePerms: { ...DEFAULT_EVENT_TYPES },
  lightSchedulePresets: DEFAULT_PRESETS,
  activeLightPreset: null,
  selectedTrafficLights: [],
  previewRole: null,

  getEffectiveUser: () => {
    const s = get()
    const role = s.previewRole ?? s.currentUser.role
    if (s.previewRole) {
      const baseUser = makeDefaultUser(s.previewRole)
      return {
        ...baseUser,
        permittedLayers: (s.roleLayerPerms[s.previewRole] ?? baseUser.permittedLayers) as LayerKey[],
        permittedEventTypes: s.roleEventTypePerms[s.previewRole] ?? baseUser.permittedEventTypes,
      }
    }
    return {
      ...s.currentUser,
      permittedLayers: (s.roleLayerPerms[role] ?? s.currentUser.permittedLayers) as LayerKey[],
      permittedEventTypes: s.roleEventTypePerms[role] ?? s.currentUser.permittedEventTypes,
    }
  },

  getEffectivePermittedLayers: () => {
    const s = get()
    const role = s.previewRole ?? s.currentUser.role
    return s.roleLayerPerms[role] ?? (s.getEffectiveUser().permittedLayers as LayerKey[])
  },

  getEffectivePermittedEventTypes: () => {
    const s = get()
    const role = s.previewRole ?? s.currentUser.role
    return s.roleEventTypePerms[role] ?? s.getEffectiveUser().permittedEventTypes
  },

  setBuildings: (b) => set({ buildings: b }),
  setSensors: (s) => set({ sensors: s }),
  setTrafficFlows: (f) => set({ trafficFlows: f }),
  setTrafficLights: (l) => set({ trafficLights: l }),
  setEnvironmentRegions: (r) => set({ environmentRegions: r }),
  setEnergyData: (e) => set({ energyData: e }),
  setEvents: (e) => set({ events: e }),
  toggleLayer: (layer) =>
    set((state) => {
      const perms = state.getEffectivePermittedLayers()
      if (!perms.includes(layer)) return state
      return {
        visibleLayers: state.visibleLayers.includes(layer)
          ? state.visibleLayers.filter((l) => l !== layer)
          : [...state.visibleLayers, layer],
      }
    }),
  setViewMode: (m) => set({ viewMode: m }),
  setActivePanel: (p) => set((state) => {
    if (p === 'none') return { activePanel: p }
    const panelToLayer: Record<PanelType, LayerKey | null> = {
      none: null,
      traffic: 'traffic',
      environment: 'environment',
      energy: 'energy',
      events: 'events',
      admin: null,
    }
    const layer = panelToLayer[p]
    if (layer) {
      const perms = state.getEffectivePermittedLayers()
      if (!perms.includes(layer)) return state
    }
    return { activePanel: p }
  }),
  setSelectedBuilding: (id) => set({ selectedBuilding: id }),
  setSelectedEvent: (id) => set({ selectedEvent: id }),
  setTimelinePosition: (p) => set({ timelinePosition: p }),
  setIsPlaying: (p) => set({ isPlaying: p }),
  addAlert: (a) => set((state) => ({ alerts: [...state.alerts, a] })),
  removeAlert: (id) => set((state) => ({ alerts: state.alerts.filter((a) => a.id !== id) })),
  updateEventStatus: (id, status) =>
    set((state) => ({
      events: state.events.map((e) => (e.id === id ? { ...e, status } : e)),
    })),

  approveEventStep: (eventId, stepIndex, approved, comment) =>
    set((state) => ({
      events: state.events.map((e) => {
        if (e.id !== eventId) return e
        const newSteps = e.steps.map((s, i): EventStep => {
          if (i < stepIndex) return s
          if (i === stepIndex) {
            return { ...s, status: (approved ? 'approved' : 'rejected') as EventStep['status'], timestamp: Date.now(), comment }
          }
          if (!approved) {
            return { ...s, status: 'pending' as EventStep['status'], timestamp: undefined, comment: undefined }
          }
          return s
        })
        let newStatus: EventStatus = e.status
        let returnedFromStep: number | undefined = e.returnedFromStep
        if (approved) {
          returnedFromStep = undefined
          if (stepIndex === e.steps.length - 1) {
            newStatus = 'resolved'
          } else if (stepIndex === 0) {
            newStatus = 'reported'
          } else if (stepIndex === 1) {
            newStatus = 'assigned'
          } else if (stepIndex >= 2) {
            newStatus = 'processing'
          }
        } else {
          returnedFromStep = stepIndex
          newStatus = 'returned'
        }

        const user = state.getEffectiveUser()
        const actionLog: EventActionLog = {
          id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          type: approved ? 'step_approved' : 'step_rejected',
          timestamp: Date.now(),
          userId: user.id,
          userName: user.name,
          description: approved ? `审批通过：${e.steps[stepIndex]?.action}` : `审批退回：${e.steps[stepIndex]?.action}`,
          metadata: { stepIndex, comment },
        }

        return { ...e, steps: newSteps, status: newStatus, returnedFromStep, actionLogs: [...e.actionLogs, actionLog] }
      }),
    })),

  addAnnotation: (a) => set((state) => ({ annotations: [...state.annotations, a] })),

  addEventAnnotation: (eventId, a) =>
    set((state) => {
      const user = state.getEffectiveUser()
      const actionLog: EventActionLog = {
        id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        type: 'annotation_added',
        timestamp: Date.now(),
        userId: user.id,
        userName: user.name,
        description: `添加协同标注：${a.content.slice(0, 30)}${a.content.length > 30 ? '...' : ''}`,
        metadata: { annotationId: a.id },
      }
      return {
        annotations: [...state.annotations, a],
        events: state.events.map((e) =>
          e.id === eventId ? { ...e, annotations: [...e.annotations, a], actionLogs: [...e.actionLogs, actionLog] } : e
        ),
      }
    }),

  updateSensorValue: (id, value) =>
    set((state) => ({
      sensors: state.sensors.map((s) => (s.id === id ? { ...s, value, timestamp: Date.now() } : s)),
    })),

  updateTrafficLight: (id, phase, remaining) =>
    set((state) => ({
      trafficLights: state.trafficLights.map((l) =>
        l.id === id ? { ...l, currentPhase: phase, remainingSeconds: remaining } : l
      ),
    })),

  updateTrafficLightSchedule: (id, schedule) =>
    set((state) => ({
      trafficLights: state.trafficLights.map((l) => {
        if (l.id !== id) return l
        const newSchedule = { ...l.schedule, ...schedule }
        let remaining = l.remainingSeconds
        if (l.currentPhase === 'green' && schedule.green !== undefined) {
          remaining = schedule.green
        } else if (l.currentPhase === 'red' && schedule.red !== undefined) {
          remaining = schedule.red
        } else if (l.currentPhase === 'yellow' && schedule.yellow !== undefined) {
          remaining = schedule.yellow
        }
        return { ...l, schedule: newSchedule, remainingSeconds: remaining }
      }),
    })),

  setCurrentUserRole: (role) =>
    set((state) => {
      const newUser = makeDefaultUser(role)
      const newVisible = state.visibleLayers.filter((l) => newUser.permittedLayers.includes(l))
      return {
        currentUser: newUser,
        visibleLayers: newVisible,
        previewRole: null,
      }
    }),

  setRoleLayerPerms: (roleKey, layers) =>
    set((state) => {
      const newPerms = { ...state.roleLayerPerms, [roleKey]: layers }
      let patch: Partial<CityState> = { roleLayerPerms: newPerms }
      if (state.currentUser.role === roleKey && !state.previewRole) {
        patch = {
          ...patch,
          currentUser: { ...state.currentUser, permittedLayers: layers },
          visibleLayers: state.visibleLayers.filter((l) => layers.includes(l)),
        }
      }
      if (state.previewRole === roleKey) {
        patch = {
          ...patch,
          visibleLayers: state.visibleLayers.filter((l) => layers.includes(l)),
        }
      }
      return patch
    }),

  setRoleEventTypePerms: (roleKey, types) =>
    set((state) => {
      const newPerms = { ...state.roleEventTypePerms, [roleKey]: types }
      let patch: Partial<CityState> = { roleEventTypePerms: newPerms }
      if (state.currentUser.role === roleKey && !state.previewRole) {
        patch = {
          ...patch,
          currentUser: { ...state.currentUser, permittedEventTypes: types },
        }
      }
      return patch
    }),

  setActiveEnvMetric: (m) => set({ activeEnvMetric: m }),

  setPreviewRole: (role) =>
    set((state) => {
      if (role === null) {
        return {
          previewRole: null,
          visibleLayers: state.visibleLayers.filter((l) => state.currentUser.permittedLayers.includes(l)),
        }
      }
      const previewUser = makeDefaultUser(role)
      return {
        previewRole: role,
        visibleLayers: state.visibleLayers.filter((l) => previewUser.permittedLayers.includes(l)),
      }
    }),

  generateEventFromEnvAlert: (regionId, metric) => {
    const state = get()
    const region = state.environmentRegions.find((r) => r.regionId === regionId)
    if (!region) return null

    const existing = state.events.find(
      (e) => e.generatedFrom?.regionId === regionId && e.generatedFrom?.metric === metric && e.status !== 'resolved'
    )
    if (existing) return existing

    const value = region.metrics[metric]
    const metricLabels: Record<EnvMetricKey, string> = {
      pm25: 'PM2.5',
      aqi: 'AQI',
      noise: '噪声',
      waterQuality: '水质',
    }

    const ths = {
      pm25: [35, 75, 115, 150, 300],
      aqi: [50, 100, 150, 200, 500],
      noise: [55, 65, 75, 85, 100],
      waterQuality: [2, 3, 4, 5, 6],
    }[metric]

    let level: CityEvent['level'] = 'minor'
    if (value >= ths[3]) level = 'critical'
    else if (value >= ths[1]) level = 'major'

    const user = state.getEffectiveUser()
    const centerPoint = region.heatmapPoints[Math.floor(region.heatmapPoints.length / 2)]
    const location: [number, number, number] = centerPoint
      ? [centerPoint.position[0], 0, centerPoint.position[2]]
      : [0, 0, 0]

    const actionNames = ['异常检测上报', '区级管理员审核', '处置人员派单执行', '验证完成闭环']
    const assigneeNames = ['系统', '王主任（区级）', '李处置员', '赵审核员']
    const steps = actionNames.map((a, idx) => ({
      action: a,
      assignee: assigneeNames[idx],
      status: 'pending' as const,
      timestamp: idx === 0 ? Date.now() : undefined,
    }))

    const actionLog: EventActionLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type: 'env_generated',
      timestamp: Date.now(),
      userId: user.id,
      userName: user.name,
      description: `由环境告警自动生成：${metricLabels[metric]} ${value}`,
      metadata: { regionId, metric, value },
    }

    const newEvent: CityEvent = {
      id: `evt-${Date.now()}`,
      title: `${metricLabels[metric]}超标告警 - ${regionId}`,
      level,
      status: 'detected',
      type: 'environment',
      location,
      createdAt: Date.now(),
      steps,
      annotations: [],
      actionLogs: [actionLog],
      generatedFrom: { regionId, metric, value },
    }

    set((state) => ({
      events: [...state.events, newEvent],
    }))

    return newEvent
  },

  addEventActionLog: (eventId, log) =>
    set((state) => ({
      events: state.events.map((e) =>
        e.id === eventId
          ? {
              ...e,
              actionLogs: [
                ...e.actionLogs,
                { ...log, id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, timestamp: Date.now() },
              ],
            }
          : e
      ),
    })),

  setActiveLightPreset: (presetId) => set({ activeLightPreset: presetId }),

  setSelectedTrafficLights: (ids) => set({ selectedTrafficLights: ids }),

  applyPresetToTrafficLights: (presetId, lightIds) =>
    set((state) => {
      const preset = state.lightSchedulePresets.find((p) => p.id === presetId)
      if (!preset) return state
      return {
        trafficLights: state.trafficLights.map((l) => {
          if (!lightIds.includes(l.id)) return l
          let remaining = l.remainingSeconds
          if (l.currentPhase === 'green') remaining = preset.schedule.green
          else if (l.currentPhase === 'red') remaining = preset.schedule.red
          else if (l.currentPhase === 'yellow') remaining = preset.schedule.yellow
          return { ...l, schedule: { ...preset.schedule }, remainingSeconds: remaining }
        }),
        activeLightPreset: presetId,
      }
    }),

  addLightSchedulePreset: (preset) =>
    set((state) => ({
      lightSchedulePresets: [
        ...state.lightSchedulePresets,
        { ...preset, id: `preset-${Date.now()}` },
      ],
    })),

  deleteLightSchedulePreset: (presetId) =>
    set((state) => ({
      lightSchedulePresets: state.lightSchedulePresets.filter((p) => p.id !== presetId),
      activeLightPreset: state.activeLightPreset === presetId ? null : state.activeLightPreset,
    })),
}))
