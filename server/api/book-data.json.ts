import fs from 'node:fs'
import path from 'node:path'

export default defineEventHandler((event) => {
  const publicPagesDir = path.resolve(process.cwd(), 'public/pages')
  const publicCoverDir = path.resolve(process.cwd(), 'public/cover')
  
  const pages = fs.existsSync(publicPagesDir) ? fs.readdirSync(publicPagesDir) : []
  const covers = fs.existsSync(publicCoverDir) ? fs.readdirSync(publicCoverDir) : []

  // Filter for image extensions
  const isImage = (file: string) => /\.(jpg|jpeg|png|webp)$/i.test(file)

  return {
    pages: pages.filter(isImage),
    covers: covers.filter(isImage)
  }
})
