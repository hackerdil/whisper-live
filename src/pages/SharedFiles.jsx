import { useEffect, useMemo, useRef, useState } from 'react'
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

const sharedTranscriptions = [
  createdTranscription,
  {
    id: '2',
    title: 'BWL - Transcript - VL2',
    group: 'INF4',
    audioUrl: '',
    durationSeconds: 2547,
    language: 'en',
    createdAt: '2026-06-23T09:30:00Z',
    createdBy: 'Taylan Deniz Yildirim',
    transcription: {
      status: 'completed',
      speakers: [
        {
          id: 'person_1',
          label: 'Person 1',
          voice: 'Alex',
        },
        {
          id: 'person_2',
          label: 'Person 2',
          voice: 'Sam',
        },
      ],
      segments: [
        {
          id: 'seg-001',
          speakerId: 'person_1',
          speaker: 'Person 1',
          startTime: 1167,
          endTime: 1186,
          text: 'Welcome back. Today we continue with the cost structure and revenue model.',
        },
        {
          id: 'seg-002',
          speakerId: 'person_2',
          speaker: 'Person 2',
          startTime: 1187,
          endTime: 1196,
          text: 'Could you repeat how the fixed costs are separated from variable costs?',
        },
        {
          id: 'seg-003',
          speakerId: 'person_1',
          speaker: 'Person 1',
          startTime: 1197,
          endTime: 1246,
          text: 'Fixed costs do not change with output in the short term, while variable costs scale with production.',
        },
        {
          id: 'seg-004',
          speakerId: 'person_1',
          speaker: 'Person 1',
          startTime: 1257,
          endTime: 1363,
          text: 'This distinction becomes important when calculating the break-even point.',
        },
      ],
    },
  },
  {
    id: '3',
    title: 'ProfSkills',
    group: 'INF4',
    audioUrl: '',
    durationSeconds: 1957,
    language: 'en',
    createdAt: '2026-06-22T14:15:00Z',
    createdBy: 'Orhan Sami Bolat',
    transcription: {
      status: 'completed',
      speakers: [
        {
          id: 'person_1',
          label: 'Person 1',
          voice: 'Maya',
        },
        {
          id: 'person_2',
          label: 'Person 2',
          voice: 'Noah',
        },
      ],
      segments: [
        {
          id: 'seg-001',
          speakerId: 'person_1',
          speaker: 'Person 1',
          startTime: 420,
          endTime: 454,
          text: 'The main point is to communicate project decisions clearly and with evidence.',
        },
        {
          id: 'seg-002',
          speakerId: 'person_2',
          speaker: 'Person 2',
          startTime: 455,
          endTime: 489,
          text: 'That means the presentation should explain both the result and the reasoning.',
        },
      ],
    },
  },
  {
    id: '4',
    title: 'Stochastik',
    group: 'BISD6',
    audioUrl: '',
    durationSeconds: 1663,
    language: 'en',
    createdAt: '2026-06-21T11:45:00Z',
    createdBy: 'Mahmut Ekrem Acar',
    transcription: {
      status: 'completed',
      speakers: [
        {
          id: 'person_1',
          label: 'Person 1',
          voice: 'Lena',
        },
        {
          id: 'person_2',
          label: 'Person 2',
          voice: 'Jonas',
        },
      ],
      segments: [
        {
          id: 'seg-001',
          speakerId: 'person_1',
          speaker: 'Person 1',
          startTime: 780,
          endTime: 812,
          text: 'A random variable maps outcomes from the sample space to numerical values.',
        },
        {
          id: 'seg-002',
          speakerId: 'person_2',
          speaker: 'Person 2',
          startTime: 813,
          endTime: 850,
          text: 'The distribution then describes how likely each value or interval is.',
        },
      ],
    },
  },
]

function getSegments(transcription) {
  return transcription.transcription?.segments ?? []
}

function getInitialTime(transcription) {
  return getSegments(transcription)[0]?.startTime ?? 0
}

function getAudioSource(transcription) {
  if (!transcription.audioUrl) {
    return ''
  }

  return audioAssets[transcription.audioUrl] ?? transcription.audioUrl
}

function formatDuration(totalSeconds) {
  const safeSeconds = Math.floor(totalSeconds)
  const minutes = Math.floor(safeSeconds / 60)
  const seconds = safeSeconds % 60

  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function SharedFiles() {
  const audioRef = useRef(null)
  const [selectedId, setSelectedId] = useState(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [shouldAutoPlay, setShouldAutoPlay] = useState(false)

  const selectedTranscription = useMemo(
    () => sharedTranscriptions.find((item) => item.id === selectedId),
    [selectedId],
  )

  const selectedSegments = selectedTranscription ? getSegments(selectedTranscription) : []
  const selectedAudioSource = selectedTranscription ? getAudioSource(selectedTranscription) : ''

  const currentTranscript = selectedSegments.find(
    (segment) => currentTime >= segment.startTime && currentTime <= segment.endTime,
  )

  const progressPercent = selectedTranscription
    ? Math.min((currentTime / selectedTranscription.durationSeconds) * 100, 100)
    : 0

  useEffect(() => {
    const audio = audioRef.current

    if (!audio || !selectedTranscription || !selectedAudioSource) {
      return undefined
    }

    const initialTime = getInitialTime(selectedTranscription)
    audio.currentTime = initialTime
    setCurrentTime(initialTime)

    return undefined
  }, [selectedAudioSource, selectedTranscription])

  useEffect(() => {
    const audio = audioRef.current

    if (!audio || !selectedAudioSource || !shouldAutoPlay) {
      return undefined
    }

    audio.play().catch(() => setIsPlaying(false))
    setShouldAutoPlay(false)

    return undefined
  }, [selectedAudioSource, shouldAutoPlay])

  function handleSelectTranscription(transcription) {
    setSelectedId(transcription.id)
    setCurrentTime(getInitialTime(transcription))
    setIsPlaying(false)
    setShouldAutoPlay(Boolean(getAudioSource(transcription)))
  }

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
    const safeTime = Math.min(Math.max(nextTime, 0), selectedTranscription.durationSeconds)

    setCurrentTime(safeTime)

    if (audio) {
      audio.currentTime = safeTime
    }
  }

  function handleProgressPointerDown(event) {
    if (!selectedAudioSource) {
      return
    }

    const bounds = event.currentTarget.getBoundingClientRect()
    const clickPosition = (event.clientX - bounds.left) / bounds.width

    seekAudio(clickPosition * selectedTranscription.durationSeconds)
  }

  function handleProgressKeyDown(event) {
    if (!selectedAudioSource) {
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

    if (event.key === 'Home') {
      event.preventDefault()
      seekAudio(0)
    }

    if (event.key === 'End') {
      event.preventDefault()
      seekAudio(selectedTranscription.durationSeconds)
    }
  }

  return (
    <section
      id="main-content"
      className={selectedTranscription ? 'shared-files-page has-selection' : 'shared-files-page'}
    >
      <aside className="shared-list-panel" aria-label="Shared transcriptions">
        <p className="eyebrow">Shared files</p>
        <h1>Shared Files</h1>
        <p className="shared-page-intro">
          Review the audios and their transcriptions shared by other students.
        </p>

        <ul className="shared-file-list">
          {sharedTranscriptions.map((transcription) => (
            <li key={transcription.id}>
              <button
                className={
                  selectedId === transcription.id ? 'shared-file-card active' : 'shared-file-card'
                }
                type="button"
                onClick={() => handleSelectTranscription(transcription)}
              >
                <span>
                  <strong>{transcription.title}</strong>
                  <small>
                    {transcription.createdBy} - {transcription.group}
                  </small>
                </span>
                <time>{formatDuration(transcription.durationSeconds)}</time>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {selectedTranscription ? (
        <article className="shared-detail-panel" aria-live="polite">
          <div className="selected-file-header">
            <div>
              <p className="eyebrow">Now reviewing</p>
              <h2>{selectedTranscription.title}</h2>
            </div>
            <button
              className="playback-button"
              type="button"
              disabled={!selectedAudioSource}
              onClick={handleTogglePlayback}
            >
              {isPlaying ? 'Pause' : 'Play'}
            </button>
          </div>

          <div className="audio-progress-card">
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
              aria-valuemax={Math.floor(selectedTranscription.durationSeconds)}
              aria-valuemin={0}
              aria-valuenow={Math.floor(currentTime)}
              aria-valuetext={`${formatDuration(currentTime)} of ${formatDuration(
                selectedTranscription.durationSeconds,
              )}`}
              role="slider"
              style={{ '--progress-thumb-position': `${progressPercent}%` }}
              tabIndex={selectedAudioSource ? 0 : -1}
              onKeyDown={handleProgressKeyDown}
              onPointerDown={handleProgressPointerDown}
            >
              <span style={{ width: `${progressPercent}%` }} />
            </div>
            <p>
              {formatDuration(currentTime)} /{' '}
              {formatDuration(selectedTranscription.durationSeconds)}
            </p>
            {selectedAudioSource ? (
              <audio
                className="audio-player"
                key={selectedTranscription.id}
                preload="metadata"
                ref={audioRef}
                src={selectedAudioSource}
                onEnded={() => setIsPlaying(false)}
                onLoadedMetadata={(event) => {
                  const initialTime = getInitialTime(selectedTranscription)
                  event.currentTarget.currentTime = initialTime
                  setCurrentTime(initialTime)
                }}
                onPause={() => setIsPlaying(false)}
                onPlay={() => {
                  setIsPlaying(true)
                  setShouldAutoPlay(false)
                }}
                onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
              />
            ) : (
              <p className="audio-missing-message">No audio file is connected to this item yet.</p>
            )}
          </div>

          <div className="current-transcript-card">
            <p className="eyebrow">Current transcript</p>
            {currentTranscript ? (
              <blockquote>
                <strong>
                  {currentTranscript.speaker} ({formatDuration(currentTranscript.startTime)}-
                  {formatDuration(currentTranscript.endTime)})
                </strong>
                <span>{currentTranscript.text}</span>
              </blockquote>
            ) : (
              <p>No transcript line is active at this timestamp.</p>
            )}
          </div>

          <div className="transcript-list">
            {selectedSegments.map((segment) => (
              <section
                className={
                  currentTranscript?.id === segment.id ? 'transcript-row active' : 'transcript-row'
                }
                key={segment.id}
              >
                <div>
                  <strong>{segment.speaker}</strong>
                  <time>
                    {formatDuration(segment.startTime)}-{formatDuration(segment.endTime)}
                  </time>
                </div>
                <p>{segment.text}</p>
              </section>
            ))}
          </div>
        </article>
      ) : null}
    </section>
  )
}

export default SharedFiles
