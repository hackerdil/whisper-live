import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const vitePath = path.join(projectRoot, 'node_modules', 'vite', 'bin', 'vite.js')
const children = [
  spawn(process.execPath, ['backend/server.js'], {
    cwd: projectRoot,
    stdio: 'inherit',
  }),
  spawn(process.execPath, [vitePath], {
    cwd: projectRoot,
    stdio: 'inherit',
  }),
]
let shuttingDown = false

function stopChildren(signal = 'SIGTERM') {
  if (shuttingDown) {
    return
  }

  shuttingDown = true
  children.forEach((child) => {
    if (!child.killed) {
      child.kill(signal)
    }
  })
}

children.forEach((child) => {
  child.on('exit', (code) => {
    if (!shuttingDown && code !== 0) {
      stopChildren()
      process.exitCode = code || 1
    }
  })
})

process.on('SIGINT', () => {
  stopChildren('SIGINT')
})

process.on('SIGTERM', () => {
  stopChildren('SIGTERM')
})
