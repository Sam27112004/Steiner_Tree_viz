import { useEffect } from 'react'
import { useAlgorithmStore } from '../../store/algorithmStore.js'
import { usePlaybackStore } from '../../store/playbackStore.js'

function PlaybackBar() {
  const cursor = usePlaybackStore((state) => state.cursor)
  const isPlaying = usePlaybackStore((state) => state.isPlaying)
  const speed = usePlaybackStore((state) => state.speed)
  const setCursor = usePlaybackStore((state) => state.setCursor)
  const nextStep = usePlaybackStore((state) => state.nextStep)
  const previousStep = usePlaybackStore((state) => state.previousStep)
  const togglePlaying = usePlaybackStore((state) => state.togglePlaying)
  const stopPlaying = usePlaybackStore((state) => state.stopPlaying)
  const steps = useAlgorithmStore((state) => state.steps)

  useEffect(() => {
    if (!isPlaying || steps.length === 0) {
      return undefined
    }

    const interval = window.setInterval(() => {
      setCursor((currentCursor) => {
        if (currentCursor >= steps.length - 1) {
          stopPlaying()
          return currentCursor
        }
        return currentCursor + 1
      })
    }, Math.max(140, 500 / speed))

    return () => window.clearInterval(interval)
  }, [isPlaying, speed, setCursor, steps.length, stopPlaying])

  return (
    <div className="flex items-center justify-between gap-4 rounded-3xl border border-border bg-surface px-5 py-4 text-[var(--color-node-text)]">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="rounded-xl border border-border px-3 py-2 font-mono text-sm hover:border-[var(--color-consider)]"
          onClick={previousStep}
        >
          ◀
        </button>
        <button
          type="button"
          className="rounded-xl border border-border px-4 py-2 font-mono text-sm hover:border-[var(--color-consider)]"
          onClick={togglePlaying}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
        <button
          type="button"
          className="rounded-xl border border-border px-3 py-2 font-mono text-sm hover:border-[var(--color-consider)]"
          onClick={nextStep}
        >
          ▶
        </button>
      </div>
      <div className="font-mono text-sm text-[var(--color-node-text)]">
        Step {Math.min(cursor + 1, steps.length || 1)}/{steps.length || 1}
      </div>
    </div>
  )
}

export default PlaybackBar