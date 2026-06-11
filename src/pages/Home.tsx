import { useEffect, useRef } from 'react'
import CityScene from '@/components/three/CityScene'
import TopNav from '@/components/ui/TopNav'
import DataPanel from '@/components/ui/DataPanel'
import Timeline from '@/components/ui/Timeline'
import AlertNotification from '@/components/ui/AlertNotification'
import TrafficPanel from '@/components/panels/TrafficPanel'
import EnvironmentPanel from '@/components/panels/EnvironmentPanel'
import EnergyPanel from '@/components/panels/EnergyPanel'
import EventPanel from '@/components/panels/EventPanel'
import AdminPanel from '@/components/panels/AdminPanel'
import { useCityStore } from '@/store/useCityStore'
import { initMockData, startMockDataStream } from '@/data/mockData'

export default function Home() {
  const activePanel = useCityStore((s) => s.activePanel)
  const currentUser = useCityStore((s) => s.currentUser)
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    initMockData()
    const cleanup = startMockDataStream()
    return cleanup
  }, [])

  const renderPanel = () => {
    const perms = currentUser.permittedLayers as string[]
    const panelToLayer: Record<string, string | null> = {
      traffic: 'traffic',
      environment: 'environment',
      energy: 'energy',
      events: 'events',
      admin: null,
    }
    const required = panelToLayer[activePanel]
    if (required && !perms.includes(required)) return null
    switch (activePanel) {
      case 'traffic':
        return <TrafficPanel />
      case 'environment':
        return <EnvironmentPanel />
      case 'energy':
        return <EnergyPanel />
      case 'events':
        return <EventPanel />
      case 'admin':
        return <AdminPanel />
      default:
        return null
    }
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-cyber-bg">
      <div className="absolute inset-0">
        <CityScene />
      </div>

      <TopNav />
      <DataPanel />
      <Timeline />
      <AlertNotification />
      {renderPanel()}

      <div className="pointer-events-none absolute left-1/2 top-20 z-10 -translate-x-1/2 text-center">
        <div className="mb-1 font-mono text-xs tracking-widest text-cyber-blue/60">
          CITY DIGITAL TWIN PLATFORM
        </div>
        <h1 className="font-mono text-3xl font-bold tracking-wider text-white text-glow-blue">
          CITYTWIN
        </h1>
        <div className="mt-1 flex items-center justify-center gap-2 text-xs text-cyber-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-cyber-green animate-pulse" />
          <span className="font-mono">SYSTEM ONLINE</span>
          <span className="font-mono text-cyber-blue/60">v2.4.1</span>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-20 left-4 z-10 font-mono text-[10px] leading-relaxed text-cyber-muted/70">
        <div>=== CONTROL PANEL ===</div>
        <div>DRAG: 旋转视角</div>
        <div>RIGHT DRAG: 平移</div>
        <div>SCROLL: 缩放</div>
        <div>CLICK: 选择对象</div>
      </div>

      <div className="pointer-events-none absolute bottom-20 right-4 z-10 font-mono text-[10px] leading-relaxed text-cyber-muted/70 text-right">
        <div>=== SYSTEM STATUS ===</div>
        <div className="text-cyber-green">RENDER: OK</div>
        <div className="text-cyber-green">DATA STREAM: ACTIVE</div>
        <div className="text-cyber-green">IoT NODES: CONNECTED</div>
        <div className="text-cyber-blue">LATENCY: 32ms</div>
      </div>
    </div>
  )
}
