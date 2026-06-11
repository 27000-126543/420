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
} from '@/types'

export type EnvMetricKey = 'pm25' | 'aqi' | 'noise' | 'waterQuality'

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
  setActiveEnvMetric: (m: EnvMetricKey) => void
}

export const useCityStore = create<CityState>((set, get) => ({
  currentUser: {
    id: 'user-001',
    name: '系统管理员',
    role: 'city',
    permittedLayers: ['traffic', 'environment', 'energy', 'sensors', 'events', 'annotations'],
  },
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

  setBuildings: (b) => set({ buildings: b }),
  setSensors: (s) => set({ sensors: s }),
  setTrafficFlows: (f) => set({ trafficFlows: f }),
  setTrafficLights: (l) => set({ trafficLights: l }),
  setEnvironmentRegions: (r) => set({ environmentRegions: r }),
  setEnergyData: (e) => set({ energyData: e }),
  setEvents: (e) => set({ events: e }),
  toggleLayer: (layer) =>
    set((state) => {
      const perms = state.currentUser.permittedLayers as LayerKey[]
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
      const perms = state.currentUser.permittedLayers as LayerKey[]
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
        return { ...e, steps: newSteps, status: newStatus, returnedFromStep }
      }),
    })),
  addAnnotation: (a) => set((state) => ({ annotations: [...state.annotations, a] })),
  addEventAnnotation: (eventId, a) =>
    set((state) => ({
      annotations: [...state.annotations, a],
      events: state.events.map((e) =>
        e.id === eventId ? { ...e, annotations: [...e.annotations, a] } : e
      ),
    })),
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
      const perms = state.roleLayerPerms[role] ?? []
      const nameMap: Record<string, string> = {
        city: '系统管理员',
        district: '王主任（区级）',
        street: '李街道',
        enterprise: '企业用户A',
      }
      const newVisible = state.visibleLayers.filter((l) => perms.includes(l))
      return {
        currentUser: {
          ...state.currentUser,
          role,
          name: nameMap[role] ?? state.currentUser.name,
          permittedLayers: perms,
        },
        visibleLayers: newVisible,
      }
    }),
  setRoleLayerPerms: (roleKey, layers) =>
    set((state) => {
      const newPerms = { ...state.roleLayerPerms, [roleKey]: layers }
      let patch: Partial<CityState> = { roleLayerPerms: newPerms }
      if (state.currentUser.role === roleKey) {
        patch = {
          ...patch,
          currentUser: { ...state.currentUser, permittedLayers: layers },
          visibleLayers: state.visibleLayers.filter((l) => layers.includes(l)),
        }
      }
      return patch
    }),
  setActiveEnvMetric: (m) => set({ activeEnvMetric: m }),
}))
