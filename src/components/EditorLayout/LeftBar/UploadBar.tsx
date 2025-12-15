import React, { useState, useRef, useCallback } from 'react'
import { Upload, X, Image as ImageIcon } from 'lucide-react'

interface UploadedImage {
  id: string
  url: string
  name: string
  file: File
}

export default function UploadBar() {
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Convert file to data URL
  const fileToDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  // Handle file upload
  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files) return

    const imageFiles = Array.from(files).filter(file => 
      file.type.startsWith('image/')
    )

    const newImages: UploadedImage[] = []
    for (const file of imageFiles) {
      try {
        const url = await fileToDataURL(file)
        newImages.push({
          id: `${Date.now()}-${Math.random()}`,
          url,
          name: file.name,
          file
        })
      } catch (error) {
        console.error('Error reading file:', error)
      }
    }

    setUploadedImages(prev => [...newImages, ...prev])
  }, [])

  // Handle drag events
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.currentTarget === e.target) {
      setIsDragging(false)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  // Handle file input change
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files)
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [handleFiles])

  // Handle click on upload area
  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  // Remove image from list
  const handleRemoveImage = useCallback((id: string) => {
    setUploadedImages(prev => prev.filter(img => img.id !== id))
  }, [])

  // Handle drag start for canvas
  const handleImageDragStart = useCallback((e: React.DragEvent, imageUrl: string) => {
    e.dataTransfer.setData('text/plain', imageUrl)
  }, [])

  return (
    <div className="h-full flex flex-col">
      {/* Upload Area */}
      <div 
        className={`m-3 border-2 border-dashed rounded-lg transition-colors cursor-pointer ${
          isDragging 
            ? 'border-violet-500 bg-violet-50' 
            : 'border-gray-300 hover:border-violet-400 hover:bg-gray-50'
        }`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleUploadClick}
      >
        <div className="p-8 flex flex-col items-center justify-center text-center">
          <Upload className={`w-12 h-12 mb-3 ${isDragging ? 'text-violet-500' : 'text-gray-400'}`} />
          <p className="text-sm font-medium text-gray-700 mb-1">
            {isDragging ? 'Rasmni shu yerga tashlang' : 'Rasm yuklash'}
          </p>
          <p className="text-xs text-gray-500">
            Bosing yoki rasm tortib olib keling
          </p>
          <p className="text-xs text-gray-400 mt-2">
            PNG, JPG, GIF, WEBP
          </p>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* Uploaded Images List */}
      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {uploadedImages.length > 0 ? (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-700 mb-2 sticky top-0 bg-white py-2">
              Yuklangan rasmlar ({uploadedImages.length})
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {uploadedImages.map((image) => (
                <div
                  key={image.id}
                  className="group relative cursor-move rounded-lg overflow-hidden border border-gray-200 hover:border-violet-400 transition-colors"
                  draggable
                  onDragStart={(e) => handleImageDragStart(e, image.url)}
                >
                  <img
                    src={image.url}
                    alt={image.name}
                    className="w-full h-32 object-cover transition-transform group-hover:scale-105"
                  />
                  {/* Remove button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemoveImage(image.id)
                    }}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    title="O'chirish"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  {/* Image name */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                    <p className="text-xs text-white truncate">
                      {image.name}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <ImageIcon className="w-16 h-16 mb-3 opacity-30" />
            <p className="text-sm">Hali rasm yuklanmagan</p>
            <p className="text-xs mt-1">Yuqoridan rasm yuklang</p>
          </div>
        )}
      </div>
    </div>
  )
}
