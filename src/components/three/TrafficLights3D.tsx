import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useCityStore } from '@/store/useCityStore'

const phaseColors = {
  red: '#ff3355',
  yellow: '#ffcc00',
  green: '#00ff88',
}

export default function TrafficLights3D() {
  const trafficLights = useCityStore((s) => s.trafficLights)
  const lightsRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const tempColor = useMemo(() => new THREE.Color(), [])

  useFrame(() => {
    if (!lightsRef.current) return
    lightsRef.current.count = Math.max(trafficLights.length, 1)
    trafficLights.forEach((tl, i) => {
      dummy.position.set(tl.location[0], tl.location[1] + 1.2, tl.location[2])
      dummy.scale.set(1.6, 1.6, 1.6)
      dummy.updateMatrix()
      lightsRef.current!.setMatrixAt(i, dummy.matrix)
      tempColor.set(phaseColors[tl.currentPhase])
      lightsRef.current!.setColorAt(i, tempColor)
    })
    lightsRef.current.instanceMatrix.needsUpdate = true
    if (lightsRef.current.instanceColor) lightsRef.current.instanceColor.needsUpdate = true
  })

  return (
    <>
      {trafficLights.map((tl) => (
        <mesh
          key={`pole-${tl.id}`}
          position={[tl.location[0], tl.location[1] / 2, tl.location[2]]}
        >
          <cylinderGeometry args={[0.08, 0.1, tl.location[1], 6]} />
          <meshStandardMaterial color="#333844" metalness={0.8} roughness={0.3} />
        </mesh>
      ))}
      <instancedMesh
        ref={lightsRef}
        args={[undefined, undefined, Math.max(trafficLights.length, 1)]}
      >
        <sphereGeometry args={[1, 12, 12]} />
        <meshStandardMaterial
          emissive="#ffffff"
          emissiveIntensity={2}
          toneMapped={false}
        />
      </instancedMesh>
      {trafficLights.map((tl) => {
        const c = phaseColors[tl.currentPhase]
        return (
          <pointLight
            key={`pl-${tl.id}`}
            position={[tl.location[0], tl.location[1] + 1.2, tl.location[2]]}
            color={c}
            intensity={1.2}
            distance={18}
            decay={2}
          />
        )
      })}
    </>
  )
}
