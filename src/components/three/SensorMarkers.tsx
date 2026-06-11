import { useState, useRef, useMemo, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { useCityStore } from '@/store/useCityStore'
import type { SensorData } from '@/types'

const statusColors = {
  online: '#00ff88',
  alert: '#ff6b2b',
  offline: '#64748b',
}

const typeLabels: Record<SensorData['type'], string> = {
  iot: 'IoT',
  camera: '摄像头',
  social: '社交媒体',
  weather: '气象站',
}

const dummy = new THREE.Object3D()
const tempColor = new THREE.Color()

export default function SensorMarkers() {
  const sensors = useCityStore((s) => s.sensors)
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const { alertIndices, nonAlertCount } = useMemo(() => {
    const alertIdx: number[] = []
    let nonAlert = 0
    sensors.forEach((s, i) => {
      if (s.status === 'alert') alertIdx.push(i)
      else nonAlert++
    })
    return { alertIndices: alertIdx, nonAlertCount: nonAlert }
  }, [sensors])

  useMemo(() => {
    if (!meshRef.current) return
    meshRef.current.count = Math.max(sensors.length, 1)
    sensors.forEach((s, i) => {
      dummy.position.set(s.location[0], s.location[1], s.location[2])
      dummy.scale.set(1.4, 1.4, 1.4)
      dummy.rotation.set(Math.PI / 4, 0, Math.PI / 4)
      dummy.updateMatrix()
      meshRef.current!.setMatrixAt(i, dummy.matrix)
      tempColor.set(statusColors[s.status])
      meshRef.current!.setColorAt(i, tempColor)
    })
    meshRef.current.instanceMatrix.needsUpdate = true
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true
  }, [sensors])

  const handlePointerOver = useCallback((e: any) => {
    e.stopPropagation()
    const idx = e.instanceId
    if (idx !== undefined && idx < sensors.length) {
      setHoveredId(sensors[idx].id)
      document.body.style.cursor = 'pointer'
    }
  }, [sensors])

  const handlePointerOut = useCallback(() => {
    setHoveredId(null)
    document.body.style.cursor = ''
  }, [])

  useFrame((state) => {
    if (!meshRef.current || alertIndices.length === 0) return
    const t = state.clock.elapsedTime
    for (const i of alertIndices) {
      const s = sensors[i]
      const pulse = 1 + Math.sin(t * 4 + i) * 0.25
      dummy.position.set(s.location[0], s.location[1], s.location[2])
      dummy.scale.set(1.4 * pulse, 1.4 * pulse, 1.4 * pulse)
      dummy.rotation.set(Math.PI / 4, t * 0.5, Math.PI / 4)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    }
    meshRef.current.instanceMatrix.needsUpdate = true
  })

  const hoveredSensor = useMemo(
    () => sensors.find((s) => s.id === hoveredId),
    [sensors, hoveredId]
  )

  return (
    <>
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, Math.max(sensors.length, 1)]}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <octahedronGeometry args={[1, 0]} />
        <meshStandardMaterial
          emissive="#ffffff"
          emissiveIntensity={0.6}
          toneMapped={false}
          metalness={0.3}
          roughness={0.4}
        />
      </instancedMesh>
      {hoveredSensor && (
        <Html
          position={[hoveredSensor.location[0], hoveredSensor.location[1] + 8, hoveredSensor.location[2]]}
          center
          distanceFactor={15}
          style={{ pointerEvents: 'none' }}
        >
          <div
            style={{
              background: 'rgba(10, 14, 26, 0.95)',
              border: `1px solid ${statusColors[hoveredSensor.status]}66`,
              borderRadius: 6,
              padding: '8px 12px',
              minWidth: 140,
              backdropFilter: 'blur(8px)',
              fontFamily: 'JetBrains Mono, monospace',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: statusColors[hoveredSensor.status],
                  boxShadow: `0 0 6px ${statusColors[hoveredSensor.status]}`,
                }}
              />
              <span style={{ color: '#fff', fontSize: 11, fontWeight: 600 }}>
                {typeLabels[hoveredSensor.type]}
              </span>
            </div>
            <div style={{ color: '#00f0ff', fontSize: 16, fontWeight: 700 }}>
              {hoveredSensor.value}
            </div>
            <div style={{ color: '#64748b', fontSize: 9, marginTop: 2 }}>
              {hoveredSensor.id}
            </div>
          </div>
        </Html>
      )}
    </>
  )
}
