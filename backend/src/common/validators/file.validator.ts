//src/common/validators/file.validator.ts
import { BadRequestException } from '@nestjs/common'
import * as fs from 'fs'

export class FileValidator {
  static validateImageFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('No se ha proporcionado ningún archivo')
    }

    // Validar tamaño
    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('El archivo no debe superar los 5MB')
    }

    // Validar tipo MIME
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException('Solo se permiten archivos de imagen (JPG, PNG, GIF, WEBP)')
    }

    // Validar extensión
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
    const fileExtension = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf('.'))
    if (!allowedExtensions.includes(fileExtension)) {
      throw new BadRequestException('Extensión de archivo no permitida')
    }
  }

  static async deleteFile(filePath: string): Promise<void> {
    try {
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath)
        console.log(`🗑️ Archivo eliminado: ${filePath}`)
      }
    } catch (error) {
      console.error(`❌ Error eliminando archivo ${filePath}:`, error)
    }
  }
}