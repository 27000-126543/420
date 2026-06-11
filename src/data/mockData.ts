import type {
  BuildingData,
  TrafficFlow,
  TrafficLight,
  SensorData,
  EnvironmentRegion,
  EnergyConsumption,
  CityEvent,
  Annotation,
  EventActionLog,
} from '@/types'
import { useCityStore } from '@/store/useCityStore'

let _seed = 42
function seededRandom(): number {
  _seed = (_seed * 16807 + 0) % 2147483647
  return (_seed - 1) / 2147483646
}
function randFloat(min: number, max: number): number {
  return min + seededRandom() * (max - min)
}
function randInt(min: number, max: number): number {
  return Math.floor(randFloat(min, max + 1))
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(seededRandom() * arr.length)]
}

const DISTRICTS = ['浦东新区', '黄浦区', '徐汇区', '静安区', '长宁区', '普陀区', '虹口区', '杨浦区', '闵行区', '宝山区']
const BUILDING_PREFIXES = ['金融', '科技', '商贸', '国际', '世纪', '环球', '中环', '凯旋', '恒隆', '陆家嘴']
const BUILDING_SUFFIXES = ['中心', '大厦', '广场', '产业园', '商务楼', '国际中心', '总部', '创新园']
const BUILDING_BLOCKS = ['A座', 'B栋', 'C区', 'D座', 'E栋', 'F区']

const DARK_COLORS = ['#1a2035', '#1c2240', '#182030', '#1e2545', '#151d2e', '#192338', '#1a1f35', '#1d2640']
const ACCENT_COLORS = ['#2a4a7f', '#3a6ea5', '#4a90d9', '#1a5276', '#2e86c1', '#5dade2', '#1b4f72', '#2874a6']

export function generateBuildings(): BuildingData[] {
  _seed = 42
  const buildings: BuildingData[] = []
  let id = 1
  for (let gx = -4; gx <= 4; gx++) {
    for (let gz = -4; gz <= 4; gz++) {
      const count = randInt(2, 5)
      for (let i = 0; i < count; i++) {
        const bx = gx * 100 + randFloat(-35, 35)
        const bz = gz * 100 + randFloat(-35, 35)
        const height = randInt(10, 80)
        const width = randFloat(12, 25)
        const depth = randFloat(12, 25)
        const isAnomaly = seededRandom() < 0.08
        const isAccent = seededRandom() < 0.15
        buildings.push({
          id: `b-${id++}`,
          name: `${pick(BUILDING_PREFIXES)}${pick(BUILDING_SUFFIXES)}${pick(BUILDING_BLOCKS)}`,
          position: [bx, 0, bz],
          size: [width, height, depth],
          color: isAccent ? pick(ACCENT_COLORS) : pick(DARK_COLORS),
          district: DISTRICTS[Math.abs(gx + 4) % DISTRICTS.length],
          energyKw: randInt(50, 500),
          floors: Math.floor(height / 3),
          hasAnomaly: isAnomaly,
        })
      }
    }
  }
  return buildings
}

export function generateRoads(): TrafficFlow[] {
  _seed = 100
  const roads: TrafficFlow[] = []
  let id = 1
  for (let i = -4; i <= 4; i++) {
    const segCount = randInt(4, 8)
    const hsegments: TrafficFlow['segments'] = []
    for (let s = 0; s < segCount; s++) {
      const t = s / segCount
      hsegments.push({
        start: [i * 100, 0.1, -500 + t * 1000],
        end: [i * 100, 0.1, -500 + (t + 1 / segCount) * 1000],
        flowIndex: seededRandom(),
        speed: randInt(10, 80),
      })
    }
    const avgFlowH = hsegments.reduce((s, x) => s + x.flowIndex, 0) / (hsegments.length || 1)
    const avgSpeedH = hsegments.reduce((s, x) => s + x.speed, 0) / (hsegments.length || 1)
    const ridV = id++
    roads.push({
      id: `road-v-${ridV}`,
      roadId: `road-v-${ridV}`,
      roadName: `纵向大道 ${ridV}`,
      flowIndex: Math.round(avgFlowH * 100) / 100,
      speed: Math.round(avgSpeedH),
      segments: hsegments,
      trafficLights: [],
    })

    const vsegments: TrafficFlow['segments'] = []
    for (let s = 0; s < segCount; s++) {
      const t = s / segCount
      vsegments.push({
        start: [-500 + t * 1000, 0.1, i * 100],
        end: [-500 + (t + 1 / segCount) * 1000, 0.1, i * 100],
        flowIndex: seededRandom(),
        speed: randInt(10, 80),
      })
    }
    const avgFlowV = vsegments.reduce((s, x) => s + x.flowIndex, 0) / (vsegments.length || 1)
    const avgSpeedV = vsegments.reduce((s, x) => s + x.speed, 0) / (vsegments.length || 1)
    const ridH = id++
    roads.push({
      id: `road-h-${ridH}`,
      roadId: `road-h-${ridH}`,
      roadName: `横向大道 ${ridH}`,
      flowIndex: Math.round(avgFlowV * 100) / 100,
      speed: Math.round(avgSpeedV),
      segments: vsegments,
      trafficLights: [],
    })
  }
  return roads
}

export function generateTrafficLights(): TrafficLight[] {
  _seed = 200
  const lights: TrafficLight[] = []
  let id = 1
  for (let gx = -4; gx <= 4; gx += 1) {
    for (let gz = -4; gz <= 4; gz += 1) {
      if (seededRandom() > 0.45) continue
      const phase = pick<'red' | 'yellow' | 'green'>(['red', 'yellow', 'green'])
      const greenDur = randInt(20, 60)
      const redDur = randInt(20, 60)
      const yellowDur = 5
      let remaining = 0
      if (phase === 'green') remaining = greenDur
      else if (phase === 'yellow') remaining = yellowDur
      else remaining = redDur
      lights.push({
        id: `tl-${id}`,
        intersectionName: `路口 G${gx >= 0 ? '' : '-'}${Math.abs(gx)}-G${gz >= 0 ? '' : '-'}${Math.abs(gz)}`,
        location: [gx * 100, 4, gz * 100],
        currentPhase: phase,
        remainingSeconds: remaining,
        schedule: { green: greenDur, yellow: yellowDur, red: redDur },
      })
      id++
    }
  }
  return lights
}

const SENSOR_TYPES = ['iot', 'camera', 'social', 'weather'] as const

export function generateSensors(): SensorData[] {
  _seed = 300
  const sensors: SensorData[] = []
  let id = 1
  for (let i = 0; i < 120; i++) {
    const type = pick([...SENSOR_TYPES])
    const statusRoll = seededRandom()
    const status = statusRoll < 0.85 ? 'online' : statusRoll < 0.94 ? 'alert' : 'offline'
    const valueRanges: Record<string, [number, number]> = {
      iot: [0, 100],
      camera: [0, 1],
      social: [0, 1000],
      weather: [-10, 40],
    }
    const [min, max] = valueRanges[type]
    sensors.push({
      id: `sensor-${id++}`,
      type,
      location: [randFloat(-480, 480), randFloat(2, 60), randFloat(-480, 480)],
      value: Math.round(randFloat(min, max) * 100) / 100,
      status,
      timestamp: Date.now() - randInt(0, 60000),
    })
  }
  return sensors
}

export function generateEnvironmentRegions(): EnvironmentRegion[] {
  _seed = 400
  const regions: EnvironmentRegion[] = []
  let id = 1
  for (let i = 0; i < 24; i++) {
    const alertRoll = seededRandom()
    const alertLevel = alertRoll < 0.12 ? 'critical' : alertRoll < 0.3 ? 'warning' : 'normal'
    const cx = randFloat(-400, 400)
    const cz = randFloat(-400, 400)
    const radius = randFloat(40, 120)
    const heatmapPoints: EnvironmentRegion['heatmapPoints'] = []
    const ptCount = randInt(8, 20)
    for (let p = 0; p < ptCount; p++) {
      const angle = seededRandom() * Math.PI * 2
      const dist = seededRandom() * radius
      heatmapPoints.push({
        position: [cx + Math.cos(angle) * dist, 0.15, cz + Math.sin(angle) * dist],
        intensity: alertLevel === 'critical' ? randFloat(0.6, 1) : alertLevel === 'warning' ? randFloat(0.3, 0.7) : randFloat(0, 0.4),
      })
    }
    const districts = ['浦东新区', '黄浦区', '静安区', '徐汇区', '长宁区', '普陀区', '虹口区', '杨浦区']
    const streets = ['陆家嘴街道', '花木街道', '外滩街道', '南京西路街道', '徐家汇街道', '虹桥街道', '长寿路街道', '五角场街道']
    const rid = id++
    regions.push({
      regionId: `env-${rid}`,
      district: districts[(rid - 1) % districts.length],
      street: streets[(rid - 1) % streets.length],
      metrics: {
        pm25: alertLevel === 'critical' ? randInt(150, 300) : alertLevel === 'warning' ? randInt(75, 150) : randInt(10, 75),
        aqi: alertLevel === 'critical' ? randInt(200, 500) : alertLevel === 'warning' ? randInt(100, 200) : randInt(20, 100),
        noise: Math.round(randFloat(30, 90) * 10) / 10,
        waterQuality: Math.round(randFloat(1, 5) * 10) / 10,
      },
      alertLevel,
      heatmapPoints,
    })
  }
  return regions
}

export function generateEnergyData(): EnergyConsumption[] {
  _seed = 500
  const buildings = generateBuildings()
  const data: EnergyConsumption[] = []
  const now = Date.now()
  for (const b of buildings) {
    const base = b.energyKw
    const trend: EnergyConsumption['trend'] = []
    const anomalies: EnergyConsumption['anomalies'] = []
    for (let t = 0; t < 60; t++) {
      const isAnomalyPoint = seededRandom() < 0.03
      const baseVal = base + randFloat(-base * 0.15, base * 0.15)
      const anomalyVal = base * randFloat(1.5, 3)
      const value = isAnomalyPoint ? anomalyVal : baseVal
      const ts = now - (59 - t) * 60000
      trend.push({ timestamp: ts, value })
      if (isAnomalyPoint) {
        anomalies.push({ timestamp: ts, value, type: seededRandom() < 0.5 ? 'spike' : 'drop' })
      }
    }
    const lastVal = trend[trend.length - 1]?.value ?? base
    data.push({
      buildingId: b.id,
      buildingName: b.name,
      currentKw: Math.round(lastVal * 100) / 100,
      trend,
      anomalies,
    })
  }
  return data
}

export function generateEvents(buildings: BuildingData[]): CityEvent[] {
  _seed = 600
  const titles: Record<string, string[]> = {
    environment: ['PM2.5超标预警', '水质异常检测', '噪音扰民事件', '大气污染预警'],
    traffic: ['交通拥堵事件', '信号灯故障', '交通事故预警', '道路施工通知'],
    energy: ['用电高峰预警', '电力负荷异常', '能源消耗超标', '供电中断风险'],
    security: ['消防隐患预警', '治安异常事件', '建筑安全警报', '人群聚集预警'],
  }
  const levels: Array<'critical' | 'major' | 'minor'> = ['critical', 'major', 'minor']
  const statuses: Array<'detected' | 'reported' | 'assigned' | 'processing' | 'resolved'> = ['detected', 'reported', 'assigned', 'processing', 'resolved']
  const events: CityEvent[] = []
  let id = 1
  for (let i = 0; i < 14; i++) {
    const type = pick(['traffic', 'environment', 'energy', 'security']) as CityEvent['type']
    const status = pick(statuses)
    const level = status === 'resolved' ? (pick(levels) as CityEvent['level']) : (pick(levels) as CityEvent['level'])
    const titleList = titles[type]
    const title = pick(titleList)
    const sampleBuilding = buildings[Math.floor(seededRandom() * buildings.length)]
    const location: [number, number, number] = sampleBuilding
      ? [sampleBuilding.position[0], 0, sampleBuilding.position[2]]
      : [randFloat(-450, 450), 0, randFloat(-450, 450)]

    const stepStatuses: EventStepStatus[] = []
    if (status === 'detected') {
      stepStatuses.push({ st: 'pending', ts: undefined })
      stepStatuses.push({ st: 'pending', ts: undefined })
      stepStatuses.push({ st: 'pending', ts: undefined })
      stepStatuses.push({ st: 'pending', ts: undefined })
    } else if (status === 'reported') {
      stepStatuses.push({ st: 'approved', ts: Date.now() - 3600000 })
      stepStatuses.push({ st: 'pending', ts: undefined })
      stepStatuses.push({ st: 'pending', ts: undefined })
      stepStatuses.push({ st: 'pending', ts: undefined })
    } else if (status === 'assigned') {
      stepStatuses.push({ st: 'approved', ts: Date.now() - 3600000 })
      stepStatuses.push({ st: 'approved', ts: Date.now() - 1800000 })
      stepStatuses.push({ st: 'pending', ts: undefined })
      stepStatuses.push({ st: 'pending', ts: undefined })
    } else if (status === 'processing') {
      stepStatuses.push({ st: 'approved', ts: Date.now() - 3600000 })
      stepStatuses.push({ st: 'approved', ts: Date.now() - 1800000 })
      stepStatuses.push({ st: 'done', ts: Date.now() - 600000 })
      stepStatuses.push({ st: 'pending', ts: undefined })
    } else {
      stepStatuses.push({ st: 'approved', ts: Date.now() - 7200000 })
      stepStatuses.push({ st: 'approved', ts: Date.now() - 5400000 })
      stepStatuses.push({ st: 'done', ts: Date.now() - 3600000 })
      stepStatuses.push({ st: 'done', ts: Date.now() - 1800000 })
    }

    type EventStepStatus = { st: 'pending' | 'approved' | 'done'; ts: number | undefined }
    const actionNames = ['异常检测上报', '区级管理员审核', '处置人员派单执行', '验证完成闭环']
    const assigneeNames = ['系统', '王主任（区级）', '李处置员', '赵审核员']
    const steps = actionNames.map((a, idx) => ({
      action: a,
      assignee: assigneeNames[idx],
      status: stepStatuses[idx].st,
      timestamp: stepStatuses[idx].ts,
    }))

    events.push({
      id: `evt-${id++}`,
      title,
      level,
      status,
      type,
      location,
      createdAt: Date.now() - randInt(600000, 172800000),
      steps,
      annotations: [],
      actionLogs: stepStatuses.flatMap<EventActionLog>((s, idx) => {
        if (s.st === 'pending') return []
        const logType: 'step_approved' | 'step_rejected' = s.st === 'approved' || s.st === 'done' ? 'step_approved' : 'step_rejected'
        return [{
          id: `log-mock-${id}-${idx}`,
          type: logType,
          timestamp: s.ts ?? Date.now(),
          userId: `user-${idx}`,
          userName: assigneeNames[idx],
          description: `${logType === 'step_approved' ? '审批通过' : '审批退回'}：${actionNames[idx]}`,
        }]
      }),
    })
  }
  return events
}

export function generateAnnotations(): Annotation[] {
  _seed = 700
  return [
    {
      id: 'ann-1',
      userId: 'admin',
      position: [0, 85, 0],
      content: '城市核心区域 — 实时监控中',
      timestamp: Date.now() - 3600000,
    },
    {
      id: 'ann-2',
      userId: 'tech-a',
      position: [200, 40, -150],
      content: '科技产业园集群区',
      timestamp: Date.now() - 7200000,
    },
    {
      id: 'ann-3',
      userId: 'manager-b',
      position: [-300, 55, 200],
      content: '金融中心区 — 能耗异常关注',
      timestamp: Date.now() - 1800000,
    },
  ]
}

export function initMockData() {
  const store = useCityStore.getState()
  const buildings = generateBuildings()
  store.setBuildings(buildings)
  store.setTrafficFlows(generateRoads())
  store.setTrafficLights(generateTrafficLights())
  store.setSensors(generateSensors())
  store.setEnvironmentRegions(generateEnvironmentRegions())
  store.setEnergyData(generateEnergyData())
  store.setEvents(generateEvents(buildings))
  useCityStore.setState({ annotations: generateAnnotations() })
}

export function startMockDataStream(): () => void {
  const intervals: ReturnType<typeof setInterval>[] = []

  intervals.push(setInterval(() => {
    const store = useCityStore.getState()
    const sensors = store.sensors.map(s => {
      if (s.status === 'offline') return s
      const delta = (Math.random() - 0.5) * 2
      const ranges: Record<string, [number, number]> = {
        iot: [0, 100], camera: [0, 1], social: [0, 1000], weather: [-10, 40],
      }
      const [min, max] = ranges[s.type]
      return {
        ...s,
        value: Math.round(Math.min(max, Math.max(min, s.value + delta)) * 100) / 100,
        timestamp: Date.now(),
      }
    })
    store.setSensors(sensors)
  }, 2000))

  intervals.push(setInterval(() => {
    const store = useCityStore.getState()
    const lights = store.trafficLights.map(tl => {
      const { green, yellow, red } = tl.schedule
      let { currentPhase, remainingSeconds } = tl
      remainingSeconds -= 3
      if (remainingSeconds <= 0) {
        if (currentPhase === 'green') {
          currentPhase = 'yellow'
          remainingSeconds = yellow
        } else if (currentPhase === 'yellow') {
          currentPhase = 'red'
          remainingSeconds = red
        } else {
          currentPhase = 'green'
          remainingSeconds = green
        }
      }
      return { ...tl, currentPhase, remainingSeconds: Math.max(0, remainingSeconds) }
    })
    store.setTrafficLights(lights)
  }, 3000))

  intervals.push(setInterval(() => {
    const store = useCityStore.getState()
    const flows = store.trafficFlows.map(r => ({
      ...r,
      segments: r.segments.map(seg => ({
        ...seg,
        flowIndex: Math.max(0, Math.min(1, seg.flowIndex + (Math.random() - 0.5) * 0.1)),
      })),
    }))
    store.setTrafficFlows(flows)
  }, 5000))

  intervals.push(setInterval(() => {
    const store = useCityStore.getState()
    if (Math.random() < 0.5) {
      const alertTypes = ['environment', 'traffic', 'security', 'energy'] as const
      const alertMessages: Record<string, string[]> = {
        environment: ['PM2.5浓度突升', '水质指标异常', '噪音超标告警'],
        traffic: ['主干道拥堵加剧', '信号灯异常闪烁', '路口车流异常'],
        security: ['人员聚集预警', '消防通道占用', '建筑结构异常'],
        energy: ['区域用电激增', '变电站负荷过高', '线路温度异常'],
      }
      const type = pick([...alertTypes])
      const level = Math.random() < 0.35 ? 'critical' : 'warning'
      store.addAlert({
        id: `alert-${Date.now()}`,
        message: pick(alertMessages[type]),
        level,
        timestamp: Date.now(),
      })
    }
  }, 12000))

  intervals.push(setInterval(() => {
    const store = useCityStore.getState()
    const now = Date.now()
    const energyData = store.energyData.map(ed => {
      const newTrend = [...ed.trend]
      const lastTrend = newTrend[newTrend.length - 1]
      const base = lastTrend?.value ?? ed.currentKw
      const isAnomalyPoint = Math.random() < 0.03
      const newVal = isAnomalyPoint
        ? base * (1.4 + Math.random() * 1.2)
        : Math.max(20, base + (Math.random() - 0.5) * base * 0.08)
      const anomalyType: 'spike' | 'drop' = newVal > base ? 'spike' : 'drop'
      newTrend.shift()
      newTrend.push({ timestamp: now, value: Math.round(newVal * 100) / 100 })
      const newAnomalies = [...ed.anomalies]
      if (isAnomalyPoint) {
        newAnomalies.push({ timestamp: now, value: Math.round(newVal * 100) / 100, type: anomalyType })
      }
      return {
        ...ed,
        currentKw: Math.round(newVal * 100) / 100,
        trend: newTrend,
        anomalies: newAnomalies.slice(-10),
      }
    })
    store.setEnergyData(energyData)
  }, 5000))

  return () => {
    for (const id of intervals) clearInterval(id)
  }
}
