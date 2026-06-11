import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useCityStore } from '@/store/useCityStore'
import type { EnvironmentRegion, EnvMetricKey } from '@/types'

const dummy = new THREE.Object3D()
const tempColor = new THREE.Color()
const cGreen = new THREE.Color('#00ff88')
const cYellow = new THREE.Color('#ffcc00')
const cRed = new THREE.Color('#ff3355')

const metricThresholds: Record<EnvMetricKey, number[]> = {
  pm25: [35, 75, 115, 150, 300],
  aqi: [50, 100, 150, 200, 500],
  noise: [55, 65, 75, 85, 100],
  waterQuality: [2, 3, 4, 5, 6],
}

function getIntensityColor(intensity: number, out: THREE.Color) {
  if (intensity < 0.33) {
    const t = intensity / 0.33
    out.copy(cGreen).lerp(cYellow, t)
  } else if (intensity < 0.66) {
    const t = (intensity - 0.33) / 0.33
    out.copy(cYellow).lerp(cRed, t)
  } else {
    out.copy(cRed)
  }
}

function metricToIntensity(metric: EnvMetricKey, value: number): number {
  const ths = metricThresholds[metric]
  if (value <= ths[0]) return value / ths[0] * 0.2
  if (value <= ths[1]) return 0.2 + ((value - ths[0]) / (ths[1] - ths[0])) * 0.25
  if (value <= ths[2]) return 0.45 + ((value - ths[1]) / (ths[2] - ths[1])) * 0.2
  if (value <= ths[3]) return 0.65 + ((value - ths[2]) / (ths[3] - ths[2])) * 0.2
  return Math.min(1, 0.85 + ((value - ths[3]) / (ths[4] - ths[3])) * 0.15)
}

function regionAlertFromMetric(metric: EnvMetricKey, value: number): 'normal' | 'warning' | 'critical' {
  const ths = metricThresholds[metric]
  if (value >= ths[3]) return 'critical'
  if (value >= ths[1]) return 'warning'
  return 'normal'
}

export default function EnvironmentHeatmap() {
  const regions = useCityStore((s) => s.environmentRegions)
  const activeMetric = useCityStore((s) => s.activeEnvMetric)
  const meshRef = useRef<THREE.InstancedMesh>(null)

  const { pointsFlat, criticalRefs } = useMemo(() => {
    const flat: (EnvironmentRegion['heatmapPoints'][0] & { isCritical: boolean; isWarning: boolean })[] = []
    const critIdx: number[] = []
    let globalIdx = 0
    regions.forEach((r) => {
      const regionVal = r.metrics[activeMetric]
      const regionAlert = regionAlertFromMetric(activeMetric, regionVal)
      r.heatmapPoints.forEach((p, localIdx) => {
        const baseIntensity = p.intensity
        const metricBoost = metricToIntensity(activeMetric, regionVal)
        const combinedIntensity = Math.min(1, baseIntensity * 0.35 + metricBoost * 0.65)
        flat.push({
          position: p.position,
          intensity: combinedIntensity,
          isCritical: regionAlert === 'critical',
          isWarning: regionAlert === 'warning',
        })
        if (regionAlert === 'critical') {
          critIdx.push(globalIdx + localIdx)
        }
      })
      globalIdx += r.heatmapPoints.length
    })
    return { pointsFlat: flat, criticalRefs: critIdx }
  }, [regions, activeMetric])

  const totalPoints = pointsFlat.length

  useMemo(() => {
    if (!meshRef.current) return
    meshRef.current.count = Math.max(totalPoints, 1)
    pointsFlat.forEach((p, i) => {
      const baseSize = 25 + p.intensity * 35
      dummy.position.set(p.position[0], p.position[1] + 0.2, p.position[2])
      dummy.scale.set(baseSize, 1, baseSize)
      dummy.rotation.set(-Math.PI / 2, 0, 0)
      dummy.updateMatrix()
      meshRef.current!.setMatrixAt(i, dummy.matrix)
      getIntensityColor(p.intensity, tempColor)
      meshRef.current!.setColorAt(i, tempColor)
    })
    meshRef.current.instanceMatrix.needsUpdate = true
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true
  }, [pointsFlat, totalPoints])

  useFrame((state) => {
    if (!meshRef.current || criticalRefs.length === 0) return
    const t = state.clock.elapsedTime
    for (const i of criticalRefs) {
      const p = pointsFlat[i]
      if (!p) continue
      const baseSize = 25 + p.intensity * 35
      const pulse = 1 + Math.sin(t * 2 + i) * 0.15
      dummy.position.set(p.position[0], p.position[1] + 0.2, p.position[2])
      dummy.scale.set(baseSize * pulse, 1, baseSize * pulse)
      dummy.rotation.set(-Math.PI / 2, 0, 0)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    }
    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, Math.max(totalPoints, 1)]}
    >
      <circleGeometry args={[1, 24]} />
      <meshBasicMaterial
        transparent
        opacity={0.35}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        depthTest={false}
        toneMapped={false}
      />
    </instancedMesh>
  )
}
