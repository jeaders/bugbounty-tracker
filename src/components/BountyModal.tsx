import { useEffect, useState, useMemo, useCallback } from 'react'
import { BugBounty } from '../types'

interface Props {
  bounty: BugBounty
  onClose: () => void
}

type Tab = 'overview' | 'mission' | 'techniques' | 'rewards' | 'tools'

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: 'border-green-500/50 text-green-400',
  intermediate: 'border-yellow-500/50 text-yellow-400',
  advanced: 'border-orange-500/50 text-orange-400',
  expert: 'border-red-500/50 text-red-400'
}

const SEVERITY_REWARD_COLORS: Record<string, string> = {
  critical: 'text-red-400',
  high: 'text-orange-400',
  medium: 'text-yellow-400',
  low: 'text-green-400',
  informational: 'text-blue-400'
}

export const BountyModal = ({ bounty, onClose }: Props) => {
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [expandedTechnique, setExpandedTechnique] = useState<number | null>(null)

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    // Blocca lo scroll del body quando il modal è aperto
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleEscape)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  const hasMission = useMemo(() => !!bounty.mission, [bounty.mission])

  const toggleTechnique = useCallback((idx: number) => {
    setExpandedTechnique(prev => prev === idx ? null : idx)
  }, [])

  return (
    <div
      className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="cyber-card max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-4 pb-4 border-b border-cyan-500/30">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl sm:text-2xl font-cyber text-neon-pink neon-glow mb-1 pr-4">
              {bounty.titolo}
            </h2>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-cyan-500 font-mono">{bounty.programma}</span>
              <span className="text-cyan-700">|</span>
              <span className="font-cyber text-neon-green text-lg">${bounty.payout.toLocaleString()}</span>
              <span className="text-cyan-700">|</span>
              <span className={`cyber-badge text-xs ${DIFFICULTY_COLORS[bounty.mission?.difficulty || 'intermediate']}`}>
                {bounty.mission?.difficulty?.toUpperCase() || 'INTERMEDIATE'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-cyan-400 hover:text-neon-pink text-3xl leading-none ml-2"
            aria-label="Chiudi"
          >
            ×
          </button>
        </div>

        {/* Tabs - solo se c'è una missione */}
        {hasMission && (
          <div className="flex gap-1 mb-4 overflow-x-auto pb-1 border-b border-cyan-500/20">
            {(['overview', 'mission', 'techniques', 'rewards', 'tools'] as Tab[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-2 text-xs sm:text-sm font-cyber whitespace-nowrap transition-all rounded-t-lg ${
                  activeTab === tab
                    ? 'bg-cyan-500/20 text-neon-pink border-b-2 border-neon-pink'
                    : 'text-cyan-500 hover:text-cyan-300 hover:bg-cyan-500/10'
                }`}
              >
                {tab === 'overview' && 'OVERVIEW'}
                {tab === 'mission' && 'MISSIONE'}
                {tab === 'techniques' && 'TECNICHE'}
                {tab === 'rewards' && 'REWARDS'}
                {tab === 'tools' && 'TOOLS'}
              </button>
            ))}
          </div>
        )}

        {/* Content - scrollabile */}
        <div className="overflow-y-auto pr-2 flex-1">
          {activeTab === 'overview' && <OverviewTab bounty={bounty} />}
          {hasMission && activeTab === 'mission' && <MissionTab bounty={bounty} />}
          {hasMission && activeTab === 'techniques' && (
            <TechniquesTab
              techniques={bounty.mission!.testingTechniques}
              expanded={expandedTechnique}
              onToggle={toggleTechnique}
            />
          )}
          {hasMission && activeTab === 'rewards' && <RewardsTab bounty={bounty} />}
          {hasMission && activeTab === 'tools' && <ToolsTab bounty={bounty} />}
        </div>
      </div>
    </div>
  )
}

// =================== TAB: OVERVIEW ===================
const OverviewTab = ({ bounty }: { bounty: BugBounty }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <Stat label="PAYOUT MAX" value={`$${bounty.payout.toLocaleString()}`} color="text-neon-green" />
      <Stat label="SEVERITÀ" value={bounty.severita.toUpperCase()} color="text-neon-pink" />
      <Stat label="ASSET" value={bounty.assetType.toUpperCase()} color="text-neon-blue" />
      {bounty.mission && (
        <Stat label="TIPO" value={bounty.mission.difficulty.toUpperCase()} color="text-yellow-400" />
      )}
    </div>

    <div>
      <h3 className="text-base font-cyber text-neon-pink mb-2">📋 DESCRIZIONE</h3>
      <p className="text-cyan-300 text-sm leading-relaxed whitespace-pre-wrap">{bounty.descrizione}</p>
    </div>

    {bounty.mission && (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="text-base font-cyber text-neon-pink mb-2">✅ IN SCOPE</h3>
          <ul className="text-sm text-cyan-300 space-y-1">
            {bounty.mission.scope.slice(0, 6).map((s, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5">●</span>
                <span>{s}</span>
              </li>
            ))}
            {bounty.mission.scope.length > 6 && (
              <li className="text-cyan-600 text-xs">+ {bounty.mission.scope.length - 6} altri in scope</li>
            )}
          </ul>
        </div>
        <div>
          <h3 className="text-base font-cyber text-neon-pink mb-2">⛔ OUT OF SCOPE</h3>
          <ul className="text-sm text-cyan-300 space-y-1">
            {bounty.mission.outOfScope.slice(0, 6).map((s, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-red-400 mt-0.5">●</span>
                <span>{s}</span>
              </li>
            ))}
            {bounty.mission.outOfScope.length > 6 && (
              <li className="text-cyan-600 text-xs">+ {bounty.mission.outOfScope.length - 6} altri out of scope</li>
            )}
          </ul>
        </div>
      </div>
    )}

    <div>
      <h3 className="text-base font-cyber text-neon-pink mb-2">🏷️ TAGS</h3>
      <div className="flex flex-wrap gap-2">
        {bounty.tags.map(tag => (
          <span key={tag} className="cyber-badge border-cyan-500/30 text-cyan-400">#{tag}</span>
        ))}
      </div>
    </div>

    <div className="pt-2">
      <a
        href={bounty.url}
        target="_blank"
        rel="noopener noreferrer"
        className="cyber-button inline-block w-full sm:w-auto text-center"
      >
        🚀 VISITA PROGRAMMA
      </a>
    </div>
  </div>
)

// =================== TAB: MISSIONE ===================
const MissionTab = ({ bounty }: { bounty: BugBounty }) => {
  const mission = bounty.mission!
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-cyber text-neon-pink mb-2">🎯 QUICK START GUIDE</h3>
        <div className="bg-black/40 border border-cyan-500/20 rounded-lg p-3 space-y-2">
          {mission.quickStartGuide.map((step, i) => (
            <div key={i} className="text-sm text-cyan-300 leading-relaxed">{step}</div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-base font-cyber text-neon-pink mb-2">🛡️ OWASP CATEGORIES</h3>
        <div className="flex flex-wrap gap-2">
          {mission.owaspCategories.map((cat, i) => (
            <span key={i} className="cyber-badge border-purple-500/30 text-purple-300 text-xs">{cat}</span>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-base font-cyber text-neon-pink mb-2">📊 DIFFICOLTÀ & TEMPO</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-black/40 border border-cyan-500/20 rounded-lg p-3">
            <div className="text-xs text-cyan-600 mb-1">LIVELLO</div>
            <div className={`font-cyber ${DIFFICULTY_COLORS[mission.difficulty]?.split(' ')[1] || 'text-yellow-400'}`}>
              {mission.difficulty.toUpperCase()}
            </div>
          </div>
          <div className="bg-black/40 border border-cyan-500/20 rounded-lg p-3">
            <div className="text-xs text-cyan-600 mb-1">TEMPO STIMATO AL PRIMO REPORT</div>
            <div className="font-cyber text-neon-blue text-sm">{mission.estimatedTimeToFirstReport}</div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-base font-cyber text-neon-pink mb-2">📝 REPORTING STEPS</h3>
        <div className="bg-black/40 border border-cyan-500/20 rounded-lg p-3 space-y-1">
          {mission.reportingSteps.map((step, i) => (
            <div key={i} className="text-sm text-cyan-300 leading-relaxed">{step}</div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-base font-cyber text-neon-pink mb-2">💡 PRO TIPS</h3>
        <div className="bg-black/40 border border-yellow-500/30 rounded-lg p-3 space-y-2">
          {mission.tips.map((tip, i) => (
            <div key={i} className="text-sm text-cyan-300 leading-relaxed">{tip}</div>
          ))}
        </div>
      </div>
    </div>
  )
}

// =================== TAB: TECNICHE ===================
const TechniquesTab = ({
  techniques,
  expanded,
  onToggle
}: {
  techniques: NonNullable<BugBounty['mission']>['testingTechniques']
  expanded: number | null
  onToggle: (idx: number) => void
}) => (
  <div className="space-y-3">
    <h3 className="text-base font-cyber text-neon-pink mb-2">🧪 TECNICHE DI TESTING</h3>
    <p className="text-xs text-cyan-600 mb-3">Clicca su una tecnica per espandere i dettagli</p>
    {techniques.map((tech, i) => (
      <div key={i} className="bg-black/40 border border-cyan-500/20 rounded-lg overflow-hidden">
        <button
          onClick={() => onToggle(i)}
          className="w-full text-left p-3 hover:bg-cyan-500/5 transition-colors flex justify-between items-center"
        >
          <div>
            <div className="font-cyber text-neon-pink text-sm">{tech.name}</div>
            <div className="text-xs text-cyan-600 mt-0.5">{tech.description}</div>
          </div>
          <span className="text-cyan-400 text-lg ml-2">{expanded === i ? '−' : '+'}</span>
        </button>
        {expanded === i && (
          <div className="p-3 pt-0 border-t border-cyan-500/10 space-y-3">
            <div>
              <h4 className="text-xs font-cyber text-neon-blue mb-2">📋 STEP DA SEGUIRE:</h4>
              <ol className="space-y-1 text-sm text-cyan-300">
                {tech.steps.map((step, idx) => (
                  <li key={idx} className="flex gap-2">
                    <span className="text-cyan-600 font-mono">{idx + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
            {tech.examplePayload && (
              <div>
                <h4 className="text-xs font-cyber text-neon-blue mb-2">💣 ESEMPIO PAYLOAD:</h4>
                <pre className="bg-black/60 border border-red-500/30 rounded p-2 text-xs text-red-300 overflow-x-auto whitespace-pre-wrap break-all">
                  {tech.examplePayload}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    ))}
  </div>
)

// =================== TAB: REWARDS ===================
const RewardsTab = ({ bounty }: { bounty: BugBounty }) => {
  const mission = bounty.mission!
  return (
    <div className="space-y-4">
      <h3 className="text-base font-cyber text-neon-pink mb-2">💰 PAYOUT BY SEVERITY</h3>
      <div className="space-y-2">
        {mission.rewardsBySeverity.map((reward, i) => (
          <div key={i} className="bg-black/40 border border-cyan-500/20 rounded-lg p-3">
            <div className="flex justify-between items-center">
              <div>
                <div className={`font-cyber ${SEVERITY_REWARD_COLORS[reward.severity]}`}>
                  {reward.severity.toUpperCase()}
                </div>
                {reward.bonus && (
                  <div className="text-xs text-yellow-400 mt-1">🎁 {reward.bonus}</div>
                )}
              </div>
              <div className="text-right">
                <div className="font-cyber text-neon-green text-lg">
                  ${reward.min.toLocaleString()} – ${reward.max.toLocaleString()}
                </div>
                <div className="text-xs text-cyan-600">USD</div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-xs text-yellow-300">
        ⚠️ I payout sono indicativi e possono variare in base a impatto, qualità del report e decisione del triage. Leggi sempre il policy specifico del programma.
      </div>
    </div>
  )
}

// =================== TAB: TOOLS ===================
const ToolsTab = ({ bounty }: { bounty: BugBounty }) => {
  const mission = bounty.mission!
  return (
    <div className="space-y-4">
      <h3 className="text-base font-cyber text-neon-pink mb-2">🛠️ TOOLS CONSIGLIATI</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {mission.toolsRecommended.map((tool, i) => (
          <div key={i} className="bg-black/40 border border-cyan-500/20 rounded-lg p-3 flex items-center gap-2">
            <span className="text-cyan-400 text-lg">⚡</span>
            <span className="text-cyan-300 text-sm font-mono">{tool}</span>
          </div>
        ))}
      </div>
      <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-3 text-xs text-cyan-300">
        💡 <strong>Suggerimento:</strong> Non installare tutti i tools insieme. Inizia con Burp Suite (proxy), nuclei (scanner) e sqlmap (SQLi). Aggiungi gli altri solo se necessari.
      </div>
    </div>
  )
}

// =================== COMPONENTE STAT ===================
const Stat = ({ label, value, color }: { label: string; value: string; color: string }) => (
  <div className="bg-black/40 border border-cyan-500/20 rounded-lg p-3">
    <div className="text-xs text-cyan-600 mb-1">{label}</div>
    <div className={`font-cyber ${color} text-sm sm:text-base`}>{value}</div>
  </div>
)
