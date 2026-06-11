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
}

export interface TrafficFlow {
  roadId: string
  segments: TrafficSegment[]
  trafficLights: TrafficLight[]
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

export type EventStatus = 'detected' | 'reported' | 'assigned' | 'processing' | 'resolved' | 'returned'

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
}

export type LayerKey = 'traffic' | 'environment' | 'energy' | 'sensors' | 'events' | 'annotations'

export type ViewMode = 'city' | 'district' | 'building'

export type PanelType = 'none' | 'traffic' | 'environment' | 'energy' | 'events' | 'admin'
