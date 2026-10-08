import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react'
import {
  ArrowRightLeft,
  Code2,
  Database,
  FileBadge,
  FlaskConical,
  GitBranch,
  Menu,
  Moon,
  Play,
  ShieldCheck,
  Sun,
  X,
  type LucideIcon,
} from 'lucide-react'
import {
  chapters,
  type Chapter,
  type CertificateId,
  type ConceptId,
  type Level,
  type Mode,
  type Protocol,
} from './data/lessons'
import {
  buildSteps,
  presetConditions,
  presets,
  validConditions,
  type Conditions,
} from './lib/handshake'
import { useHandshake } from './hooks/useHandshake'
import { Button, ConceptDialog, Segment } from './components/Ui'
import { HandshakeChapter } from './components/Handshake'
import { CertificatesChapter } from './components/Certificates'
import { ArchitectureChapter } from './components/Architecture'
import { JavaChapter } from './components/JavaConfiguration'
import { FailureLab } from './components/FailureLab'
import { DiagramDialog } from './components/DiagramDialog'
import type { ChainSide } from './data/diagrams'
import type { ConfigTab } from './data/configuration'
const chapterIcons: Record<Chapter, LucideIcon> = {
  handshake: ArrowRightLeft,
  certificates: FileBadge,
  architecture: Database,
  java: Code2,
  failures: FlaskConical,
}
function initialChapter(): Chapter {
  const id = window.location.hash.slice(1)
  return chapters.find((c) => c.id === id)?.id ?? 'handshake'
}
function SidebarNavigation({
  chapter,
  navigate,
}: {
  chapter: Chapter
  navigate: (id: Chapter) => void
}) {
  return (
    <nav aria-label="Learning chapters">
      {chapters.map((item) => {
        const Icon = chapterIcons[item.id]
        return (
          <a
            key={item.id}
            href={`#${item.id}`}
            onClick={(e) => {
              e.preventDefault()
              navigate(item.id)
            }}
            className={chapter === item.id ? 'active' : ''}
            aria-current={chapter === item.id ? 'page' : undefined}
          >
            <Icon size={21} />
            <span>{item.title}</span>
          </a>
        )
      })}
    </nav>
  )
}
export default function App() {
  const [chapter, setChapter] = useState<Chapter>(initialChapter)
  const [mode, setMode] = useState<Mode>('TLS')
  const [level, setLevel] = useState<Level>('Beginner')
  const [protocol, setProtocol] = useState<Protocol>('1.3')
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      return localStorage.getItem('tls-learning-theme') === 'dark'
        ? 'dark'
        : 'light'
    } catch {
      return 'light'
    }
  })
  const [selectedConcept, setSelectedConcept] = useState<ConceptId | null>(null)
  const [diagramOpen, setDiagramOpen] = useState(false)
  const [certificate, setCertificate] = useState<CertificateId>('serverCert')
  const [chainSide, setChainSide] = useState<ChainSide>('cat → dog')
  const [configTab, setConfigTab] = useState<ConfigTab>('SSL Bundle')
  const [chainPauseVersion, setChainPauseVersion] = useState(0)
  const [conditions, setConditions] = useState<Conditions>({
    ...validConditions,
  })
  const [preset, setPreset] = useState('valid')
  const drawer = useRef<HTMLDialogElement>(null)
  const menuButton = useRef<HTMLButtonElement>(null)
  const diagramTrigger = useRef<HTMLButtonElement | null>(null)
  const steps = useMemo(
    () => buildSteps(mode, level, protocol),
    [mode, level, protocol],
  )
  const controller = useHandshake(steps, validConditions)
  const lab = useHandshake(steps, conditions)
  const definition = chapters.find((c) => c.id === chapter)!
  const pauseMain = controller.pause,
    pauseLab = lab.pause
  useEffect(() => {
    const change = () => {
      if (!chapters.some((c) => c.id === window.location.hash.slice(1))) return
      const next = initialChapter()
      if (next === chapter) return
      pauseMain()
      pauseLab()
      setDiagramOpen(false)
      setSelectedConcept(null)
      setCertificate('serverCert')
      setChainSide('cat → dog')
      setConfigTab('SSL Bundle')
      setChapter(next)
    }
    window.addEventListener('hashchange', change)
    return () => window.removeEventListener('hashchange', change)
  }, [pauseMain, pauseLab, chapter])
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try {
      localStorage.setItem('tls-learning-theme', theme)
    } catch {
      /* Storage is optional in private browsers. */
    }
  }, [theme])
  function navigate(id: Chapter) {
    controller.pause()
    lab.pause()
    setDiagramOpen(false)
    setSelectedConcept(null)
    if (id !== chapter) {
      setCertificate('serverCert')
      setChainSide('cat → dog')
      setConfigTab('SSL Bundle')
    }
    setChapter(id)
    window.location.hash = id
    drawer.current?.close()
    window.scrollTo({ top: 0, behavior: 'instant' })
  }
  function resetFlows() {
    controller.reset()
    lab.reset()
  }
  function changeMode(value: Mode) {
    setMode(value)
    setChainSide('cat → dog')
    resetFlows()
  }
  function changeLevel(value: Level) {
    setLevel(value)
    resetFlows()
  }
  function changeProtocol(value: Protocol) {
    setProtocol(value)
    resetFlows()
  }
  function inspect(id: ConceptId) {
    controller.pause()
    lab.pause()
    setChainPauseVersion((version) => version + 1)
    setSelectedConcept(id)
  }
  function openDiagram(event: MouseEvent<HTMLButtonElement>) {
    diagramTrigger.current = event.currentTarget
    controller.pause()
    lab.pause()
    setChainPauseVersion((version) => version + 1)
    setDiagramOpen(true)
  }
  function choosePreset(id: string) {
    const item = presets.find((p) => p.id === id)
    if (item?.client && mode !== 'mTLS') changeMode('mTLS')
    setConditions(presetConditions(id))
    setPreset(id)
    lab.reset()
  }
  function updateCondition(key: keyof Conditions, value: boolean) {
    setConditions((c) => ({ ...c, [key]: value }))
    setPreset('custom')
    lab.reset()
  }
  return (
    <>
      <a className="skip-link" href="#main-content">
        ข้ามไปเนื้อหา
      </a>
      <header className="app-header">
        <button
          ref={menuButton}
          className="button icon-button mobile-menu"
          type="button"
          aria-label="Open navigation"
          onClick={() => drawer.current?.showModal()}
        >
          <Menu />
        </button>
        <a
          className="brand"
          href="#handshake"
          onClick={(e) => {
            e.preventDefault()
            navigate('handshake')
          }}
        >
          <ShieldCheck strokeWidth={1.8} />
          <span>
            <span className="blue">dog</span>{' '}
            <span className="brand-arrow">↔</span>{' '}
            <span className="purple">cat</span>
          </span>
        </a>
        <div className="header-actions">
          <div className="header-level">
            <Segment
              label="Learning level"
              options={['Beginner', 'Advanced']}
              value={level}
              onChange={changeLevel}
            />
          </div>
          <Button
            className="icon-button theme-button"
            aria-label={
              theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'
            }
            onClick={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
          >
            {theme === 'light' ? <Sun size={21} /> : <Moon size={21} />}
          </Button>
        </div>
      </header>
      <aside className="app-sidebar">
        <SidebarNavigation chapter={chapter} navigate={navigate} />
        <div className="sidebar-bottom">
          <ShieldCheck size={18} />
          <span>Who I am · Who I trust</span>
        </div>
      </aside>
      <dialog
        ref={drawer}
        className="navigation-drawer"
        onClose={() => menuButton.current?.focus()}
        onClick={(e) => {
          if (e.target === e.currentTarget) drawer.current?.close()
        }}
        aria-label="Learning navigation"
      >
        <div>
          <header>
            <strong>Learning chapters</strong>
            <Button
              className="icon-button"
              aria-label="Close navigation"
              onClick={() => drawer.current?.close()}
            >
              <X />
            </Button>
          </header>
          <SidebarNavigation chapter={chapter} navigate={navigate} />
        </div>
      </dialog>
      <main id="main-content" tabIndex={-1}>
        <div className="page-heading">
          <div>
            <h1>{definition.heading}</h1>
            <p>{definition.subtitle}</p>
          </div>
          <div className="main-controls">
            <Button
              className="diagram-open-button"
              aria-haspopup="dialog"
              onClick={openDiagram}
            >
              <GitBranch size={18} /> ดูแผนภาพการทำงาน
            </Button>
            <Segment
              label="Authentication mode"
              options={['TLS', 'mTLS']}
              value={mode}
              onChange={changeMode}
            />
            {chapter === 'handshake' ? (
              <Button
                className="primary connect-button"
                onClick={controller.start}
              >
                <Play size={18} /> Connect to cat
              </Button>
            ) : null}
          </div>
        </div>
        <div className="mobile-level">
          <Segment
            label="Learning level mobile"
            options={['Beginner', 'Advanced']}
            value={level}
            onChange={changeLevel}
          />
        </div>
        {level === 'Advanced' ? (
          <div className="protocol-bar">
            <span>TLS protocol</span>
            <Segment
              label="TLS protocol version"
              options={['1.2', '1.3']}
              value={protocol}
              onChange={changeProtocol}
            />
            <span>Full handshake · ไม่รวม resumption / 0-RTT</span>
          </div>
        ) : null}
        {chapter === 'handshake' ? (
          <HandshakeChapter
            {...{ controller, mode, level, protocol, inspect }}
          />
        ) : chapter === 'certificates' ? (
          <CertificatesChapter
            {...{
              mode,
              level,
              inspect,
              certificate,
              setCertificate,
              chainSide,
              setChainSide,
              chainPauseVersion,
            }}
            openFailures={() => navigate('failures')}
          />
        ) : chapter === 'architecture' ? (
          <ArchitectureChapter {...{ mode, level, inspect }} />
        ) : chapter === 'java' ? (
          <JavaChapter
            {...{ mode, level, inspect }}
            tab={configTab}
            setTab={setConfigTab}
          />
        ) : (
          <FailureLab
            {...{
              mode,
              level,
              protocol,
              inspect,
              conditions,
              preset,
              choosePreset,
            }}
            controller={lab}
            update={updateCondition}
            reset={() => {
              setConditions({ ...validConditions })
              setPreset('valid')
              lab.reset()
            }}
          />
        )}
        <footer className="app-footer">
          <span>dog ↔ cat · Interactive TLS / mTLS Learning</span>
          <span>Certificate = Identity · Private Key = Proof of ownership</span>
          <div>
            <a
              href="https://www.rfc-editor.org/rfc/rfc8446.html"
              target="_blank"
              rel="noreferrer"
            >
              TLS 1.3
            </a>
            <a
              href="https://www.rfc-editor.org/rfc/rfc5246.html"
              target="_blank"
              rel="noreferrer"
            >
              TLS 1.2
            </a>
            <a
              href="https://www.rfc-editor.org/info/rfc5280/"
              target="_blank"
              rel="noreferrer"
            >
              X.509 / PKI
            </a>
          </div>
        </footer>
      </main>
      <ConceptDialog
        id={selectedConcept}
        level={level}
        close={() => setSelectedConcept(null)}
        inspect={inspect}
      />
      {diagramOpen ? (
        <DiagramDialog
          context={{
            chapter,
            mode,
            level,
            protocol,
            certificate,
            chainSide,
            configTab,
            conditions,
          }}
          returnFocus={diagramTrigger}
          close={() => setDiagramOpen(false)}
        />
      ) : null}
    </>
  )
}
