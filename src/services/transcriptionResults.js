const LEGACY_STORAGE_KEY = 'whisper-generated-results'
const STORAGE_KEY_PREFIX = 'whisper-generated-results:'
const runtimeAudioUrls = new Map()
const runtimeAudioFiles = new Map()

export function normalizeUsername(username) {
  return username.trim().replace(/\s+/g, ' ').toLocaleLowerCase()
}

function getStorageKey(username) {
  return `${STORAGE_KEY_PREFIX}${encodeURIComponent(normalizeUsername(username))}`
}

function readStoredResults(username) {
  try {
    const scopedResults = JSON.parse(localStorage.getItem(getStorageKey(username))) ?? []

    if (scopedResults.length > 0) {
      return scopedResults
    }

    const legacyResults = JSON.parse(sessionStorage.getItem(LEGACY_STORAGE_KEY)) ?? []
    return legacyResults.filter(
      (result) => normalizeUsername(result.createdBy ?? '') === normalizeUsername(username),
    )
  } catch {
    return []
  }
}

function getSegmentTimes(segment, fallbackEnd) {
  const startTime = Number(segment.start ?? segment.startTime ?? 0)
  const endTime = Number(segment.end ?? segment.endTime ?? fallbackEnd ?? startTime)

  return {
    startTime: Number.isFinite(startTime) ? startTime : 0,
    endTime: Number.isFinite(endTime) ? endTime : startTime,
  }
}

export function createTranscriptionResult({
  createdBy,
  includeTimestamps = true,
  language,
  response,
  title,
}) {
  const responseDuration = Number(response.duration)
  const rawSegments = response.segments?.length
    ? response.segments
    : [
        {
          id: 0,
          start: 0,
          end: Number.isFinite(responseDuration) ? responseDuration : 0,
          text: response.text,
        },
      ]
  const speakers = new Map()

  const segments = rawSegments.map((segment, index) => {
    const speakerLabel = segment.speaker || 'Speaker 1'

    if (!speakers.has(speakerLabel)) {
      speakers.set(speakerLabel, `speaker_${speakers.size + 1}`)
    }

    const times = getSegmentTimes(segment, responseDuration)

    return {
      id: String(segment.id ?? `generated-segment-${index + 1}`),
      speakerId: speakers.get(speakerLabel),
      speaker: speakerLabel,
      startTime: times.startTime,
      endTime: times.endTime,
      text: String(segment.text ?? '').trim(),
    }
  })
  const lastSegmentEnd = Math.max(0, ...segments.map((segment) => segment.endTime))
  const durationSeconds =
    Number.isFinite(responseDuration) && responseDuration > 0 ? responseDuration : lastSegmentEnd

  return {
    id: `generated-${Date.now()}`,
    title: title.trim() || 'Untitled transcription',
    group: 'Personal',
    audioUrl: '',
    durationSeconds,
    language: response.language || (language === 'auto' ? 'unknown' : language),
    createdAt: new Date().toISOString(),
    createdBy: createdBy || 'User',
    settings: {
      includeTimestamps,
    },
    transcription: {
      status: 'completed',
      speakers: Array.from(speakers, ([label, id]) => ({ id, label })),
      segments,
    },
  }
}

export function saveGeneratedResult(result, audioFile) {
  const storedResults = readStoredResults(result.createdBy)
  const nextResults = [result, ...storedResults.filter((item) => item.id !== result.id)].slice(0, 5)

  localStorage.setItem(getStorageKey(result.createdBy), JSON.stringify(nextResults))

  if (audioFile) {
    runtimeAudioUrls.set(result.id, URL.createObjectURL(audioFile))
    runtimeAudioFiles.set(result.id, audioFile)
  }
}

export function getGeneratedResults(username) {
  return readStoredResults(username).map((result) => ({
    ...result,
    runtimeAudioUrl: runtimeAudioUrls.get(result.id) ?? '',
  }))
}

export function getGeneratedResultAudioFile(resultId) {
  return runtimeAudioFiles.get(resultId) ?? null
}
