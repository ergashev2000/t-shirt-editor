import React, { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu'
import {
  RefreshCw,
  Lock,
  Unlock,
  Trash2,
  MoreHorizontal,
  Copy,
  Layers,
  ArrowUp,
  ArrowDown,
  ChevronsUp,
  ChevronsDown,
  Move,
  RotateCcw,
  Crop,
  Eraser,
} from 'lucide-react'
import { useCanvas } from './CanvasContext'
import type { CanvasElement } from './CanvasContext'

interface ElementToolbarProps {
  element: CanvasElement
  position: { x: number; y: number }
}

const ElementToolbar: React.FC<ElementToolbarProps> = ({ element, position }) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const {
    deleteElement,
    updateElementWithHistory,
    duplicateElement,
    toggleLock,
    centerElement,
    elements,
    updateElement,
    setSelectedElement,
    removeBackground,
    isRemovingBg,
    removingBgElementId,
    startCropping,
    isCropping,
  } = useCanvas()

  // Check if this element is being processed for bg removal
  const isElementProcessing = removingBgElementId === element.id

  const handleReplace = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && element.type === 'image') {
      const reader = new FileReader()
      reader.onload = (event) => {
        const newContent = event.target?.result as string

        // Yangi rasmning o'lchamlarini olish
        const img = new Image()
        img.onload = () => {
          const newAspectRatio = img.width / img.height
          // Eski width saqlanadi, yangi height aspect ratio asosida hisoblanadi
          const newHeight = element.width / newAspectRatio

          updateElementWithHistory(element.id, {
            content: newContent,
            height: newHeight,
            aspectRatio: newAspectRatio
          })
        }
        img.src = newContent
      }
      reader.readAsDataURL(file)
    }
    e.target.value = ''
  }

  const handleBringForward = () => {
    const sortedElements = [...elements].sort((a, b) => a.zIndex - b.zIndex)
    const currentIndex = sortedElements.findIndex(el => el.id === element.id)
    if (currentIndex < sortedElements.length - 1) {
      const nextElement = sortedElements[currentIndex + 1]
      updateElement(element.id, { zIndex: nextElement.zIndex + 1 })
    }
  }

  const handleSendBackward = () => {
    const sortedElements = [...elements].sort((a, b) => a.zIndex - b.zIndex)
    const currentIndex = sortedElements.findIndex(el => el.id === element.id)
    if (currentIndex > 0) {
      const prevElement = sortedElements[currentIndex - 1]
      updateElement(element.id, { zIndex: prevElement.zIndex - 1 })
    }
  }

  const handleBringToFront = () => {
    const maxZIndex = Math.max(...elements.map(el => el.zIndex))
    updateElement(element.id, { zIndex: maxZIndex + 1 })
  }

  const handleSendToBack = () => {
    const minZIndex = Math.min(...elements.map(el => el.zIndex))
    updateElement(element.id, { zIndex: minZIndex - 1 })
  }

  const handleResetRotation = () => {
    updateElementWithHistory(element.id, { rotation: 0 })
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <div
        className="absolute z-1000 flex items-center gap-1 bg-white rounded-lg shadow-lg border border-gray-200 px-2 py-1.5"
        style={{
          left: position.x,
          top: position.y,
          transform: 'translateX(-50%)',
        }}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Image-specific buttons */}
        {element.type === 'image' && (
          <>
            {/* Replace button */}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 gap-1.5 text-gray-700 hover:text-gray-900"
              onClick={handleReplace}
              disabled={isElementProcessing}
            >
              <RefreshCw className="h-4 w-4" />
              <span className="text-xs">Replace</span>
            </Button>

            {/* Remove BG button */}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 gap-1.5 text-gray-700 hover:text-gray-900"
              onClick={removeBackground}
              disabled={isRemovingBg}
              title="Background o'chirish"
            >
              {isRemovingBg ? (
                <div className="h-4 w-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
              ) : (
                <Eraser className="h-4 w-4" />
              )}
              <span>
                {isRemovingBg ? 'Removing...' : 'Remove BG'}
              </span>
            </Button>

            {/* Crop button */}
            <Button
              variant="ghost"
              size="sm"
              className={`h-8 px-2 gap-1.5 ${isCropping ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:text-gray-900'}`}
              onClick={startCropping}
              disabled={isElementProcessing}
              title="Crop"
            >
              <Crop className="h-4 w-4" />
            </Button>

            <Separator orientation="vertical" className="h-5" />
          </>
        )}

        <Separator orientation="vertical" className="h-5" />

        {/* Lock/Unlock */}
        <Button
          variant="ghost"
          size="icon-sm"
          className={`h-8 w-8 ${element.locked ? 'text-blue-600' : 'text-gray-700 hover:text-gray-900'}`}
          onClick={toggleLock}
          disabled={isElementProcessing}
          title={element.locked ? 'Qulfni ochish' : 'Qulflash'}
        >
          {element.locked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
        </Button>

        {/* Delete */}
        <Button
          variant="ghost"
          size="icon-sm"
          className="h-8 w-8 text-gray-700 hover:text-red-600"
          onClick={() => deleteElement(element.id)}
          disabled={isElementProcessing}
          title="O'chirish"
        >
          <Trash2 className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-5" />

        {/* More options dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="h-8 w-8 text-gray-700 hover:text-gray-900"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {/* Duplicate */}
            <DropdownMenuItem onClick={duplicateElement}>
              <Copy className="h-4 w-4 mr-2" />
              Nusxa olish
            </DropdownMenuItem>

            {/* Center */}
            <DropdownMenuItem onClick={centerElement}>
              <Move className="h-4 w-4 mr-2" />
              Markazlashtirish
            </DropdownMenuItem>

            {/* Reset rotation */}
            {element.rotation !== 0 && (
              <DropdownMenuItem onClick={handleResetRotation}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Aylanishni tiklash
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />

            {/* Layer submenu */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Layers className="h-4 w-4 mr-2" />
                Qatlamlar
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={handleBringToFront}>
                  <ChevronsUp className="h-4 w-4 mr-2" />
                  Eng oldinga
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleBringForward}>
                  <ArrowUp className="h-4 w-4 mr-2" />
                  Oldinga
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSendBackward}>
                  <ArrowDown className="h-4 w-4 mr-2" />
                  Orqaga
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSendToBack}>
                  <ChevronsDown className="h-4 w-4 mr-2" />
                  Eng orqaga
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuSeparator />

            {/* Delete */}
            <DropdownMenuItem
              onClick={() => {
                deleteElement(element.id)
                setSelectedElement(null)
              }}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              O'chirish
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  )
}

export default ElementToolbar
