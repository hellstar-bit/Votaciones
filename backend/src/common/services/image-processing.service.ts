// src/common/services/image-processing.service.ts
import { Injectable } from '@nestjs/common'
import * as sharp from 'sharp'
import * as path from 'path'
import * as fs from 'fs'

@Injectable()
export class ImageProcessingService {
  
  /**
   * Procesa una imagen: redimensiona, optimiza y convierte a formato estándar
   */
  async processImage(inputPath: string, outputDir: string, filename: string): Promise<string> {
    try {
      // Generar nombre del archivo procesado
      const processedFilename = `${path.parse(filename).name}-processed.jpg`
      const outputPath = path.join(outputDir, processedFilename)

      // Procesar imagen con Sharp
      await sharp(inputPath)
        .resize(400, 400, {
          fit: 'cover',
          position: 'center',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .jpeg({
          quality: 85,
          progressive: true
        })
        .toFile(outputPath)

      // Eliminar archivo original
      if (fs.existsSync(inputPath)) {
        await fs.promises.unlink(inputPath)
        console.log(`🗑️ Archivo original eliminado: ${inputPath}`)
      }

      console.log(`✅ Imagen procesada: ${outputPath}`)
      return processedFilename

    } catch (error) {
      console.error('❌ Error procesando imagen:', error)
      throw new Error(`Error procesando imagen: ${error.message}`)
    }
  }

  /**
   * Genera múltiples tamaños de una imagen (thumbnails)
   */
  async generateThumbnails(inputPath: string, outputDir: string, filename: string): Promise<{ thumbnail: string, medium: string, large: string }> {
    try {
      const baseName = path.parse(filename).name
      
      // Tamaños a generar
      const sizes = [
        { name: 'thumbnail', width: 100, height: 100 },
        { name: 'medium', width: 200, height: 200 },
        { name: 'large', width: 400, height: 400 }
      ]

      const results = {}

      for (const size of sizes) {
        const outputFilename = `${baseName}-${size.name}.jpg`
        const outputPath = path.join(outputDir, outputFilename)

        await sharp(inputPath)
          .resize(size.width, size.height, {
            fit: 'cover',
            position: 'center'
          })
          .jpeg({ quality: 85 })
          .toFile(outputPath)

        results[size.name] = outputFilename
      }

      // Eliminar archivo original
      if (fs.existsSync(inputPath)) {
        await fs.promises.unlink(inputPath)
      }

      return results as { thumbnail: string, medium: string, large: string }

    } catch (error) {
      console.error('❌ Error generando thumbnails:', error)
      throw new Error(`Error generando thumbnails: ${error.message}`)
    }
  }

  /**
   * Valida si un archivo es realmente una imagen válida
   */
  async validateImageContent(filePath: string): Promise<boolean> {
    try {
      const metadata = await sharp(filePath).metadata()
      return !!(metadata.format && metadata.width && metadata.height)
    } catch (error) {
      console.error('❌ Archivo no es una imagen válida:', error)
      return false
    }
  }
}