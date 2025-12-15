import React, { useCallback, useRef, useState, useEffect } from 'react'
import { useCanvas } from './CanvasContext'

type CropHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'

interface CropOverlayProps {
  element: {
    id: string
    x: number
    y: number
    width: number
    height: number
    rotation?: number
    content: string
  }
}

const CropOverlay: React.FC<CropOverlayProps> = ({ element }) => {
  const { cropBox, setCropBox } = useCanvas()
  const [isDragging, setIsDragging] = useState(false)
  const [activeHandle, setActiveHandle] = useState<CropHandle | null>(null)
  const [isMoving, setIsMoving] = useState(false)
  
  const dragStartRef = useRef<{
    mouseX: number
    mouseY: number
    cropX: number
    cropY: number
    cropWidth: number
    cropHeight: number
  } | null>(null)

  const handleMouseDown = useCallback((e: React.MouseEvent, handle: CropHandle) => {
    e.stopPropagation()
    e.preventDefault()
    if (!cropBox) return

    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      cropX: cropBox.x,
      cropY: cropBox.y,
      cropWidth: cropBox.width,
      cropHeight: cropBox.height
    }
    setActiveHandle(handle)
    setIsDragging(true)
  }, [cropBox])

  const handleMoveStart = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    if (!cropBox) return

    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      cropX: cropBox.x,
      cropY: cropBox.y,
      cropWidth: cropBox.width,
      cropHeight: cropBox.height
    }
    setIsMoving(true)
  }, [cropBox])

  useEffect(() => {
    if (!isDragging && !isMoving) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStartRef.current || !cropBox) return

      const deltaX = e.clientX - dragStartRef.current.mouseX
      const deltaY = e.clientY - dragStartRef.current.mouseY
      const { cropX, cropY, cropWidth, cropHeight } = dragStartRef.current

      if (isMoving) {
        // Move the entire crop box
        let newX = cropX + deltaX
        let newY = cropY + deltaY

        // Constrain to element bounds
        newX = Math.max(0, Math.min(element.width - cropWidth, newX))
        newY = Math.max(0, Math.min(element.height - cropHeight, newY))

        setCropBox({ x: newX, y: newY, width: cropWidth, height: cropHeight })
        return
      }

      let newCropX = cropX
      let newCropY = cropY
      let newCropWidth = cropWidth
      let newCropHeight = cropHeight

      const minSize = 20

      switch (activeHandle) {
        case 'nw':
          newCropX = Math.max(0, Math.min(cropX + cropWidth - minSize, cropX + deltaX))
          newCropY = Math.max(0, Math.min(cropY + cropHeight - minSize, cropY + deltaY))
          newCropWidth = cropX + cropWidth - newCropX
          newCropHeight = cropY + cropHeight - newCropY
          break
        case 'ne':
          newCropY = Math.max(0, Math.min(cropY + cropHeight - minSize, cropY + deltaY))
          newCropWidth = Math.max(minSize, Math.min(element.width - cropX, cropWidth + deltaX))
          newCropHeight = cropY + cropHeight - newCropY
          break
        case 'sw':
          newCropX = Math.max(0, Math.min(cropX + cropWidth - minSize, cropX + deltaX))
          newCropWidth = cropX + cropWidth - newCropX
          newCropHeight = Math.max(minSize, Math.min(element.height - cropY, cropHeight + deltaY))
          break
        case 'se':
          newCropWidth = Math.max(minSize, Math.min(element.width - cropX, cropWidth + deltaX))
          newCropHeight = Math.max(minSize, Math.min(element.height - cropY, cropHeight + deltaY))
          break
        case 'n':
          newCropY = Math.max(0, Math.min(cropY + cropHeight - minSize, cropY + deltaY))
          newCropHeight = cropY + cropHeight - newCropY
          break
        case 's':
          newCropHeight = Math.max(minSize, Math.min(element.height - cropY, cropHeight + deltaY))
          break
        case 'w':
          newCropX = Math.max(0, Math.min(cropX + cropWidth - minSize, cropX + deltaX))
          newCropWidth = cropX + cropWidth - newCropX
          break
        case 'e':
          newCropWidth = Math.max(minSize, Math.min(element.width - cropX, cropWidth + deltaX))
          break
      }

      setCropBox({ x: newCropX, y: newCropY, width: newCropWidth, height: newCropHeight })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      setIsMoving(false)
      setActiveHandle(null)
      dragStartRef.current = null
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, isMoving, activeHandle, cropBox, element.width, element.height, setCropBox])

  if (!cropBox) return null

  const handleSize = 10

  const handles: { type: CropHandle; style: React.CSSProperties; cursor: string }[] = [
    { type: 'nw', style: { top: -handleSize / 2, left: -handleSize / 2 }, cursor: 'nwse-resize' },
    { type: 'ne', style: { top: -handleSize / 2, right: -handleSize / 2 }, cursor: 'nesw-resize' },
    { type: 'se', style: { bottom: -handleSize / 2, right: -handleSize / 2 }, cursor: 'nwse-resize' },
    { type: 'sw', style: { bottom: -handleSize / 2, left: -handleSize / 2 }, cursor: 'nesw-resize' },
    { type: 'n', style: { top: -handleSize / 2, left: '50%', transform: 'translateX(-50%)' }, cursor: 'ns-resize' },
    { type: 's', style: { bottom: -handleSize / 2, left: '50%', transform: 'translateX(-50%)' }, cursor: 'ns-resize' },
    { type: 'e', style: { top: '50%', right: -handleSize / 2, transform: 'translateY(-50%)' }, cursor: 'ew-resize' },
    { type: 'w', style: { top: '50%', left: -handleSize / 2, transform: 'translateY(-50%)' }, cursor: 'ew-resize' },
  ]

  return (
    <div
      className="absolute inset-0"
      style={{
        transform: `rotate(${element.rotation || 0}deg)`,
        transformOrigin: 'center center'
      }}
    >
      {/* Dark overlay outside crop area */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top */}
        <div
          className="absolute bg-black/50"
          style={{
            top: 0,
            left: 0,
            right: 0,
            height: cropBox.y
          }}
        />
        {/* Bottom */}
        <div
          className="absolute bg-black/50"
          style={{
            bottom: 0,
            left: 0,
            right: 0,
            height: element.height - cropBox.y - cropBox.height
          }}
        />
        {/* Left */}
        <div
          className="absolute bg-black/50"
          style={{
            top: cropBox.y,
            left: 0,
            width: cropBox.x,
            height: cropBox.height
          }}
        />
        {/* Right */}
        <div
          className="absolute bg-black/50"
          style={{
            top: cropBox.y,
            right: 0,
            width: element.width - cropBox.x - cropBox.width,
            height: cropBox.height
          }}
        />
      </div>

      {/* Crop box */}
      <div
        className="absolute border-2 border-white cursor-move"
        style={{
          left: cropBox.x,
          top: cropBox.y,
          width: cropBox.width,
          height: cropBox.height,
          boxShadow: '0 0 0 1px rgba(0,0,0,0.5)'
        }}
        onMouseDown={handleMoveStart}
      >
        {/* Grid lines */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-0 right-0 h-px bg-white/50" />
          <div className="absolute top-2/3 left-0 right-0 h-px bg-white/50" />
          <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/50" />
          <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/50" />
        </div>

        {/* Resize handles - purple/violet like reference */}
        {handles.map(({ type, style, cursor }) => {
          const isCorner = ['nw', 'ne', 'se', 'sw'].includes(type)
          return (
            <div
              key={type}
              className={`absolute ${isCorner ? 'rounded-full' : 'rounded-sm'}`}
              style={{
                width: isCorner ? 12 : 8,
                height: isCorner ? 12 : 8,
                backgroundColor: '#8b5cf6',
                border: '2px solid white',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                cursor,
                ...style
              }}
              onMouseDown={(e) => handleMouseDown(e, type)}
            />
          )
        })}
      </div>
    </div>
  )
}

export default CropOverlay
