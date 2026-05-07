import ComparePanel from './ComparePanel.jsx'
import DPStatePanel from './DPStatePanel.jsx'
import ResultPanel from './ResultPanel.jsx'
import StepLog from './StepLog.jsx'
import { useUiStore } from '../../store/uiStore.js'

const PANELS = [
  { id: 'trace', label: 'Trace' },
  { id: 'dp', label: 'DP Details' },
  { id: 'result', label: 'Result' },
  { id: 'compare', label: 'Compare' },
]

function TechnicalTabs({ renderState, steps, cursor }) {
  const technicalPanel = useUiStore((state) => state.technicalPanel)
  const setTechnicalPanel = useUiStore((state) => state.setTechnicalPanel)

  return (
    <section className="flex h-full min-h-0 flex-col rounded-xl border border-border bg-surface p-2 shadow-[0_12px_44px_rgba(0,0,0,0.22)]">
      <div className="mb-2 shrink-0">
        <div className="grid grid-cols-4 gap-1 rounded-xl border border-border bg-[rgba(255,255,255,0.02)] p-1">
          {PANELS.map((panel) => (
            <button
              key={panel.id}
              type="button"
              onClick={() => setTechnicalPanel(panel.id)}
              className={`rounded-lg px-1.5 py-1.5 font-mono text-[11px] transition-colors ${
                technicalPanel === panel.id
                  ? 'bg-[var(--color-consider)] text-black'
                  : 'text-[var(--color-visited)] hover:text-[var(--color-node-text)]'
              }`}
            >
              {panel.label}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        {technicalPanel === 'trace' ? <StepLog steps={steps} cursor={cursor} /> : null}
        {technicalPanel === 'dp' ? (
          <div className="h-full overflow-y-auto pr-1">
            <DPStatePanel renderState={renderState} />
          </div>
        ) : null}
        {technicalPanel === 'result' ? (
          <div className="h-full overflow-y-auto pr-1">
            <ResultPanel />
          </div>
        ) : null}
        {technicalPanel === 'compare' ? (
          <div className="h-full overflow-y-auto pr-1">
            <ComparePanel />
          </div>
        ) : null}
      </div>
    </section>
  )
}

export default TechnicalTabs
