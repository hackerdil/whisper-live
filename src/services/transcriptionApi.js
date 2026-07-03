export const DEFAULT_WHISPERLIVE_URL =
  import.meta.env?.VITE_WHISPERLIVE_URL?.trim() || 'http://localhost:8000'

function getTranscriptionEndpoint(baseUrl) {
  const normalizedUrl = baseUrl.trim().replace(/\/+$/, '')

  if (!normalizedUrl) {
    throw new Error('Enter a WhisperLive REST server URL.')
  }

  let parsedUrl

  try {
    parsedUrl = new URL(normalizedUrl)
  } catch {
    throw new Error('Enter a valid WhisperLive REST server URL.')
  }

  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    throw new Error('The WhisperLive URL must use HTTP or HTTPS.')
  }

  if (parsedUrl.pathname.endsWith('/v1/audio/transcriptions')) {
    return parsedUrl.toString()
  }

  parsedUrl.pathname = `${parsedUrl.pathname.replace(/\/+$/, '')}/v1/audio/transcriptions`
  return parsedUrl.toString()
}

async function getErrorMessage(response) {
  try {
    const payload = await response.json()
    return payload.error?.message || payload.error || payload.detail
  } catch {
    return null
  }
}

export async function transcribeAudio({
  apiKey = '',
  baseUrl,
  file,
  language = 'auto',
  model = 'whisper-1',
  signal,
}) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('model', model)
  formData.append('response_format', 'verbose_json')

  if (language !== 'auto') {
    formData.append('language', language)
  }

  let response

  try {
    response = await fetch(getTranscriptionEndpoint(baseUrl), {
      method: 'POST',
      headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : undefined,
      body: formData,
      signal,
    })
  } catch (error) {
    if (error.name === 'AbortError') {
      throw error
    }

    throw new Error(
      'Could not reach the transcription server. Check that it is running and allows this app through CORS.',
    )
  }

  if (!response.ok) {
    const serverMessage = await getErrorMessage(response)
    throw new Error(serverMessage || `Transcription failed with status ${response.status}.`)
  }

  const result = await response.json()

  if (!result.text && !result.segments?.length) {
    throw new Error('The transcription server returned an empty result.')
  }

  return result
}
