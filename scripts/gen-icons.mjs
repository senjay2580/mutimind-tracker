// One-shot: generate PWA PNG icons from public/favicon.svg
// Run: node scripts/gen-icons.mjs
import sharp from 'sharp'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PUBLIC = resolve(__dirname, '../public')

const svg = readFileSync(resolve(PUBLIC, 'favicon.svg'))

const targets = [
  { size: 192, file: 'icon-192.png' },
  { size: 512, file: 'icon-512.png' },
  { size: 180, file: 'apple-touch-icon.png' },
  { size: 32,  file: 'favicon-32.png' }
]

for (const { size, file } of targets) {
  await sharp(svg, { density: 384 })
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toFile(resolve(PUBLIC, file))
  console.log(`✓ ${file} (${size}x${size})`)
}

// Maskable: pad inner content to 80% to leave safe area for OS masks
const maskable = await sharp({
  create: {
    width: 512,
    height: 512,
    channels: 4,
    background: { r: 37, g: 99, b: 235, alpha: 1 } // blue-600 base
  }
})
  .composite([{ input: await sharp(svg, { density: 384 }).resize(380, 380).png().toBuffer(), gravity: 'center' }])
  .png({ compressionLevel: 9 })
  .toFile(resolve(PUBLIC, 'icon-512-maskable.png'))
console.log('✓ icon-512-maskable.png (512x512, maskable safe area)')
