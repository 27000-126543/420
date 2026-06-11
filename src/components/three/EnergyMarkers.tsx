import { useState, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { useCityStore } from '@/store/useCityStore'

export default function EnergyMarkers() {
  const energyData = useCityStore((s) => s.energyData)
  const buildings = useCityStore((s) => s.buildings)
  const ringRef = useRef<THREE.Group>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const maxKw = useMemo(() => {
    let m = 1
    energyData.forEach((ed) => {
      if (ed.currentKw > m) m = ed.currentKw
    })
    return m
  }, [energyData])

  const energyMap = useMemo(() => {
    const m: Record<string, (typeof energyData)[number]> = {}
    energyData.forEach((ed) => (m[ed.buildingId] = ed))
    return m
  }, [energyData])

  const buildingIdMap = useMemo(() => {
    const m: Record<string, typeof buildings[number]> = {}
    buildings.forEach((b) => (m[b.id] = b))
    return m
  }, [buildings])

  const anomalyBuildings = useMemo(
    () => energyData.filter((ed) => ed.anomalies.length > 0),
    [energyData]
  )

  useFrame((state) => {
    if (!ringRef.current) return
    const t = state.clock.elapsedTime
    ringRef.current.children.forEach((child, i) => {
      const mat = (child as THREE.Mesh).material as THREE.MeshBasicMaterial
      const pulse = 0.4 + Math.sin(t * 2.5 + i * 0.8) * 0.35
      mat.opacity = pulse
      const s = 1 + Math.sin(t * 2 + i) * 0.08
      child.scale.set(s, 1, s)
    })
  })

  const barElements = useMemo(() => {
    const els: React.ReactNode[] = []
    const tmpC = new THREE.Color()
    energyData.slice(0, Math.min(energyData.length, 60)).forEach((ed) => {
      const b = buildingIdMap[ed.buildingId]
      if (!b) return
      const ratio = ed.currentKw / maxKw
      const height = 2 + ratio * 15
      if (ratio < 0.2) return
      if (ratio < 0.5) tmpC.set('#00ff88')
      else if (ratio < 0.75) tmpC.set('#ffaa00')
      else tmpC.set('#ff3355')
      const barW = Math.max(2, Math.min(b.size[0], b.size[2]) * 0.2)
      els.push(
        <mesh
          key={`bar-${ed.buildingId}`}
          position={[
            b.position[0] + b.size[0] * 0.35,
            b.size[1] + height / 2,
            b.position[2] + b.size[2] * 0.35,
          ]}
        >
          <boxGeometry args={[barW, height, barW]} />
          <meshBasicMaterial color={tmpC} transparent opacity={0.75} toneMapped={false} />
        </mesh>
      )
    })
    return els
  }, [energyData, buildingIdMap, maxKw])

  const ringElements = useMemo(() => {
    return anomalyBuildings.map((ed) => {
      const b = buildingIdMap[ed.buildingId]
      if (!b) return null
      const lastA = ed.anomalies[ed.anomalies.length - 1]
      const ringColor = lastA?.type === 'spike' ? '#ff6b2b' : '#00f0ff'
      const ringSize = Math.max(b.size[0], b.size[2]) * 0.75
      return (
        <group key={`ring-${ed.buildingId}`}>
          <mesh
            position={[b.position[0], 0.3, b.position[2]]}
            rotation={[-Math.PI / 2, 0, 0]}
            onPointerOver={(e) => {
              e.stopPropagation()
              setHoveredId(ed.buildingId)
            }}
            onPointerOut={() => setHoveredId(null)}
          >
            <ringGeometry args={[ringSize * 0.9, ringSize, 64]} />
            <meshBasicMaterial color={ringColor} transparent opacity={0.6} side={THREE.DoubleSide} toneMapped={false} />
          </mesh>
          <mesh
            position={[b.position[0], 0.5, b.position[2]]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <ringGeometry args={[ringSize * 0.6, ringSize * 0.65, 64]} />
            <meshBasicMaterial color={ringColor} transparent opacity={0.35} side={THREE.DoubleSide} toneMapped={false} />
          </mesh>
        </group>
      )
    })
  }, [anomalyBuildings, buildingIdMap])

  const hoveredBuilding = hoveredId ? buildingIdMap[hoveredId] : null
  const hoveredEnergy = hoveredId ? energyMap[hoveredId] : null

  return (
    <>
      {barElements}
      <group ref={ringRef}>{ringElements}</group>
      {hoveredBuilding && hoveredEnergy && (
        <Html
          position={[hoveredBuilding.position[0], hoveredBuilding.size[1] + 20, hoveredBuilding.position[2]]}
          center
          distanceFactor={25}
          style={{ pointerEvents: 'none' }}
        >
          <div
            style={{
              background: 'rgba(10, 14, 26, 0.95)',
              border: '1px solid rgba(255, 107, 43, 0.5)',
              borderRadius: 6,
              padding: '10px 14px',
              minWidth: 180,
              backdropFilter: 'blur(8px)',
              fontFamily: 'JetBrains Mono, monospace',
            }}
          >
            <div style={{ color: '#fff', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
              {hoveredBuilding.name}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
              <span style={{ color: '#64748b', fontSize: 10 }}>当前功率</span>
              <span style={{ color: '#00f0ff', fontSize: 14, fontWeight: 700 }}>
                {hoveredEnergy.currentKw.toFixed(0)} kW
              </span>
            </div>
            {hoveredEnergy.anomalies.length > 0 && (
              <div style={{ marginTop: 6, color: '#ff6b2b', fontSize: 10, fontWeight: 600 }}>
                ⚠ {hoveredEnergy.anomalies.length} 个异常点
              </div>
            )}
          </div>
        </Html>
      )}
    </>
  )
}
