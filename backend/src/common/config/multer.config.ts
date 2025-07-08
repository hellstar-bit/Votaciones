// src/common/config/multer.config.ts
import { diskStorage } from 'multer'
import { extname, join } from 'path'
import { v4 as uuidv4 } from 'uuid'

// Configuración de almacenamiento para fotos de candidatos
export const candidatePhotoStorage = diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = join(process.cwd(), 'uploads', 'candidates')
    cb(null, uploadPath)
  },
  filename: (req, file, cb) => {
    // Generar nombre único: documento-uuid.ext
    const documento = req.body.numero_documento || 'unknown'
    const uniqueId = uuidv4()
    const extension = extname(file.originalname)
    const filename = `${documento}-${uniqueId}${extension}`
    cb(null, filename)
  }
})

// Filtro para validar tipos de archivo
export const imageFileFilter = (req: any, file: any, callback: any) => {
  // Solo permitir imágenes
  if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
    return callback(new Error('Solo se permiten archivos de imagen (JPG, PNG, GIF, WEBP)'), false)
  }
  callback(null, true)
}

// Límites de archivo
export const fileUploadLimits = {
  fileSize: 5 * 1024 * 1024, // 5MB máximo
  files: 1, // Solo un archivo por vez
}
