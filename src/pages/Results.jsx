import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import createdTranscription from '../../docs/transcript1.json'

const audioAssets = Object.fromEntries(
  Object.entries(
    import.meta.glob('../../docs/audio/*', {
      eager: true,
      import: 'default',
      query: '?url',
    }),
  ).map(([path, url]) => [`docs/audio/${path.split('/').at(-1)}`, url]),
)

const savedResults = [
  createdTranscription,
  {
    id: 'result-2',
    title: 'BWL - Revenue Model',
    group: 'INF4',
    audioUrl: '',
    durationSeconds: 2547,
    language: 'en',
    createdAt: '2026-06-24T10:30:00Z',
    createdBy: 'Taylan Deniz Yildirim',
    transcription: {
      status: 'completed',
      speakers: [
        { id: 'person_1' },
        { id: 'person_2' },
      ],
      segments: [
        {
          id: 'bwl-1',
          speakerId: 'person_1',
          speaker: 'Lecturer',
          startTime: 82,
          endTime: 116,
          text: 'Fixed costs remain stable in the short term, while variable costs increase with production volume.',
        },
        {
          id: 'bwl-2',
          speakerId: 'person_2',
          speaker: 'Student',
          startTime: 117,
          endTime: 129,
          text: 'So the contribution margin helps us understand how many units we need to sell?',
        },
        {
          id: 'bwl-3',
          speakerId: 'person_1',
          speaker: 'Lecturer',
          startTime: 130,
          endTime: 171,
          text: 'Exactly. The break-even point is reached when total revenue covers total costs.',
        },
      ],
    },
  },
  {
    id: 'result-3',
    title: 'ProfSkills',
    group: 'INF4',
    audioUrl: '',
    durationSeconds: 1957,
    language: 'en',
    createdAt: '2026-06-23T14:15:00Z',
    createdBy: 'Orhan Sami Bolat',
    transcription: {
      status: 'completed',
      speakers: [
        { id: 'person_1' },
        { id: 'person_2' },
      ],
      segments: [
        {
          id: 'prof-1',
          speakerId: 'person_1',
          speaker: 'Person 1',
          startTime: 420,
          endTime: 454,
          text: 'The main point is to communicate project decisions clearly and with evidence.',
        },
        {
          id: 'prof-2',
          speakerId: 'person_2',
          speaker: 'Person 2',
          startTime: 455,
          endTime: 489,
          text: 'That means the presentation should explain both the result and the reasoning.',
        },
      ],
    },
  },
]

const textFixes = {
  '\u00c3\u0084': '\u00c4',
  '\u00c3\u0096': '\u00d6',
  '\u00c3\u009c': '\u00dc',
  '\u00c3\u00a4': '\u00e4',
  '\u00c3\u00b6': '\u00f6',
  '\u00c3\u00bc': '\u00fc',
  '\u00c3\u009f': '\u00df',
  '\u00c3\u00bcber': '\u00fcber',
  '\u00c3\u00b6ffnen': '\u00f6ffnen',
  '\u00c3\u00bcbertragen': '\u00fcbertragen',
  '\u00c3\u009cberblick': '\u00dcberblick',
  '\u00c3\u0084hnlich': '\u00c4hnlich',
  'gro\u00c3\u009f': 'gro\u00df',
  'Ger\u00c3\u00a4te': 'Ger\u00e4te',
  'f\u00c3\u00bcr': 'f\u00fcr',
  'k\u00c3\u00b6nnen': 'k\u00f6nnen',
  'm\u00c3\u00bcssen': 'm\u00fcssen',
  'vollst\u00c3\u00a4ndig': 'vollst\u00e4ndig',
}

function cleanText(value) {
  return Object.entries(textFixes).reduce(
    (currentText, [broken, fixed]) => currentText.replaceAll(broken, fixed),
    value,
  )
}

function getSegments(result) {
  return result.transcription?.segments ?? []
}

function getInitialTime(result) {
  return getSegments(result)[0]?.startTime ?? 0
}

function getAudioSource(result) {
  if (!result.audioUrl) {
    return ''
  }

  return audioAssets[result.audioUrl] ?? result.audioUrl
}

function formatDuration(totalSeconds) {
  const safeSeconds = Math.floor(totalSeconds)
  const minutes = Math.floor(safeSeconds / 60)
  const seconds = safeSeconds % 60

  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function getDefaultSpeakerNames(result) {
  return Object.fromEntries(
    (result.transcription?.speakers ?? []).map((speaker, index) => [
      speaker.id,
      `Person ${index + 1}`,
    ]),
  )
}

function getSpeakerName(segment, speakerNames) {
  return speakerNames[segment.speakerId] ?? segment.speaker ?? 'Unknown speaker'
}

function getTranscriptText(result, speakerNames) {
  return getSegments(result)
    .map((segment) => {
      const time = `${formatDuration(segment.startTime)}-${formatDuration(segment.endTime)}`
      return `[${time}] ${getSpeakerName(segment, speakerNames)}: ${cleanText(segment.text)}`
    })
    .join('\n\n')
}

function downloadTranscript(result, speakerNames) {
  const blob = new Blob([getTranscriptText(result, speakerNames)], {
    type: 'text/plain;charset=utf-8',
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')

  anchor.href = url
  anchor.download = `${result.title.toLowerCase().replaceAll(' ', '-')}.txt`
  anchor.click()
  URL.revokeObjectURL(url)
}

function Results() {
  const audioRef = useRef(null)
  const [searchParams] = useSearchParams()
  const [currentTime, setCurrentTime] = useState(getInitialTime(savedResults[0]))
  const [isPlaying, setIsPlaying] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [speakerNamesByResult, setSpeakerNamesByResult] = useState(() =>
    Object.fromEntries(savedResults.map((result) => [result.id, getDefaultSpeakerNames(result)])),
  )
  const selectedId = searchParams.get('file') ?? savedResults[0].id

  const selectedResult = useMemo(
    () => savedResults.find((result) => result.id === selectedId) ?? savedResults[0],
    [selectedId],
  )

  const segments = getSegments(selectedResult)
  const speakerNames =
    speakerNamesByResult[selectedResult.id] ?? getDefaultSpeakerNames(selectedResult)
  const audioSource = getAudioSource(selectedResult)
  const progressPercent = selectedResult.durationSeconds
    ? Math.min((currentTime / selectedResult.durationSeconds) * 100, 100)
    : 0
  const currentTranscript = segments.find(
    (segment) => currentTime >= segment.startTime && currentTime <= segment.endTime,
  )

  useEffect(() => {
    const initialTime = getInitialTime(selectedResult)
    const audio = audioRef.current

    setCurrentTime(initialTime)
    setIsPlaying(false)
    setStatusMessage('')

    if (audio) {
      audio.pause()
      audio.currentTime = initialTime
    }
  }, [selectedResult])

  function handleTogglePlayback() {
    const audio = audioRef.current

    if (!audio) {
      return
    }

    if (audio.paused) {
      audio.play().catch(() => setIsPlaying(false))
    } else {
      audio.pause()
    }
  }

  function seekAudio(nextTime) {
    const audio = audioRef.current
    const safeTime = Math.min(Math.max(nextTime, 0), selectedResult.durationSeconds)

    setCurrentTime(safeTime)

    if (audio) {
      audio.currentTime = safeTime
    }
  }

  function handleProgressPointerDown(event) {
    if (!audioSource) {
      return
    }

    const bounds = event.currentTarget.getBoundingClientRect()
    const clickPosition = (event.clientX - bounds.left) / bounds.width

    seekAudio(clickPosition * selectedResult.durationSeconds)
  }

  function handleProgressKeyDown(event) {
    if (!audioSource) {
      return
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      seekAudio(currentTime - 5)
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault()
      seekAudio(currentTime + 5)
    }
  }

  function handleSpeakerNameChange(speakerId, nextName) {
    setSpeakerNamesByResult((currentNames) => ({
      ...currentNames,
      [selectedResult.id]: {
        ...(currentNames[selectedResult.id] ?? getDefaultSpeakerNames(selectedResult)),
        [speakerId]: nextName,
      },
    }))
  }

  async function handleCopyTranscript() {
    try {
      await navigator.clipboard.writeText(getTranscriptText(selectedResult, speakerNames))
      setStatusMessage('Transcript copied to clipboard.')
    } catch {
      setStatusMessage('Copy is not available in this browser.')
    }
  }

  return (
    <section id="main-content" className="results-page">
      <aside className="results-sidebar" aria-label="Saved transcription results">
        <p className="eyebrow">Saved results</p>
        <h1>Results</h1>
        <p className="results-page-intro">
          Open a saved transcription, listen to the audio, and follow the transcript by timestamp.
        </p>

        <nav className="result-page-links" aria-label="Related workflow links">
          <Link to="/transcribe">New transcription</Link>
          <Link to="/shared">Shared files</Link>
        </nav>

        <div className="result-list">
          {savedResults.map((result) => (
            <Link
              className={selectedResult.id === result.id ? 'result-card active' : 'result-card'}
              key={result.id}
              to={`/results?file=${result.id}`}
            >
              <span>
                <strong>{result.title}</strong>
                <small>
                  {result.group} - {result.language.toUpperCase()}
                </small>
              </span>
              <time>{formatDuration(result.durationSeconds)}</time>
            </Link>
          ))}
        </div>
      </aside>

      <article className="result-workspace" aria-live="polite">
        <header className="result-workspace-header">
          <div>
            <p className="eyebrow">Selected file</p>
            <h2>{selectedResult.title}</h2>
            <p className="result-meta">
              {selectedResult.createdBy} - {selectedResult.group} -{' '}
              {selectedResult.language.toUpperCase()}
            </p>
          </div>
          <div className="result-actions">
            <button type="button" onClick={handleCopyTranscript}>
              Copy transcript
            </button>
            <button type="button" onClick={() => downloadTranscript(selectedResult, speakerNames)}>
              Download .txt
            </button>
          </div>
        </header>

        <section className="speaker-strip" aria-label="Detected speakers">
          {selectedResult.transcription.speakers.map((speaker, index) => (
            <label className="speaker-card" key={speaker.id}>
              <span>Person {index + 1}</span>
              <input
                aria-label={`Speaker name for Person ${index + 1}`}
                value={speakerNames[speaker.id] ?? `Person ${index + 1}`}
                onChange={(event) => handleSpeakerNameChange(speaker.id, event.target.value)}
              />
            </label>
          ))}
        </section>

        <section className="audio-progress-card">
          <div className="selected-file-header">
            <div>
              <p className="eyebrow">Audio progress</p>
              <h3>{formatDuration(currentTime)}</h3>
            </div>
            <button
              className="playback-button"
              type="button"
              disabled={!audioSource}
              onClick={handleTogglePlayback}
            >
              {isPlaying ? 'Pause' : 'Play'}
            </button>
          </div>

          <div className="waveform" aria-hidden="true">
            {Array.from({ length: 48 }, (_, index) => (
              <span
                key={index}
                className={index < Math.round(progressPercent / 2.1) ? 'played' : undefined}
              />
            ))}
          </div>

          <div
            className="progress-track"
            aria-label="Audio progress"
            aria-valuemax={Math.floor(selectedResult.durationSeconds)}
            aria-valuemin={0}
            aria-valuenow={Math.floor(currentTime)}
            aria-valuetext={`${formatDuration(currentTime)} of ${formatDuration(
              selectedResult.durationSeconds,
            )}`}
            role="slider"
            style={{ '--progress-thumb-position': `${progressPercent}%` }}
            tabIndex={audioSource ? 0 : -1}
            onKeyDown={handleProgressKeyDown}
            onPointerDown={handleProgressPointerDown}
          >
            <span style={{ width: `${progressPercent}%` }} />
          </div>

          <p>
            {formatDuration(currentTime)} / {formatDuration(selectedResult.durationSeconds)}
          </p>

          {audioSource ? (
            <audio
              className="audio-player"
              key={selectedResult.id}
              preload="metadata"
              ref={audioRef}
              src={audioSource}
              onEnded={() => setIsPlaying(false)}
              onLoadedMetadata={(event) => {
                const initialTime = getInitialTime(selectedResult)
                event.currentTarget.currentTime = initialTime
                setCurrentTime(initialTime)
              }}
              onPause={() => setIsPlaying(false)}
              onPlay={() => setIsPlaying(true)}
              onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
            />
          ) : (
            <p className="audio-missing-message">No audio file is connected to this result yet.</p>
          )}
        </section>

        <section className="current-transcript-card">
          <p className="eyebrow">Current transcript</p>
          {currentTranscript ? (
            <blockquote>
              <strong>
                {getSpeakerName(currentTranscript, speakerNames)} (
                {formatDuration(currentTranscript.startTime)}-
                {formatDuration(currentTranscript.endTime)})
              </strong>
              <span>{cleanText(currentTranscript.text)}</span>
            </blockquote>
          ) : (
            <p>No transcript line is active at this timestamp.</p>
          )}
        </section>

        <div className="transcript-list">
          {segments.map((segment, index) => (
            <section
              className={currentTranscript === segment ? 'transcript-row active' : 'transcript-row'}
              key={`${segment.id}-${index}`}
            >
              <div>
                <strong>{getSpeakerName(segment, speakerNames)}</strong>
                <time>
                  {formatDuration(segment.startTime)}-{formatDuration(segment.endTime)}
                </time>
              </div>
              <p>{cleanText(segment.text)}</p>
            </section>
          ))}
        </div>

        {statusMessage ? <p className="result-status-message">{statusMessage}</p> : null}
      </article>
    </section>
  )
}

export default Results
