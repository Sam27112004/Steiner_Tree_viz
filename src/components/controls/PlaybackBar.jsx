import { useEffect } from 'react'
import { useAlgorithmStore } from '../../store/algorithmStore.js'
import { usePlaybackStore } from '../../store/playbackStore.js'

const SPEED_OPTIONS = [0.5, 1, 2, 4]

function PlaybackBar() {
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
    <div className="flex flex-col gap-4 rounded-3xl border border-border bg-surface px-5 py-4 text-[var(--color-node-text)] shadow-[0_12px_44px_rgba(0,0,0,0.22)]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-xl border border-border px-3 py-2 font-mono text-sm hover:border-[var(--color-consider)]"
              onClick={() => jumpBy(-1)}
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
              onClick={() => jumpBy(1)}
            >
              ▶
            </button>
          </div>
          <div className="flex items-center gap-2">
            {SPEED_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setSpeed(option)}
                className={`rounded-lg border px-2 py-1 font-mono text-xs transition-colors ${
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