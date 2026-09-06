import { useRef, useState } from 'react'

type Point = {
  x: number
  y: number
}

type Particle = Point & {
  id: number
  size: number
}

type CharacterWord = {
  text: string
  image: string
}

const defaultGuideStrokes: Point[][] = [
  [
    { x: 300, y: 270 },
    { x: 390, y: 250 },
    { x: 500, y: 245 },
    { x: 610, y: 250 },
    { x: 700, y: 275 },
  ],
  [
    { x: 510, y: 175 },
    { x: 500, y: 300 },
    { x: 490, y: 430 },
    { x: 480, y: 560 },
    { x: 475, y: 680 },
  ],
  [
    { x: 690, y: 365 },
    { x: 650, y: 420 },
    { x: 630, y: 500 },
    { x: 640, y: 585 },
    { x: 700, y: 635 },
    { x: 770, y: 620 },
    { x: 790, y: 545 },
    { x: 775, y: 470 },
    { x: 720, y: 430 },
  ],
]

const guideStrokesByCharacter = {
  あ: defaultGuideStrokes,
  い: [
    [
      { x: 390, y: 280 },
      { x: 370, y: 390 },
      { x: 365, y: 510 },
      { x: 390, y: 610 },
    ],
    [
      { x: 590, y: 285 },
      { x: 575, y: 410 },
      { x: 580, y: 535 },
      { x: 625, y: 640 },
    ],
  ],
  う: [
    [
      { x: 420, y: 300 },
      { x: 455, y: 390 },
      { x: 480, y: 470 },
    ],
    [
      { x: 610, y: 260 },
      { x: 650, y: 360 },
      { x: 665, y: 490 },
      { x: 640, y: 610 },
      { x: 570, y: 690 },
      { x: 480, y: 700 },
      { x: 430, y: 650 },
    ],
  ],
} as const

const viewBoxSize = 1000
const traceTolerance = 120
const characters = ['あ', 'い', 'う'] as const
const characterWords: Record<(typeof characters)[number], CharacterWord[]> = {
  あ: [
    { text: 'あめ', image: '☔' },
    { text: 'あり', image: '🐜' },
  ],
  い: [
    { text: 'いす', image: '🪑' },
    { text: 'いぬ', image: '🐶' },
  ],
  う: [
    { text: 'うさぎ', image: '🐰' },
    { text: 'うみ', image: '🌊' },
  ],
}

export function App() {
  const practiceAreaRef = useRef<SVGSVGElement>(null)
  const particleIdRef = useRef(0)
  const lastPointRef = useRef<Point | null>(null)
  const activeStrokeRef = useRef<Point[]>([])
  const audioContextRef = useRef<AudioContext | null>(null)
  const lastSoundTimeRef = useRef(0)
  const [selectedCharacter, setSelectedCharacter] = useState<(typeof characters)[number]>('あ')
  const [strokes, setStrokes] = useState<Point[][]>([])
  const [activeStroke, setActiveStroke] = useState<Point[]>([])
  const [particles, setParticles] = useState<Particle[]>([])
  const [isTracing, setIsTracing] = useState(false)
  const [completedStrokeCount, setCompletedStrokeCount] = useState(0)
  const [lastResult, setLastResult] = useState<'success' | 'retry' | null>(null)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const currentGuideStrokes = guideStrokesByCharacter[selectedCharacter]
  const currentWords = characterWords[selectedCharacter]

  function getPoint(event: React.PointerEvent<SVGSVGElement>): Point | null {
    const svg = practiceAreaRef.current
    if (!svg) return null

    const bounds = svg.getBoundingClientRect()
    return {
      x: ((event.clientX - bounds.left) / bounds.width) * viewBoxSize,
      y: ((event.clientY - bounds.top) / bounds.height) * viewBoxSize,
    }
  }

  function handlePointerDown(event: React.PointerEvent<SVGSVGElement>) {
    event.preventDefault()
    const point = getPoint(event)
    if (!point || completedStrokeCount >= currentGuideStrokes.length) return

    event.currentTarget.setPointerCapture(event.pointerId)
    setIsTracing(true)
    activeStrokeRef.current = [point]
    setActiveStroke([point])
    lastPointRef.current = point
    setLastResult(null)
    addParticle(point)
    playSound(440, 0.08)
  }

  function getAudioContext() {
    if (!soundEnabled) return null
    if (!audioContextRef.current && 'AudioContext' in window) {
      audioContextRef.current = new AudioContext()
    }
    return audioContextRef.current
  }

  function playSound(frequency: number, duration: number) {
    try {
      const audioContext = getAudioContext()
      if (!audioContext) return

      if (audioContext.state === 'suspended') void audioContext.resume()
      const oscillator = audioContext.createOscillator()
      const gain = audioContext.createGain()
      const startTime = audioContext.currentTime
      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(frequency, startTime)
      gain.gain.setValueAtTime(0.0001, startTime)
      gain.gain.exponentialRampToValueAtTime(0.045, startTime + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration)
      oscillator.connect(gain)
      gain.connect(audioContext.destination)
      oscillator.start(startTime)
      oscillator.stop(startTime + duration)
    } catch {
    }
  }

  function addParticle(point: Point) {
    const particle = {
      ...point,
      id: particleIdRef.current,
      size: 9 + (particleIdRef.current % 3) * 3,
    }
    particleIdRef.current += 1
    setParticles((currentParticles) => [...currentParticles, particle].slice(-24))
    window.setTimeout(() => {
      setParticles((currentParticles) =>
        currentParticles.filter(({ id }) => id !== particle.id),
      )
    }, 700)
  }

  function handlePointerMove(event: React.PointerEvent<SVGSVGElement>) {
    if (!isTracing) return
    event.preventDefault()
    const point = getPoint(event)
    if (!point) return

    const previousPoint = lastPointRef.current
    const distance = previousPoint
      ? Math.hypot(point.x - previousPoint.x, point.y - previousPoint.y)
      : Infinity

    if (distance > 22) addParticle(point)
    if (distance > 45 && performance.now() - lastSoundTimeRef.current > 90) {
      lastSoundTimeRef.current = performance.now()
      playSound(620, 0.06)
    }
    lastPointRef.current = point
    activeStrokeRef.current = [...activeStrokeRef.current, point]
    setActiveStroke(activeStrokeRef.current)
  }

  function finishTracing(event: React.PointerEvent<SVGSVGElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    const finishedStroke = activeStrokeRef.current
    if (finishedStroke.length > 1) {
      const guide = currentGuideStrokes[completedStrokeCount]
      const isSuccess = isStrokeSuccessful(finishedStroke, guide)

      if (isSuccess) {
        setStrokes((currentStrokes) => [...currentStrokes, finishedStroke])
        setCompletedStrokeCount((count) => count + 1)
        setLastResult('success')
        playSound(880, 0.16)
      } else {
        setLastResult('retry')
      }
    } else {
      setLastResult('retry')
    }
    lastPointRef.current = null
    activeStrokeRef.current = []
    setActiveStroke([])
    setIsTracing(false)
  }

  function isStrokeSuccessful(stroke: Point[], guide: readonly Point[]) {
    const strokeLength = stroke.reduce((total, point, index) => {
      if (index === 0) return total
      const previousPoint = stroke[index - 1]
      return total + Math.hypot(point.x - previousPoint.x, point.y - previousPoint.y)
    }, 0)
    const coveredGuidePoints = guide.filter((guidePoint) =>
      stroke.some(
        (point) => Math.hypot(point.x - guidePoint.x, point.y - guidePoint.y) <= traceTolerance,
      ),
    ).length

    return strokeLength >= 90 && coveredGuidePoints / guide.length >= 0.6
  }

  function clearDrawing() {
    setStrokes([])
    setActiveStroke([])
    setParticles([])
    lastPointRef.current = null
    activeStrokeRef.current = []
    setCompletedStrokeCount(0)
    setLastResult(null)
    setIsTracing(false)
  }

  const statusText = completedStrokeCount === currentGuideStrokes.length
    ? 'できた！'
    : lastResult === 'success'
      ? `${completedStrokeCount}かいめ できた！`
      : lastResult === 'retry'
        ? 'もういちど なぞってみよう'
        : `${completedStrokeCount + 1}かいめを なぞってね`

  return (
    <main className="app-shell">
      <header className="top-bar">
        <div className="brand-mark" aria-label="なぞりあそび">
          <span className="brand-dot" aria-hidden="true" />
          <span>なぞりあそび</span>
        </div>
        <div className="progress-badge" aria-label="れんしゅう 1もじめ">
          <span aria-hidden="true">1</span>
          <span>もじめ</span>
        </div>
        <button
          className="sound-button"
          type="button"
          aria-label={soundEnabled ? 'おとを けす' : 'おとを つける'}
          aria-pressed={soundEnabled}
          onClick={() => {
            const nextSoundEnabled = !soundEnabled
            setSoundEnabled(nextSoundEnabled)
            if (nextSoundEnabled) playSound(520, 0.08)
          }}
        >
          <span aria-hidden="true">{soundEnabled ? '♪' : '♪̸'}</span>
          <span>{soundEnabled ? 'おとあり' : 'おとなし'}</span>
        </button>
      </header>

      <nav className="character-picker" aria-label="れんしゅうする もじ">
        {characters.map((character) => (
          <button
            key={character}
            className={`character-button${character === selectedCharacter ? ' is-selected' : ''}`}
            type="button"
            aria-label={`${character}を れんしゅうする`}
            aria-pressed={character === selectedCharacter}
            onClick={() => {
              setSelectedCharacter(character)
              clearDrawing()
            }}
          >
            {character}
          </button>
        ))}
      </nav>

      <section className="practice-header" aria-labelledby="practice-title">
        <p className="eyebrow">きょうの もじ</p>
        <h1 id="practice-title">{selectedCharacter}</h1>
        <p className="prompt">ゆびで なぞってみよう</p>
      </section>

      <section className="practice-card" aria-label={`${selectedCharacter}のなぞり練習`}>
        <div className="sparkle sparkle-one" aria-hidden="true">✦</div>
        <div className="sparkle sparkle-two" aria-hidden="true">✧</div>
        <svg
          ref={practiceAreaRef}
          className="tracing-canvas"
          viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
          role="img"
          aria-label={`${selectedCharacter}をなぞる場所`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishTracing}
          onPointerCancel={finishTracing}
        >
          <text className="character-outline" x="500" y="730" textAnchor="middle">
            {selectedCharacter}
          </text>
          <text className="guide-character" x="500" y="730" textAnchor="middle">
            {selectedCharacter}
          </text>
          {strokes.map((currentStroke, index) => (
            <polyline
              key={`stroke-${index}`}
              className="user-stroke"
              points={currentStroke.map(({ x, y }) => `${x},${y}`).join(' ')}
            />
          ))}
          {activeStroke.length > 0 && (
            <polyline
              className={`user-stroke${lastResult === 'retry' ? ' failed-stroke' : ''}`}
              points={activeStroke.map(({ x, y }) => `${x},${y}`).join(' ')}
            />
          )}
          {particles.map((particle) => (
            <circle
              key={particle.id}
              className="trace-particle"
              cx={particle.x}
              cy={particle.y}
              r={particle.size}
            />
          ))}
        </svg>
      </section>

      <section className="word-strip" aria-label={`${selectedCharacter}のことば`}>
        <p className="word-strip-title">{selectedCharacter}の ことば</p>
        <div className="word-list">
          {currentWords.map((word) => (
            <div className="word-item" key={word.text}>
              <span className="word-image" role="img" aria-label={word.text}>
                {word.image}
              </span>
              <span>{word.text}</span>
            </div>
          ))}
        </div>
      </section>

      <p className={`touch-status${isTracing ? ' is-active' : ''}${completedStrokeCount === currentGuideStrokes.length ? ' is-complete' : ''}`} aria-live="polite">
        {isTracing ? 'なぞっているよ' : statusText}
      </p>
      <button className="clear-button" type="button" onClick={clearDrawing}>
        <span aria-hidden="true">↻</span>
        もういちど
      </button>
    </main>
  )
}
