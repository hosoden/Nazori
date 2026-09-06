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

type SupportedCharacter = string
type KanaType = 'hiragana' | 'katakana'

const viewBoxSize = 1000
const hiraganaCharacters = [...'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん'] as SupportedCharacter[]
const katakanaCharacters = [...'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン'] as SupportedCharacter[]
const characters = [...hiraganaCharacters, ...katakanaCharacters]
const initialHiraganaCandidates = ['え', 'お', 'か']
const initialKatakanaCandidates = ['エ', 'オ', 'カ']
const characterWords: Record<string, CharacterWord[]> = {
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
  え: [{ text: 'えき', image: '🚉' }, { text: 'えんぴつ', image: '✏️' }],
  お: [{ text: 'おにぎり', image: '🍙' }, { text: 'おはな', image: '🌷' }],
  ア: [
    { text: 'あめ', image: '☔' },
    { text: 'あり', image: '🐜' },
  ],
  イ: [
    { text: 'いす', image: '🪑' },
    { text: 'いぬ', image: '🐶' },
  ],
  ウ: [
    { text: 'うさぎ', image: '🐰' },
    { text: 'うみ', image: '🌊' },
  ],
  エ: [{ text: 'エレベーター', image: '🛗' }, { text: 'エプロン', image: '🧑‍🍳' }],
  オ: [{ text: 'オレンジ', image: '🍊' }, { text: 'オムライス', image: '🍳' }],
}

export function App() {
  const practiceAreaRef = useRef<SVGSVGElement>(null)
  const particleIdRef = useRef(0)
  const lastPointRef = useRef<Point | null>(null)
  const activeStrokeRef = useRef<Point[]>([])
  const audioContextRef = useRef<AudioContext | null>(null)
  const lastSoundTimeRef = useRef(0)
  const [kanaType, setKanaType] = useState<KanaType>('hiragana')
  const [candidateCharacters, setCandidateCharacters] = useState<SupportedCharacter[]>(initialHiraganaCandidates)
  const [selectedCharacter, setSelectedCharacter] = useState<SupportedCharacter>('え')
  const [completedCharacters, setCompletedCharacters] = useState<SupportedCharacter[]>([])
  const [strokes, setStrokes] = useState<Point[][]>([])
  const [activeStroke, setActiveStroke] = useState<Point[]>([])
  const [particles, setParticles] = useState<Particle[]>([])
  const [isTracing, setIsTracing] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [lastResult, setLastResult] = useState<'success' | 'retry' | null>(null)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const currentWords = characterWords[selectedCharacter] ?? []
  const visibleCharacters = candidateCharacters

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
    if (!point) return

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
      const allPoints = [...strokes.flat(), ...finishedStroke]
      setStrokes((currentStrokes) => [...currentStrokes, finishedStroke])
      if (isDrawingSuccessful(allPoints)) {
        setIsComplete(true)
        setLastResult('success')
        setCompletedCharacters((currentCompleted) =>
          currentCompleted.includes(selectedCharacter)
            ? currentCompleted
            : [...currentCompleted, selectedCharacter],
        )
        playSound(880, 0.16)
      } else {
        setLastResult(null)
      }
    } else {
      setLastResult(null)
    }
    lastPointRef.current = null
    activeStrokeRef.current = []
    setActiveStroke([])
    setIsTracing(false)
  }

  function isDrawingSuccessful(stroke: Point[]) {
    const strokeLength = stroke.reduce((total, point, index) => {
      if (index === 0) return total
      const previousPoint = stroke[index - 1]
      return total + Math.hypot(point.x - previousPoint.x, point.y - previousPoint.y)
    }, 0)
    const practiceBounds = { minX: 240, maxX: 760, minY: 180, maxY: 780 }
    const coveredAreas = new Set(
      stroke
        .filter(({ x, y }) =>
          x >= practiceBounds.minX &&
          x <= practiceBounds.maxX &&
          y >= practiceBounds.minY &&
          y <= practiceBounds.maxY,
        )
        .map(({ x, y }) => `${Math.floor(x / 100)}:${Math.floor(y / 100)}`),
    )
    return strokeLength >= 260 && coveredAreas.size >= 12
  }

  function clearDrawing() {
    setStrokes([])
    setActiveStroke([])
    setParticles([])
    lastPointRef.current = null
    activeStrokeRef.current = []
    setIsComplete(false)
    setLastResult(null)
    setIsTracing(false)
  }

  function chooseNextCharacter() {
    const availableCharacters = kanaType === 'hiragana' ? hiraganaCharacters : katakanaCharacters
    const nextCharacter = availableCharacters.find(
      (character) =>
        !candidateCharacters.includes(character) &&
        character !== selectedCharacter &&
        !completedCharacters.includes(character),
    )
    if (!nextCharacter) return

    setCandidateCharacters((currentCandidates) => [
      ...currentCandidates.filter((character) => character !== selectedCharacter),
      nextCharacter,
    ])
    setSelectedCharacter(nextCharacter)
    clearDrawing()
  }

  const statusText = isComplete
    ? 'できた！'
    : 'たくさん なぞってね'

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
        <div className="kana-switcher" role="group" aria-label="かなの しゅるい">
          <button
            className={`kana-switch-button${kanaType === 'hiragana' ? ' is-selected' : ''}`}
            type="button"
            aria-pressed={kanaType === 'hiragana'}
            onClick={() => {
              setKanaType('hiragana')
              const nextCandidates = initialHiraganaCandidates
              setCandidateCharacters(nextCandidates)
              setSelectedCharacter(nextCandidates[0])
              setCompletedCharacters([])
              clearDrawing()
            }}
          >
            ひらがな
          </button>
          <button
            className={`kana-switch-button${kanaType === 'katakana' ? ' is-selected' : ''}`}
            type="button"
            aria-pressed={kanaType === 'katakana'}
            onClick={() => {
              setKanaType('katakana')
              const nextCandidates = initialKatakanaCandidates
              setCandidateCharacters(nextCandidates)
              setSelectedCharacter(nextCandidates[0])
              setCompletedCharacters([])
              clearDrawing()
            }}
          >
            カタカナ
          </button>
        </div>
        <div className="character-buttons" aria-label={`${kanaType === 'hiragana' ? 'ひらがな' : 'カタカナ'}の もじ`}>
        {visibleCharacters.map((character) => (
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
        </div>
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

      <p className={`touch-status${isTracing ? ' is-active' : ''}${isComplete ? ' is-complete' : ''}`} aria-live="polite">
        {isTracing ? 'なぞっているよ' : statusText}
      </p>
      {isComplete && (
        <button className="next-button" type="button" onClick={chooseNextCharacter}>
          つぎのもじ
          <span aria-hidden="true">→</span>
        </button>
      )}
      <button className="clear-button" type="button" onClick={clearDrawing}>
        <span aria-hidden="true">↻</span>
        もういちど
      </button>
    </main>
  )
}
