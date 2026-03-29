import sharp from 'sharp'
import path from 'path'

const imagePath = path.resolve('/vercel/share/v0-project/frontend/public/images/background-1.png')

const metadata = await sharp(imagePath).metadata()
console.log(`Width: ${metadata.width}px`)
console.log(`Height: ${metadata.height}px`)
console.log(`Aspect ratio: ${(metadata.width / metadata.height).toFixed(4)}`)

// Trim the image to detect content bounds (removes black bars)
const trimmed = await sharp(imagePath)
  .trim({ background: '#000000', threshold: 10 })
  .toBuffer({ resolveWithObject: true })

console.log(`Trimmed width: ${trimmed.info.width}px`)
console.log(`Trimmed height: ${trimmed.info.height}px`)
console.log(`Top offset: ${trimmed.info.trimOffsetTop}px`)
console.log(`Left offset: ${trimmed.info.trimOffsetLeft}px`)
