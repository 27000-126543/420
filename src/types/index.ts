export interface SensorData {
  id: string
  type: 'iot' | 'camera' | 'social' | 'weather'
  location: [number, number, number]
  value: number
  status: 'online' | 'offline' | 'alert'
  timestamp: number
}

export interface TrafficSegment {
  start: [number, number, number]
  end: [number, number, number]
  flowIndex: number
  speed: number
}

export interface TrafficLight {
  id: string
  location: [number, number, number]
  currentPhase: 'red' | 'yellow' | 'green'
  remainingSeconds: number
  schedule: { green: number; yellow: number; red: number }
  intersectionName?: string
}

export interface TrafficFlow {
  id: string
  roadId: string
  roadName: string
  flowIndex: number
  speed: number
  segments?: TrafficSegment[]
  trafficLights?: TrafficLight[]
}

export interface EnvironmentMetrics {
  pm25: number
  aqi: number
  noise: number
  waterQuality: number
}

export interface HeatmapPoint {
  position: [number, number, number]
  intensity: number
}

export interface EnvironmentRegion {
  regionId: string
  district?: string
  street?: string
  metrics: EnvironmentMetrics
  heatmapPoints: HeatmapPoint[]
  alertLevel: 'normal' | 'warning' | 'critical'
}

export interface EnergyConsumption {
  buildingId: string
  buildingName: string
  currentKw: number
  trend: { timestamp: number; value: number }[]
  anomalies: { timestamp: number; value: number; type: 'spike' | 'drop' }[]
}

export interface EventStep {
  action: string
  assignee: string
  status: 'pending' | 'approved' | 'rejected' | 'done'
  timestamp?: number
  comment?: string
}

export interface Annotation {
  id: string
  userId: string
  position: [number, number, number]
  content: string
  timestamp: number
}

export type EnvMetricKey = 'pm25' | 'aqi' | 'noise' | 'waterQuality'

export type EventStatus = 'detected' | 'reported' | 'assigned' | 'processing' | 'resolved' | 'returned'

export interface TrafficLightSchedulePreset {
  id: string
  name: string
  description: string
  schedule: { green: number; yellow: number; red: number }
  icon: string
}

export type EventActionType = 
  | 'created' 
  | 'env_generated'
  | 'step_approved' 
  | 'step_rejected' 
  | 'annotation_added' 
  | 'status_changed'
  | 'assigned'
  | 'eta_updated'

export interface EventActionLog {
  id: string
  type: EventActionType
  timestamp: number
  userId: string
  userName: string
  description: string
  metadata?: Record<string, any>
}

export interface CityEvent {
  id: string
  title: string
  level: 'critical' | 'major' | 'minor'
  status: EventStatus
  type: 'traffic' | 'environment' | 'energy' | 'security'
  location: [number, number, number]
  createdAt: number
  steps: EventStep[]
  annotations: Annotation[]
  returnedFromStep?: number
  actionLogs: EventActionLog[]
  generatedFrom?: {
    regionId: string
    metric: EnvMetricKey
    value: number
  }
  assignee?: string
  eta?: number
}

export interface EventFilter {
  types: ('traffic' | 'environment' | 'energy' | 'security')[]
  levels: ('critical' | 'major' | 'minor')[]
  statuses: EventStatus[]
}

export interface BuildingData {
  id: string
  name: string
  position: [number, number, number]
  size: [number, number, number]
  color: string
  district: string
  energyKw: number
  floors: number
  hasAnomaly: boolean
}

export interface UserData {
  id: string
  name: string
  role: 'city' | 'district' | 'street' | 'enterprise'
  district?: string
  street?: string
  enterprise?: string
  permittedLayers: string[]
  permittedEventTypes: ('traffic' | 'environment' | 'energy' | 'security')[]
}

export type LayerKey = 'traffic' | 'environment' | 'energy' | 'sensors' | 'events' | 'annotations'

export type ViewMode = 'city' | 'district' | 'building'

export type PanelType = 'none' | 'traffic' | 'environment' | 'energy' | 'events' | 'admin'
