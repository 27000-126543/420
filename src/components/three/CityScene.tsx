import { useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import { useCityStore } from '@/store/useCityStore'
import Buildings from './Buildings'
import Roads from './Roads'
import TrafficLights3D from './TrafficLights3D'
import SensorMarkers from './SensorMarkers'
import EnvironmentHeatmap from './EnvironmentHeatmap'
import EnergyMarkers from './EnergyMarkers'
import EventMarkers3D from './EventMarkers3D'
import AnnotationMarkers from './AnnotationMarkers'

function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
      <planeGeometry args={[5000, 5000]} />
      <meshStandardMaterial color="#0d1117" roughness={0.9} metalness={0.1} />
    </mesh>
  )
}

function SceneContent() {
  const visibleLayers = useCityStore((s) => s.visibleLayers)
  const previewRole = useCityStore((s) => s.previewRole)
  const currentUserRole = useCityStore((s) => s.currentUser.role)
  const roleLayerPerms = useCityStore((s) => s.roleLayerPerms)
  const getEffectivePermittedLayers = useCityStore((s) => s.getEffectivePermittedLayers)
  const permittedLayers = useMemo(() => getEffectivePermittedLayers(), [
    getEffectivePermittedLayers,
    previewRole,
    currentUserRole,
    roleLayerPerms,
  ])

  const isLayerOn = (k: typeof permittedLayers[number]) =>
    visibleLayers.includes(k) && permittedLayers.includes(k)

  return (
    <>
      <fog attach="fog" args={['#0a0e1a', 500, 3000]} />
      <ambientLight color="#334466" intensity={0.5} />
      <directionalLight color="#6688aa" intensity={0.8} position={[200, 400, 200]} castShadow />
      <Stars radius={2000} depth={100} count={4000} factor={4} saturation={0.5} fade speed={1} />
      <Ground />
      <Buildings />
      {isLayerOn('traffic') && (
        <>
          <Roads />
          <TrafficLights3D />
        </>
      )}
      {isLayerOn('sensors') && <SensorMarkers />}
      {isLayerOn('environment') && <EnvironmentHeatmap />}
      {isLayerOn('energy') && <EnergyMarkers />}
      {isLayerOn('events') && <EventMarkers3D />}
      {isLayerOn('annotations') && <AnnotationMarkers />}
      <OrbitControls
        minDistance={50}
        maxDistance={5000}
        maxPolarAngle={Math.PI / 2.2}
        enableDamping
        dampingFactor={0.05}
      />
      <EffectComposer>
        <Bloom intensity={0.8} luminanceThreshold={0.6} luminanceSmoothing={0.9} />
        <Vignette eskil={false} offset={0.1} darkness={0.8} />
      </EffectComposer>
    </>
  )
}

export default function CityScene() {
  return (
    <Canvas
      camera={{ position: [0, 300, 500], fov: 60, near: 1, far: 10000 }}
      shadows
      gl={{ antialias: true, alpha: false }}
      style={{ background: '#0a0e1a' }}
    >
      <SceneContent />
    </Canvas>
  )
}
