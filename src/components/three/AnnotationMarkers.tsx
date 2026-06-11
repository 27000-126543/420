import { useCityStore } from '@/store/useCityStore'
import { Html } from '@react-three/drei'

export default function AnnotationMarkers() {
  const annotations = useCityStore((s) => s.annotations)

  return (
    <>
      {annotations.map((a) => (
        <group key={a.id} position={[a.position[0], a.position[1], a.position[2]]}>
          <mesh position={[0, -8, 0]}>
            <cylinderGeometry args={[0.15, 0.2, 16, 6]} />
            <meshStandardMaterial color="#2a4a7f" metalness={0.6} roughness={0.3} />
          </mesh>
          <mesh position={[0, 2, 0]}>
            <coneGeometry args={[1.2, 3.5, 4]} />
            <meshStandardMaterial
              color="#00ff88"
              emissive="#00ff88"
              emissiveIntensity={0.6}
              metalness={0.4}
              roughness={0.4}
              toneMapped={false}
            />
          </mesh>
          <Html
            position={[0, 10, 0]}
            center
            distanceFactor={40}
            style={{ pointerEvents: 'none' }}
          >
            <div
              style={{
                background: 'rgba(10, 14, 26, 0.92)',
                border: '1px solid rgba(0, 255, 136, 0.4)',
                borderRadius: 4,
                padding: '6px 10px',
                whiteSpace: 'nowrap',
                backdropFilter: 'blur(6px)',
                fontFamily: 'JetBrains Mono, monospace',
              }}
            >
              <div style={{ color: '#00ff88', fontSize: 10, marginBottom: 2 }}>
                @{a.userId}
              </div>
              <div style={{ color: '#fff', fontSize: 11, fontWeight: 500 }}>
                {a.content}
              </div>
            </div>
          </Html>
        </group>
      ))}
    </>
  )
}
