import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')
const distDir = path.join(rootDir, 'dist')
const sourceHtmlPath = path.join(distDir, 'index.html')
const outputHtmlPath = path.join(distDir, 'management.html')

function isRemoteAsset(ref) {
  return /^https?:\/\//i.test(ref) || /^\/\//.test(ref)
}

function mimeByExt(filePath) {
  const ext = path.extname(filePath).toLowerCase()
  return {
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.ico': 'image/x-icon',
    '.js': 'text/javascript',
    '.css': 'text/css'
  }[ext] || 'application/octet-stream'
}

async function toDataUri(filePath) {
  const mime = mimeByExt(filePath)
  const buf = await fs.readFile(filePath)
  return `data:${mime};base64,${buf.toString('base64')}`
}

async function readLocalAsset(ref) {
  const normalized = ref.replace(/^\//, '')
  const candidates = [
    path.join(distDir, normalized),
    path.join(rootDir, normalized),
    path.join(rootDir, 'public', normalized)
  ]

  for (const candidate of candidates) {
    try {
      const stat = await fs.stat(candidate)
      if (stat.isFile()) return candidate
    } catch {}
  }

  return null
}

async function inlineStyles(html) {
  const stylesheetRegex = /<link\s+([^>]*?)rel=["']stylesheet["']([^>]*?)href=["']([^"']+)["']([^>]*)>/gi
  const replacements = await Promise.all(
    [...html.matchAll(stylesheetRegex)].map(async (match) => {
      const assetPath = await readLocalAsset(match[3])
      if (!assetPath) return { from: match[0], to: match[0] }
      const css = await fs.readFile(assetPath, 'utf8')
      return { from: match[0], to: `<style>\n${css}\n</style>` }
    })
  )

  let next = html
  for (const { from, to } of replacements) next = next.replace(from, to)
  return next
}

async function inlineScripts(html) {
  const scriptRegex = /<script\s+([^>]*?)src=["']([^"']+)["']([^>]*)><\/script>/gi
  const replacements = await Promise.all(
    [...html.matchAll(scriptRegex)].map(async (match) => {
      if (isRemoteAsset(match[2])) return { from: match[0], to: match[0] }
      const assetPath = await readLocalAsset(match[2])
      if (!assetPath) return { from: match[0], to: match[0] }
      const dataUri = await toDataUri(assetPath)
      const attrs = `${match[1] || ''} ${match[3] || ''}`.replace(/\s+/g, ' ').trim()
      const cleanedAttrs = attrs
        .replace(/\bcrossorigin\b/g, '')
        .replace(/\ssrc=["'][^"']+["']/g, '')
        .replace(/\s+/g, ' ')
        .trim()
      const attrText = cleanedAttrs ? ` ${cleanedAttrs}` : ''
      return { from: match[0], to: `<script${attrText} src="${dataUri}"></script>` }
    })
  )

  let next = html
  for (const { from, to } of replacements) next = next.replace(from, to)
  return next
}

async function inlineIcons(html) {
  const iconRegex = /<link\s+([^>]*?)href=["']([^"']+)["']([^>]*?)>/gi
  const matches = [...html.matchAll(iconRegex)]
  let next = html

  for (const match of matches) {
    const whole = match[0]
    if (!/rel=["'][^"']*icon/i.test(whole)) continue
    const href = match[2]
    if (isRemoteAsset(href)) continue
    const assetPath = await readLocalAsset(href)
    if (!assetPath) continue
    const dataUri = await toDataUri(assetPath)
    next = next.replace(whole, whole.replace(href, dataUri))
  }

  return next
}

async function removeModulePreloads(html) {
  return html.replace(/<link\s+[^>]*rel=["']modulepreload["'][^>]*>/gi, '')
}

async function main() {
  const original = await fs.readFile(sourceHtmlPath, 'utf8')
  let html = original
  html = await removeModulePreloads(html)
  html = await inlineStyles(html)
  html = await inlineScripts(html)
  html = await inlineIcons(html)
  await fs.writeFile(outputHtmlPath, html, 'utf8')
  console.log(`Generated ${path.relative(rootDir, outputHtmlPath)}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
