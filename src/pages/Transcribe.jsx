import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  DEFAULT_WHISPERLIVE_URL,
  transcribeAudio,
} from '../services/transcriptionApi.js'
import {
  createTranscriptionResult,
  saveGeneratedResult,
} from '../services/transcriptionResults.js'

const ENGINES = [
  {
    id: 'whisperlive',
    name: 'WhisperLive (Local)',
    tagline: 'Runs on your own machine through the free WhisperLive REST API.',
  },
  {
    id: 'api',
    name: 'Cloud API',
    tagline: 'Sends audio to a hosted Whisper service over the internet.',
  },
]

const WHISPERLIVE_MODELS = ['whisper-1']

const API_PROVIDERS = [
  {
    id: 'openai',
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com',
    models: ['whisper-1', 'gpt-4o-transcribe', 'gpt-4o-mini-transcribe'],
  },
  {
    id: 'groq',
    name: 'Groq',
    baseUrl: 'https://api.groq.com/openai',
    models: ['whisper-large-v3', 'whisper-large-v3-turbo', 'distil-whisper-large-v3-en'],
  },
  {
    id: 'custom',
    name: 'Custom endpoint',
    baseUrl: '',
    models: ['whisper-large-v3', 'whisper-medium', 'whisper-small'],
  },
]

const LANGUAGES = [
  { code: 'auto', label: 'Auto-detect' },
  { code: 'en', label: 'English' },
  { code: 'de', label: 'German' },
  { code: 'tr', label: 'Turkish' },
  { code: 'fr', label: 'French' },
  { code: 'es', label: 'Spanish' },
]

const ACCEPTED_AUDIO = 'audio/*,.mp3,.wav,.m4a,.ogg,.flac,.webm'

function formatBytes(bytes) {
  if (!bytes) {
    return '0 B'
  }

  const units = ['B', 'KB', 'MB', 'GB']
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** exponent

  return `${value.toFixed(value >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`
}

function formatClock(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function Transcribe({ user }) {
  const fileInputRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const recordTimerRef = useRef(null)
  const requestControllerRef = useRef(null)

  const [sourceMode, setSourceMode] = useState('upload')
  const [audioFile, setAudioFile] = useState(null)
  const [audioUrl, setAudioUrl] = useState('')
  const [isDragging, setIsDragging] = useState(false)

  const [isRecording, setIsRecording] = useState(false)
  const [recordSeconds, setRecordSeconds] = useState(0)
  const [recordError, setRecordError] = useState('')

  const [engine, setEngine] = useState('whisperlive')
  const [whisperLiveUrl, setWhisperLiveUrl] = useState(DEFAULT_WHISPERLIVE_URL)
  const [whisperLiveModel, setWhisperLiveModel] = useState(WHISPERLIVE_MODELS[0])
  const [apiProvider, setApiProvider] = useState(API_PROVIDERS[0].id)
  const [apiModel, setApiModel] = useState(API_PROVIDERS[0].models[0])
  const [apiKey, setApiKey] = useState('')
  const [apiEndpoint, setApiEndpoint] = useState('')

  const [language, setLanguage] = useState('auto')
  const [title, setTitle] = useState('')
  const [timestamps, setTimestamps] = useState(true)

  const [status, setStatus] = useState('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [completedResultId, setCompletedResultId] = useState('')

  const activeProvider = API_PROVIDERS.find((provider) => provider.id === apiProvider)

  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
      }
      window.clearInterval(recordTimerRef.current)
      requestControllerRef.current?.abort()
    }
  }, [audioUrl])

  function applyAudioFile(file) {
    if (!file) {
      return
    }

    setAudioUrl((previousUrl) => {
      if (previousUrl) {
        URL.revokeObjectURL(previousUrl)
      }
      return URL.createObjectURL(file)
    })
    setAudioFile(file)
    setStatus('idle')
    setErrorMessage('')
    setCompletedResultId('')

    if (!title) {
      setTitle(file.name.replace(/\.[^.]+$/, ''))
    }
  }

  function handleFileChange(event) {
    applyAudioFile(event.target.files?.[0] ?? null)
  }

  function handleDrop(event) {
    event.preventDefault()
    setIsDragging(false)
    applyAudioFile(event.dataTransfer.files?.[0] ?? null)
  }

  function clearAudio() {
    setAudioUrl((previousUrl) => {
      if (previousUrl) {
        URL.revokeObjectURL(previousUrl)
      }
      return ''
    })
    setAudioFile(null)
    setStatus('idle')
    setErrorMessage('')
    setCompletedResultId('')

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  async function startRecording() {
    setRecordError('')

    if (!navigator.mediaDevices?.getUserMedia) {
      setRecordError('Recording is not supported in this browser.')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      const chunks = []

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data)
        }
      }

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' })
        const recordedFile = new File([blob], `recording-${Date.now()}.webm`, {
          type: blob.type,
        })

        applyAudioFile(recordedFile)
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorderRef.current = recorder
      recorder.start()
      setIsRecording(true)
      setRecordSeconds(0)

      recordTimerRef.current = window.setInterval(() => {
        setRecordSeconds((current) => current + 1)
      }, 1000)
    } catch {
      setRecordError('Microphone access was blocked. Check your browser permissions.')
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop()
    window.clearInterval(recordTimerRef.current)
    setIsRecording(false)
  }

  function handleSourceModeChange(nextMode) {
    if (isRecording) {
      stopRecording()
    }
    setSourceMode(nextMode)
  }

  function handleProviderChange(nextProviderId) {
    const provider = API_PROVIDERS.find((item) => item.id === nextProviderId)
    setApiProvider(nextProviderId)
    setApiModel(provider?.models[0] ?? '')
  }

  const configReady =
    engine === 'whisperlive'
      ? Boolean(whisperLiveUrl && whisperLiveModel)
      : Boolean(apiKey && apiModel && (apiProvider !== 'custom' || apiEndpoint))

  const canTranscribe = Boolean(audioFile) && configReady && status !== 'running'

  async function handleTranscribe(event) {
    event.preventDefault()

    if (!canTranscribe) {
      return
    }

    setStatus('running')
    setErrorMessage('')
    setCompletedResultId('')
    requestControllerRef.current?.abort()

    const controller = new AbortController()
    requestControllerRef.current = controller

    try {
      const response = await transcribeAudio({
        apiKey: engine === 'api' ? apiKey : '',
        baseUrl:
          engine === 'whisperlive'
            ? whisperLiveUrl
            : apiProvider === 'custom'
              ? apiEndpoint
              : activeProvider?.baseUrl,
        file: audioFile,
        language,
        model: engine === 'whisperlive' ? whisperLiveModel : apiModel,
        signal: controller.signal,
      })
      const result = createTranscriptionResult({
        createdBy: user?.name,
        includeTimestamps: timestamps,
        language,
        response,
        title,
      })

      saveGeneratedResult(result, audioFile)
      setCompletedResultId(result.id)
      setStatus('done')
    } catch (error) {
      if (error.name !== 'AbortError') {
        setErrorMessage(error.message)
        setStatus('error')
      }
    } finally {
      if (requestControllerRef.current === controller) {
        requestControllerRef.current = null
      }
    }
  }

  return (
    <section id="main-content" className="transcribe-page">
      <form className="transcribe-workspace" onSubmit={handleTranscribe}>
        <header className="transcribe-header">
          <p className="eyebrow">Create a note</p>
          <h1>Transcribe</h1>
          <p className="transcribe-intro">
            Upload a file or record audio, choose a transcription engine, and turn spoken words
            into organized notes.
          </p>
        </header>

        <section className="transcribe-card" aria-label="Audio source">
          <div className="transcribe-card-head">
            <h2>1 &middot; Audio source</h2>
            <div className="source-toggle" role="tablist" aria-label="Choose audio source">
              <button
                type="button"
                role="tab"
                aria-selected={sourceMode === 'upload'}
                className={sourceMode === 'upload' ? 'source-tab active' : 'source-tab'}
                onClick={() => handleSourceModeChange('upload')}
              >
                Upload file
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={sourceMode === 'record'}
                className={sourceMode === 'record' ? 'source-tab active' : 'source-tab'}
                onClick={() => handleSourceModeChange('record')}
              >
                Record audio
              </button>
            </div>
          </div>

          {sourceMode === 'upload' ? (
            <div
              className={isDragging ? 'dropzone dragging' : 'dropzone'}
              onDragOver={(event) => {
                event.preventDefault()
                setIsDragging(true)
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                id="audio-file"
                className="visually-hidden"
                type="file"
                accept={ACCEPTED_AUDIO}
                onChange={handleFileChange}
              />
              <p className="dropzone-title">Drag &amp; drop an audio file</p>
              <p className="dropzone-hint">MP3, WAV, M4A, OGG, FLAC or WEBM</p>
              <label className="ghost-button" htmlFor="audio-file">
                Browse files
              </label>
            </div>
          ) : (
            <div className="record-panel">
              <div className={isRecording ? 'record-indicator live' : 'record-indicator'}>
                <span className="record-dot" aria-hidden="true" />
                <span className="record-clock">{formatClock(recordSeconds)}</span>
              </div>
              <button
                type="button"
                className={isRecording ? 'record-button stop' : 'record-button'}
                onClick={isRecording ? stopRecording : startRecording}
              >
                {isRecording ? 'Stop recording' : 'Start recording'}
              </button>
              {recordError ? <p className="field-error">{recordError}</p> : null}
            </div>
          )}

          {audioFile ? (
            <div className="audio-summary">
              <div className="audio-summary-info">
                <strong>{audioFile.name}</strong>
                <small>{formatBytes(audioFile.size)}</small>
              </div>
              {audioUrl ? <audio controls src={audioUrl} className="audio-preview" /> : null}
              <button type="button" className="link-button" onClick={clearAudio}>
                Remove
              </button>
            </div>
          ) : (
            <p className="no-audio-note">No audio selected yet.</p>
          )}
        </section>

        <section className="transcribe-card" aria-label="Transcription details">
          <div className="transcribe-card-head">
            <h2>3 &middot; Details</h2>
          </div>

          <div className="field-grid">
            <label className="field">
              <span>Note title</span>
              <input
                type="text"
                placeholder="e.g. BWL Lecture - Week 5"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </label>

            <label className="field">
              <span>Language</span>
              <select value={language} onChange={(event) => setLanguage(event.target.value)}>
                {LANGUAGES.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="option-row">
            <label className="checkbox">
              <input
                type="checkbox"
                checked={timestamps}
                onChange={(event) => setTimestamps(event.target.checked)}
              />
              <span>Include timestamps</span>
            </label>
            <label className="checkbox">
              <input type="checkbox" checked={false} disabled readOnly />
              <span>Detect speakers (planned: reference clips required)</span>
            </label>
          </div>
        </section>

        <div className="transcribe-actions">
          <button type="submit" className="primary-button" disabled={!canTranscribe}>
            {status === 'running' ? 'Transcribing…' : 'Start transcription'}
          </button>
          {!audioFile ? (
            <p className="action-hint">Add an audio source to continue.</p>
          ) : !configReady ? (
            <p className="action-hint">Finish the engine setup to continue.</p>
          ) : null}
        </div>

        {status === 'running' ? (
          <section className="run-status" aria-busy="true" aria-live="polite">
            <div className="run-status-head">
              <span>
                Transcribing with{' '}
                {engine === 'whisperlive' ? 'WhisperLive' : activeProvider?.name}…
              </span>
              <span>Please wait</span>
            </div>
            <div className="run-progress-track indeterminate">
              <span />
            </div>
          </section>
        ) : null}

        {status === 'error' ? (
          <section className="run-status error" aria-live="assertive">
            <p className="run-done-title">Transcription could not be completed</p>
            <p className="run-done-text">{errorMessage}</p>
          </section>
        ) : null}

        {status === 'done' ? (
          <section className="run-status done" aria-live="polite">
            <p className="run-done-title">Transcription complete</p>
            <p className="run-done-text">
              The audio was processed successfully and the generated note is ready in Results.
            </p>
            <Link to={`/results?file=${completedResultId}`} className="ghost-button">
              Go to Results
            </Link>
          </section>
        ) : null}
      </form>

      <aside className="transcribe-engine" aria-label="Transcription engine">
        <p className="eyebrow">2 &middot; Engine</p>
        <h2>Choose a model</h2>
        <p className="engine-intro">Pick where the transcription runs.</p>

        <div className="engine-options">
          {ENGINES.map((item) => (
            <label
              key={item.id}
              className={engine === item.id ? 'engine-option active' : 'engine-option'}
            >
              <input
                type="radio"
                name="engine"
                value={item.id}
                checked={engine === item.id}
                onChange={() => setEngine(item.id)}
              />
              <span className="engine-option-name">{item.name}</span>
              <span className="engine-option-tagline">{item.tagline}</span>
            </label>
          ))}
        </div>

        {engine === 'whisperlive' ? (
          <div className="engine-fields">
            <label className="field">
              <span>WhisperLive REST URL</span>
              <input
                type="url"
                placeholder="http://localhost:8000"
                value={whisperLiveUrl}
                onChange={(event) => setWhisperLiveUrl(event.target.value)}
              />
            </label>
            <label className="field">
              <span>API model</span>
              <select
                value={whisperLiveModel}
                onChange={(event) => setWhisperLiveModel(event.target.value)}
              >
                {WHISPERLIVE_MODELS.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
            </label>
            <p className="engine-note">
              Start WhisperLive with its REST API on port 8000 before transcribing. The server
              selects the local Whisper model.
            </p>
          </div>
        ) : (
          <div className="engine-fields">
            <label className="field">
              <span>Provider</span>
              <select
                value={apiProvider}
                onChange={(event) => handleProviderChange(event.target.value)}
              >
                {API_PROVIDERS.map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.name}
                  </option>
                ))}
              </select>
            </label>

            {apiProvider === 'custom' ? (
              <label className="field">
                <span>API endpoint</span>
                <input
                  type="text"
                  placeholder="https://api.example.com/v1/audio/transcriptions"
                  value={apiEndpoint}
                  onChange={(event) => setApiEndpoint(event.target.value)}
                />
              </label>
            ) : null}

            <label className="field">
              <span>Model</span>
              <select value={apiModel} onChange={(event) => setApiModel(event.target.value)}>
                {activeProvider?.models.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>API key</span>
              <input
                type="password"
                placeholder="sk-…"
                autoComplete="off"
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
              />
            </label>
            <p className="engine-note">
              The key is sent directly to the selected provider and is not stored. A secure backend
              proxy is recommended for production.
            </p>
          </div>
        )}
      </aside>
    </section>
  )
}

export default Transcribe
