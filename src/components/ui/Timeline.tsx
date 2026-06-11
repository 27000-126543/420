import { useEffect, useCallback } from 'react'
import { Play, Pause } from 'lucide-react'
import { useCityStore } from '@/store/useCityStore'

const RANGE = 3600000

export default function Timeline() {
  const isPlaying = useCityStore((s) => s.isPlaying)
  const setIsPlaying = useCityStore((s) => s.setIsPlaying)
  const timelinePosition = useCityStore((s) => s.timelinePosition)
  const setTimelinePosition = useCityStore((s) => s.setTimelinePosition)

  const now = Date.now()
  const min = now - RANGE
  const max = now
  const progress = ((timelinePosition - min) / RANGE) * 100

  const formatTime = (ts: number) => {
    const d = new Date(ts)
    return d.toTimeString().slice(0, 8)
  }

  const handleSliderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setTimelinePosition(Number(e.target.value))
    },
    [setTimelinePosition]
  )

  useEffect(() => {
    if (!isPlaying) return
    const interval = setInterval(() => {
      setTimelinePosition(Date.now())
    }, 1000)
    return () => clearInterval(interval)
  }, [isPlaying, setTimelinePosition])

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center border-t border-cyber-border bg-cyber-bg/90 px-6 backdrop-blur-md">
      <button
        onClick={() => setIsPlaying(!isPlaying)}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-cyber-blue/40 bg-cyber-card/80 text-cyber-blue transition-colors hover:bg-cyber-blue/20"
      >
        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
      </button>

      <div className="mx-6 flex flex-1 flex-col gap-1">
        <input
          type="range"
          min={min}
          max={max}
          value={timelinePosition}
          onChange={handleSliderChange}
          className="w-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-runnable-track]:h-1 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-cyber-border [&::-webkit-slider-thumb]:mt-[-4px] [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyber-blue [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(0,240,255,0.6)]"
          style={{
            background: `linear-gradient(to right, #00f0ff ${progress}%, #1e293b ${progress}%)`,
          }}
        />
        <div className="flex justify-between text-[10px] text-cyber-muted">
          <span>T-60min</span>
          <span>T-30min</span>
          <span className="text-cyber-blue">实时</span>
        </div>
      </div>

      <div className="font-mono text-sm tracking-wider text-cyber-blue">
        {formatTime(timelinePosition)}
      </div>
    </div>
  )
}
