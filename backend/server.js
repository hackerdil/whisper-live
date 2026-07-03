import { createReadStream } from 'node:fs'
import { mkdir, readFile, rename, stat, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const host = process.env.APP_API_HOST || '127.0.0.1'
const port = Number(process.env.APP_API_PORT || 8787)
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const sharedDataPath = path.join(projectRoot, 'docs', 'shared-transcriptions.json')
const sharedAudioDirectory = path.join(projectRoot, 'docs', 'audio', 'shared')
const maxBodySize = 75 * 1024 * 1024

const audioTypes = {
  '.flac': 'audio/flac',
  '.m4a': 'audio/mp4',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
  '.webm': 'audio/webm',
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json; charset=utf-8',
  })
  response.end(JSON.stringify(payload))
}

async function readSharedTranscriptions() {
  try {
    return JSON.parse(await readFile(sharedDataPath, 'utf8'))
  } catch (error) {
    if (error.code === 'ENOENT') {
      return []
    }
    throw error
  }
}

async function writeSharedTranscriptions(transcriptions) {
  const temporaryPath = `${sharedDataPath}.tmp`

  await mkdir(path.dirname(sharedDataPath), { recursive: true })
  await writeFile(temporaryPath, `${JSON.stringify(transcriptions, null, 2)}\n`)
  await rename(temporaryPath, sharedDataPath)
}

async function readJsonBody(request) {
  const chunks = []
  let receivedBytes = 0

  for await (const chunk of request) {
    receivedBytes += chunk.length

    if (receivedBytes > maxBodySize) {
      throw new Error('The shared transcription is too large.')
    }

    chunks.push(chunk)
  }

  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

function sanitizeFilename(value) {
  return value.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'audio'
}

function getAudioExtension(audio) {
  const suppliedExtension = path.extname(audio.name ?? '').toLowerCase()

  if (audioTypes[suppliedExtension]) {
    return suppliedExtension
  }

  return Object.entries(audioTypes).find(([, type]) => type === audio.type)?.[0] ?? '.webm'
}

async function saveSharedAudio(resultId, audio) {
  const extension = getAudioExtension(audio)
  const filename = `${sanitizeFilename(resultId)}-${Date.now()}${extension}`

  await mkdir(sharedAudioDirectory, { recursive: true })
  await writeFile(path.join(sharedAudioDirectory, filename), Buffer.from(audio.base64, 'base64'))

  return `/api/shared-audio/${encodeURIComponent(filename)}`
}

async function handleShare(request, response) {
  const payload = await readJsonBody(request)
  const transcription = payload.transcription

  if (
    !transcription?.id ||
    !transcription?.title ||
    !Array.isArray(transcription.transcription?.segments)
  ) {
    sendJson(response, 400, { error: 'A valid transcription is required.' })
    return
  }

  const sharedTranscriptions = await readSharedTranscriptions()
  const previousVersion = sharedTranscriptions.find(
    (item) => String(item.id) === String(transcription.id),
  )
  const { runtimeAudioUrl: _runtimeAudioUrl, ...cleanTranscription } = transcription
  const sharedTranscription = {
    ...cleanTranscription,
    id: String(cleanTranscription.id),
    audioUrl: cleanTranscription.audioUrl || previousVersion?.audioUrl || '',
    sharedAt: new Date().toISOString(),
    sharedBy: payload.sharedBy || cleanTranscription.createdBy || 'User',
  }

  if (payload.audio?.base64) {
    sharedTranscription.audioUrl = await saveSharedAudio(sharedTranscription.id, payload.audio)
  }

  const nextTranscriptions = [
    sharedTranscription,
    ...sharedTranscriptions.filter(
      (item) => String(item.id) !== String(sharedTranscription.id),
    ),
  ]

  await writeSharedTranscriptions(nextTranscriptions)
  sendJson(response, 201, sharedTranscription)
}

async function handleSharedAudio(request, response) {
  const encodedFilename = request.url.slice('/api/shared-audio/'.length)
  const filename = path.basename(decodeURIComponent(encodedFilename))
  const audioPath = path.join(sharedAudioDirectory, filename)
  const audioStat = await stat(audioPath)

  response.writeHead(200, {
    'Access-Control-Allow-Origin': '*',
    'Content-Length': audioStat.size,
    'Content-Type': audioTypes[path.extname(filename).toLowerCase()] || 'application/octet-stream',
  })
  createReadStream(audioPath).pipe(response)
}

const server = createServer(async (request, response) => {
  try {
    if (request.method === 'OPTIONS') {
      response.writeHead(204, {
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Origin': '*',
      })
      response.end()
      return
    }

    if (request.method === 'GET' && request.url === '/api/health') {
      sendJson(response, 200, { status: 'ok' })
      return
    }

    if (request.method === 'GET' && request.url === '/api/shared-transcriptions') {
      sendJson(response, 200, await readSharedTranscriptions())
      return
    }

    if (request.method === 'POST' && request.url === '/api/shared-transcriptions') {
      await handleShare(request, response)
      return
    }

    if (request.method === 'GET' && request.url.startsWith('/api/shared-audio/')) {
      await handleSharedAudio(request, response)
      return
    }

    sendJson(response, 404, { error: 'Not found.' })
  } catch (error) {
    console.error(error)
    sendJson(response, error.code === 'ENOENT' ? 404 : 500, {
      error: error.message || 'The application backend could not complete the request.',
    })
  }
})

server.listen(port, host, () => {
  console.log(`Whisper Notes backend listening on http://${host}:${port}`)
})
