const APP_API_URL = import.meta.env?.VITE_APP_API_URL?.trim().replace(/\/+$/, '') || ''

function getApiUrl(pathname) {
  return `${APP_API_URL}${pathname}`
}

async function readError(response) {
  try {
    const payload = await response.json()
    return payload.error
  } catch {
    return null
  }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.addEventListener('load', () => {
      resolve(String(reader.result).split(',')[1] ?? '')
    })
    reader.addEventListener('error', () => {
      reject(new Error('The audio file could not be prepared for sharing.'))
    })
    reader.readAsDataURL(file)
  })
}

export async function getSharedTranscriptions({ signal } = {}) {
  const response = await fetch(getApiUrl('/api/shared-transcriptions'), { signal })

  if (!response.ok) {
    throw new Error((await readError(response)) || 'Shared files could not be loaded.')
  }

  return response.json()
}

export async function shareTranscription({ audioFile, sharedBy, transcription }) {
  const { runtimeAudioUrl: _runtimeAudioUrl, ...serializableTranscription } = transcription
  const audio = audioFile
    ? {
        base64: await fileToBase64(audioFile),
        name: audioFile.name,
        type: audioFile.type,
      }
    : null
  const response = await fetch(getApiUrl('/api/shared-transcriptions'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      audio,
      sharedBy,
      transcription: serializableTranscription,
    }),
  })

  if (!response.ok) {
    throw new Error((await readError(response)) || 'The transcription could not be shared.')
  }

  return response.json()
}
