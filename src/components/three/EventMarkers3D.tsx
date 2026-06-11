import { useState, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { useCityStore } from '@/store/useCityStore'
import type { CityEvent } from '@/types'

const levelColors: Record<CityEvent['level'], string> = {
  critical: '#ff3355',
  major: '#ff6b2b',
  minor: '#ffcc00',
}

const typeLabels: Record<CityEvent['type'], string> = {
  traffic: '交通',
  environment: '环境',
  energy: '能源',
  security: '安防',
}

export default function EventMarkers3D() {
  const events = useCityStore((s) => s.events)
  const setSelectedEvent = useCityStore((s) => s.setSelectedEvent)
  const previewRole = useCityStore((s) => s.previewRole)
  const previewVisibleLayers = useCityStore((s) => s.previewVisibleLayers)
  const prePreviewVisibleLayers = useCityStore((s) => s.prePreviewVisibleLayers)
  const actualVisibleLayers = useCityStore((s) => s.visibleLayers)
  const currentUserRole = useCityStore((s) => s.currentUser.role)
  const roleEventTypePerms = useCityStore((s) => s.roleEventTypePerms)
  const getEffectivePermittedEventTypes = useCityStore((s) => s.getEffectivePermittedEventTypes)
  const getVisibleLayers = useCityStore((s) => s.getVisibleLayers)
  const eventFilter = useCityStore((s) => s.eventFilter)
  const permittedEventTypes = useMemo(() => getEffectivePermittedEventTypes(), [
    getEffectivePermittedEventTypes,
    previewRole,
    currentUserRole,
    roleEventTypePerms,
  ])
  const visibleLayers = useMemo(() => getVisibleLayers(), [
    getVisibleLayers,
    previewRole,
    previewVisibleLayers,
    prePreviewVisibleLayers,
    actualVisibleLayers,
  ])
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const ringsRef = useRef<THREE.Group>(null)

  const eventsLayerVisible = visibleLayers.includes('events')

  const activeEvents = useMemo(() => {
    if (!eventsLayerVisible) return []
    return events
      .filter((e) => permittedEventTypes.includes(e.type))
      .filter((e) => eventFilter.types.length === 0 || eventFilter.types.includes(e.type))
      .filter((e) => eventFilter.levels.length === 0 || eventFilter.levels.includes(e.level))
      .filter((e) => eventFilter.statuses.length === 0 || eventFilter.statuses.includes(e.status))
  }, [events, eventsLayerVisible, permittedEventTypes, eventFilter])

  useFrame((state) => {
    if (!ringsRef.current) return
    const t = state.clock.elapsedTime
    ringsRef.current.children.forEach((child, i) => {
      const ev = activeEvents[i]
      if (ev?.level === 'critical') {
        const mat = (child as THREE.Mesh).material as THREE.MeshBasicMaterial
        const prog = (t * 0.6 + i * 0.2) % 1
        const s = 1 + prog * 3
        mat.opacity = Math.max(0, 0.7 - prog * 0.7)
        child.scale.set(s, 1, s)
      }
    })
  })

  const beamElements = useMemo(() => {
    return activeEvents.map((ev) => {
      const color = levelColors[ev.level]
      const height = ev.level === 'critical' ? 80 : ev.level === 'major' ? 60 : 40
      const beamSize = ev.level === 'critical' ? 8 : 5
      return (
        <group
          key={`beam-${ev.id}`}
          onPointerOver={(e) => {
            e.stopPropagation()
            setHoveredId(ev.id)
            document.body.style.cursor = 'pointer'
          }}
          onPointerOut={() => {
            setHoveredId(null)
            document.body.style.cursor = ''
          }}
          onClick={(e) => {
            e.stopPropagation()
            setSelectedEvent(ev.id)
          }}
        >
          <mesh position={[ev.location[0], height / 2, ev.location[2]]}>
            <cylinderGeometry args={[beamSize * 0.2, beamSize * 0.9, height, 16, 1, true]} />
            <meshBasicMaterial color={color} transparent opacity={0.35} side={THREE.DoubleSide} toneMapped={false} />
          </mesh>
          <mesh position={[ev.location[0], height / 2, ev.location[2]]}>
            <cylinderGeometry args={[beamSize * 0.05, beamSize * 0.3, height, 8]} />
            <meshBasicMaterial color={color} transparent opacity={0.85} toneMapped={false} />
          </mesh>
          <mesh position={[ev.location[0], 0.3, ev.location[2]]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[beamSize * 1.4, beamSize * 1.6, 48]} />
            <meshBasicMaterial color={color} transparent opacity={0.7} toneMapped={false} side={THREE.DoubleSide} />
          </mesh>
        </group>
      )
    })
  }, [activeEvents, setSelectedEvent])

  const ringElements = useMemo(() => {
    return activeEvents.map((ev) => {
      const color = levelColors[ev.level]
      const size = ev.level === 'critical' ? 14 : 8
      return (
        <mesh
          key={`ring-${ev.id}`}
          position={[ev.location[0], 0.4, ev.location[2]]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[size * 0.8, size, 48]} />
          <meshBasicMaterial color={color} transparent opacity={0.5} toneMapped={false} side={THREE.DoubleSide} />
        </mesh>
      )
    })
  }, [activeEvents])

  const hoveredEvent = useMemo(
    () => events.find((e) => e.id === hoveredId),
    [events, hoveredId]
  )

  return (
    <>
      {beamElements}
      <group ref={ringsRef}>{ringElements}</group>
      {hoveredEvent && (
        <Html
          position={[hoveredEvent.location[0], 100, hoveredEvent.location[2]]}
          center
          distanceFactor={30}
          style={{ pointerEvents: 'none' }}
        >
          <div
            style={{
              background: 'rgba(10, 14, 26, 0.95)',
              border: `1px solid ${levelColors[hoveredEvent.level]}88`,
              borderRadius: 6,
              padding: '10px 14px',
              minWidth: 200,
              backdropFilter: 'blur(8px)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: levelColors[hoveredEvent.level],
                  boxShadow: `0 0 8px ${levelColors[hoveredEvent.level]}`,
                }}
              />
              <span style={{ color: levelColors[hoveredEvent.level], fontSize: 10, fontWeight: 700, letterSpacing: 1 }}>
                {hoveredEvent.level === 'critical' ? '紧急' : hoveredEvent.level === 'major' ? '重大' : '一般'}
              </span>
              <span
                style={{
                  marginLeft: 'auto',
                  padding: '2px 6px',
                  background: 'rgba(30, 41, 59, 0.8)',
                  borderRadius: 3,
                  fontSize: 9,
                  color: '#94a3b8',
                  fontFamily: 'JetBrains Mono, monospace',
                }}
              >
                {typeLabels[hoveredEvent.type]}
              </span>
            </div>
            <div style={{ color: '#fff', fontSize: 13, fontWeight: 600, lineHeight: 1.4 }}>
              {hoveredEvent.title}
            </div>
            <div style={{ color: '#00f0ff', fontSize: 10, marginTop: 6, fontFamily: 'JetBrains Mono, monospace' }}>
              点击查看详情 →
            </div>
          </div>
        </Html>
      )}
    </>
  )
}
