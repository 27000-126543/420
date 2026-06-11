import { useMemo } from 'react'
import { Line } from '@react-three/drei'
import * as THREE from 'three'
import { useCityStore } from '@/store/useCityStore'
import type { TrafficSegment } from '@/types'

const tempColorA = new THREE.Color()
const tempColorB = new THREE.Color()

function getFlowColor(idx: number, out: THREE.Color) {
  const c1 = new THREE.Color('#00ff88')
  const c2 = new THREE.Color('#ffdd00')
  const c3 = new THREE.Color('#ff3355')
  if (idx < 0.5) {
    const t = idx / 0.5
    out.copy(c1).lerp(c2, t)
  } else {
    const t = (idx - 0.5) / 0.5
    out.copy(c2).lerp(c3, t)
  }
}

export default function Roads() {
  const trafficFlows = useCityStore((s) => s.trafficFlows)

  const allSegments = useMemo(() => {
    const segs: (TrafficSegment & { roadId: string })[] = []
    trafficFlows.forEach((f) => {
      f.segments.forEach((s) => segs.push({ ...s, roadId: f.roadId }))
    })
    return segs
  }, [trafficFlows])

  const offsetSegments = useMemo(() => {
    return allSegments.flatMap((seg) => {
      const dx = seg.end[0] - seg.start[0]
      const dz = seg.end[2] - seg.start[2]
      const len = Math.sqrt(dx * dx + dz * dz) || 1
      const nx = -dz / len
      const nz = dx / len
      getFlowColor(seg.flowIndex, tempColorA)
      const color = `#${tempColorA.getHexString()}`

      const base = {
        offset: [0, 0],
        width: 3,
        opacity: 0.9,
        color,
        glow: seg.flowIndex > 0.7,
      }

      const lines: { start: [number, number, number]; end: [number, number, number]; width: number; opacity: number; color: string; glow: boolean }[] = []

      ;[-2, 0, 2].forEach((o) => {
        lines.push({
          start: [seg.start[0] + nx * o, seg.start[1], seg.start[2] + nz * o] as [number, number, number],
          end: [seg.end[0] + nx * o, seg.end[1], seg.end[2] + nz * o] as [number, number, number],
          width: o === 0 ? 2.5 : 1,
          opacity: o === 0 ? 0.95 : 0.4,
          color,
          glow: seg.flowIndex > 0.7,
        })
      })
      return lines
    })
  }, [allSegments])

  return (
    <group>
      <group>
        {allSegments.map((seg, idx) => {
          getFlowColor(seg.flowIndex, tempColorA)
          tempColorB.copy(tempColorA).multiplyScalar(0.4)
          const color = `#${tempColorA.getHexString()}`
          return (
            <Line
              key={`s-${seg.roadId}-${idx}`}
              points={[seg.start, seg.end]}
              color={color}
              lineWidth={2.5}
              transparent
              opacity={0.95}
            />
          )
        })}
      </group>
      <group>
        {allSegments.map((seg, idx) => {
          if (seg.flowIndex <= 0.7) return null
          const dx = seg.end[0] - seg.start[0]
          const dz = seg.end[2] - seg.start[2]
          const len = Math.sqrt(dx * dx + dz * dz) || 1
          const nx = -dz / len * 1.5
          const nz = dx / len * 1.5
          const points1 = [
            [seg.start[0] + nx, seg.start[1] + 0.1, seg.start[2] + nz] as [number, number, number],
            [seg.end[0] + nx, seg.end[1] + 0.1, seg.end[2] + nz] as [number, number, number],
          ]
          const points2 = [
            [seg.start[0] - nx, seg.start[1] + 0.1, seg.start[2] - nz] as [number, number, number],
            [seg.end[0] - nx, seg.end[1] + 0.1, seg.end[2] - nz] as [number, number, number],
          ]
          return (
            <group key={`g-${seg.roadId}-${idx}`}>
              <Line points={points1} color="#ff6644" lineWidth={1.5} transparent opacity={0.4} />
              <Line points={points2} color="#ff6644" lineWidth={1.5} transparent opacity={0.4} />
            </group>
          )
        })}
      </group>
    </group>
  )
}
