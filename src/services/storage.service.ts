/**
 * =====================================================
 * SERVICIO: Storage (Supabase Storage)
 * =====================================================
 * Maneja la subida y eliminación de imágenes de tareas
 * en el bucket "task-images" de Supabase Storage
 * =====================================================
 */

import { supabase } from '@/lib/supabase'

const BUCKET_NAME = 'task-images'

/**
 * Sube una imagen al bucket de Supabase Storage
 * @param file Archivo a subir
 * @param taskId ID de la tarea asociada
 * @returns URL pública de la imagen
 */
export async function uploadTaskImage(file: File, taskId: string): Promise<string> {
  const ext = file.name.split('.').pop() || 'png'
  const fileName = `${taskId}/${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) throw error

  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(fileName)

  return urlData.publicUrl
}

/**
 * Elimina una imagen del bucket por su URL pública
 */
export async function deleteTaskImage(imageUrl: string): Promise<void> {
  // Extraer el path del archivo desde la URL pública
  // URL format: https://<project>.supabase.co/storage/v1/object/public/task-images/<path>
  const bucketPath = `${BUCKET_NAME}/`
  const index = imageUrl.indexOf(bucketPath)
  if (index === -1) return

  const filePath = imageUrl.substring(index + bucketPath.length)

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([filePath])

  if (error) {
    console.error('[deleteTaskImage] Error:', error)
    throw error
  }
}

/**
 * Elimina todas las imágenes de una tarea
 */
export async function deleteTaskImages(taskId: string): Promise<void> {
  const { data: files, error: listError } = await supabase.storage
    .from(BUCKET_NAME)
    .list(taskId)

  if (listError) {
    console.error('[deleteTaskImages] Error listing:', listError)
    return
  }

  if (!files || files.length === 0) return

  const filePaths = files.map(f => `${taskId}/${f.name}`)

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove(filePaths)

  if (error) {
    console.error('[deleteTaskImages] Error removing:', error)
    throw error
  }
}
