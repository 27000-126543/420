import { useRef, useMemo, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useCityStore } from '@/store/useCityStore'
import type { BuildingData } from '@/types'

const dummy = new THREE.Object3D()
const tempColor = new THREE.Color()

function BuildingInstances() {
  const buildings = useCityStore((s) => s.buildings)
  const selectedBuilding = useCityStore((s) => s.selectedBuilding)
  const setSelectedBuilding = useCityStore((s) => s.setSelectedBuilding)

  const normalMeshRef = useRef<THREE.InstancedMesh>(null)
  const anomalyMeshRef = useRef<THREE.InstancedMesh>(null)

  const { normal, anomaly } = useMemo(() => {
    const normalArr: BuildingData[] = []
    const anomalyArr: BuildingData[] = []
    buildings.forEach((b) => {
      if (b.hasAnomaly) anomalyArr.push(b)
      else normalArr.push(b)
    })
    return { normal: normalArr, anomaly: anomalyArr }
  }, [buildings])

  useMemo(() => {
    if (normalMeshRef.current) {
      normalMeshRef.current.count = Math.max(normal.length, 1)
      normal.forEach((b, i) => {
        dummy.position.set(b.position[0], b.position[1] + b.size[1] / 2, b.position[2])
        dummy.scale.set(b.size[0], b.size[1], b.size[2])
        dummy.rotation.set(0, 0, 0)
        dummy.updateMatrix()
        normalMeshRef.current!.setMatrixAt(i, dummy.matrix)
        tempColor.set(b.color)
        normalMeshRef.current!.setColorAt(i, tempColor)
      })
      normalMeshRef.current.instanceMatrix.needsUpdate = true
      if (normalMeshRef.current.instanceColor) normalMeshRef.current.instanceColor.needsUpdate = true
    }
    if (anomalyMeshRef.current) {
      anomalyMeshRef.current.count = Math.max(anomaly.length, 1)
      anomaly.forEach((b, i) => {
        dummy.position.set(b.position[0], b.position[1] + b.size[1] / 2, b.position[2])
        dummy.scale.set(b.size[0], b.size[1], b.size[2])
        dummy.rotation.set(0, 0, 0)
        dummy.updateMatrix()
        anomalyMeshRef.current!.setMatrixAt(i, dummy.matrix)
        tempColor.set('#ff5533')
        anomalyMeshRef.current!.setColorAt(i, tempColor)
      })
      anomalyMeshRef.current.instanceMatrix.needsUpdate = true
      if (anomalyMeshRef.current.instanceColor) anomalyMeshRef.current.instanceColor.needsUpdate = true
    }
  }, [normal, anomaly])

  const handleNormalClick = useCallback((e: any) => {
    e.stopPropagation()
    const idx = e.instanceId
    if (idx !== undefined && idx < normal.length) {
      setSelectedBuilding(normal[idx].id)
    }
  }, [normal, setSelectedBuilding])

  const handleAnomalyClick = useCallback((e: any) => {
    e.stopPropagation()
    const idx = e.instanceId
    if (idx !== undefined && idx < anomaly.length) {
      setSelectedBuilding(anomaly[idx].id)
    }
  }, [anomaly, setSelectedBuilding])

  useFrame((state) => {
    if (anomalyMeshRef.current) {
      const t = state.clock.elapsedTime
      const pulse = 0.35 + Math.sin(t * 3) * 0.3
      const mat = anomalyMeshRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = pulse
    }
  })

  return (
    <>
      <instancedMesh
        ref={normalMeshRef}
        args={[undefined, undefined, Math.max(normal.length, 1)]}
        castShadow
        receiveShadow
        onClick={handleNormalClick}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={0.7} metalness={0.3} emissive="#001122" emissiveIntensity={0.15} />
      </instancedMesh>
      <instancedMesh
        ref={anomalyMeshRef}
        args={[undefined, undefined, Math.max(anomaly.length, 1)]}
        castShadow
        receiveShadow
        onClick={handleAnomalyClick}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={0.5} metalness={0.4} emissive="#ff4422" emissiveIntensity={0.5} toneMapped={false} />
      </instancedMesh>
    </>
  )
}

function SelectionRing() {
  const selectedBuilding = useCityStore((s) => s.selectedBuilding)
  const buildings = useCityStore((s) => s.buildings)
  const ref = useRef<THREE.Mesh>(null)

  const selected = useMemo(
    () => buildings.find((b) => b.id === selectedBuilding),
    [buildings, selectedBuilding]
  )

  useFrame((state) => {
    if (!ref.current || !selected) return
    const t = state.clock.elapsedTime
    const scale = 1 + Math.sin(t * 4) * 0.06
    ref.current.scale.set(scale, 1, scale)
  })

  if (!selected) return null

  const ringOuter = Math.max(selected.size[0], selected.size[2]) * 0.85
  const ringInner = Math.max(selected.size[0], selected.size[2]) * 0.72

  return (
    <mesh ref={ref} position={[selected.position[0], 0.2, selected.position[2]]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[ringInner, ringOuter, 64]} />
      <meshBasicMaterial color="#00f0ff" transparent opacity={0.75} side={THREE.DoubleSide} toneMapped={false} />
    </mesh>
  )
}

export default function Buildings() {
  return (
    <>
      <BuildingInstances />
      <SelectionRing />
    </>
  )
}
