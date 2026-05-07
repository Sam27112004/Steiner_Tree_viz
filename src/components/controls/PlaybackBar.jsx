import { useEffect } from 'react'
import { useAlgorithmStore } from '../../store/algorithmStore.js'
import { usePlaybackStore } from '../../store/playbackStore.js'

const SPEED_OPTIONS = [0.5, 1, 2, 4]

function PlaybackBar({ compact = false }) {
  const cursor = usePlaybackStore((state) => state.cursor)
  const isPlaying = usePlaybackStore((state) => state.isPlaying)
  const speed = usePlaybackStore((state) => state.speed)
  const setCursor = usePlaybackStore((state) => state.setCursor)
  const setSpeed = usePlaybackStore((state) => state.setSpeed)
  const togglePlaying = usePlaybackStore((state) => state.togglePlaying)
  const stopPlaying = usePlaybackStore((state) => state.stopPlaying)
  const steps = useAlgorithmStore((state) => state.steps)
  const maxCursor = Math.max(0, steps.length - 1)

  const jumpBy = (offset) => {
    setCursor((currentCursor) => {
      const nextCursor = currentCursor + offset
      return Math.min(maxCursor, Math.max(0, nextCursor))
    })
  }

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
    <div className={`${compact ? 'gap-2 rounded-xl px-3 py-3' : 'gap-4 rounded-3xl px-5 py-4'} flex flex-col border border-border bg-surface text-[var(--color-node-text)] shadow-[0_12px_44px_rgba(0,0,0,0.22)]`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-lg border border-border px-2.5 py-1.5 font-mono text-xs hover:border-[var(--color-consider)]"
              onClick={() => jumpBy(-1)}
              aria-label="Previous step"
            >
              Prev
            </button>
            <button
              type="button"
              className="rounded-lg border border-border px-3 py-1.5 font-mono text-xs hover:border-[var(--color-consider)]"
              onClick={togglePlaying}
              aria-label={isPlaying ? 'Pause playback' : 'Play playback'}
            >
              {isPlaying ? 'Pause' : 'Play'}
            </button>
            <button
              type="button"
              className="rounded-lg border border-border px-2.5 py-1.5 font-mono text-xs hover:border-[var(--color-consider)]"
              onClick={() => jumpBy(1)}
              aria-label="Next step"
            >
              Next
            </button>
          </div>
          <div className="flex items-center gap-1.5">
            {SPEED_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setSpeed(option)}
                className={`rounded-md border px-1.5 py-1 font-mono text-[11px] transition-colors ${
                  speed === option
                    ? 'border-[var(--color-consider)] bg-[rgba(227,179,65,0.2)] text-white'
                    : 'border-border text-[var(--color-visited)] hover:border-[var(--color-consider)] hover:text-[var(--color-node-text)]'
                }`}
              >
                {option}x
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="flex min-w-0 items-center gap-3">
        <input
          type="range"
          min={0}
          max={maxCursor}
          value={Math.min(cursor, maxCursor)}
          disabled={steps.length <= 1}
          onChange={(event) => setCursor(Number(event.target.value))}
          className="h-2 w-full cursor-pointer appearance-none rounded-full bg-[var(--color-bg)] accent-[var(--color-consider)] disabled:cursor-not-allowed"
        />
        <div className="whitespace-nowrap font-mono text-sm text-[var(--color-node-text)]">
          Step {Math.min(cursor + 1, steps.length || 1)}/{steps.length || 1}
        </div>
      </div>
    </div>
  )
}

export default PlaybackBar
