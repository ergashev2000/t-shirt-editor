import React, { useState, useCallback, useRef } from 'react'
import { Rnd } from 'react-rnd'
import { Trash2, Lock, Unlock } from 'lucide-react'
import { resizeHandleStyles } from './helpers'

interface CanvasElement {
  id: string
  type: 'image' | 'text'
  content: string
  x: number
  y: number
  width: number
  height: number
  zIndex: number
  locked?: boolean
}

const MainCanvas = () => {
  const [elements, setElements] = useState<CanvasElement[]>([])
  const [selectedElement, setSelectedElement] = useState<string | null>(null)
  const [view, setView] = useState<'front' | 'back'>('front')
  const [maxZIndex, setMaxZIndex] = useState(1)
  const canvasRef = useRef<HTMLDivElement>(null)
  const canvasElementRef = useRef<HTMLCanvasElement>(null)

  // Helper function to get image dimensions
  const getImageDimensions = useCallback((src: string): Promise<{ width: number, height: number }> => {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        resolve({ width: img.width, height: img.height })
      }
      img.onerror = () => {
        // Fallback size if image fails to load
        resolve({ width: 200, height: 200 })
      }
      img.src = src
    })
  }, [])

  // Optimized canvas rendering
  const renderCanvas = useCallback(() => {
    const canvas = canvasElementRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw t-shirt template
    const img = new Image()
    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

      // Draw design area overlay
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)'
      ctx.setLineDash([5, 5])
      ctx.strokeRect(
        canvas.width / 2 - 96,
        canvas.height / 2 - 128,
        192,
        256
      )
    }
    img.src = './download.png'
  }, [])

  // Initialize canvas
  React.useEffect(() => {
    const canvas = canvasElementRef.current
    if (!canvas) return

    // Set canvas size
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    renderCanvas()

    // Handle resize
    const handleResize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      renderCanvas()
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [renderCanvas])

  // Initialize with default image and its actual dimensions
  React.useEffect(() => {
    const initializeDefaultImage = async () => {
      const defaultImageUrl = 'https://ajmall-vc-public-bucket.oss-us-west-1.aliyuncs.com/hugepod/material/ai_template_image/img_0061.png'
      const dimensions = await getImageDimensions(defaultImageUrl)

      // Scale image to 300px width while maintaining aspect ratio
      const targetWidth = 160
      const aspectRatio = dimensions.width / dimensions.height
      const scaledHeight = targetWidth / aspectRatio

      const defaultElement: CanvasElement = {
        id: '1',
        type: 'image',
        content: defaultImageUrl,
        x: 150,
        y: 100,
        width: targetWidth,
        height: scaledHeight,
        zIndex: 1,
        locked: false,
      }

      setElements([defaultElement])
    }

    initializeDefaultImage()
  }, [getImageDimensions])

  const updateElement = useCallback((id: string, updates: Partial<CanvasElement>) => {
    setElements(prev => prev.map(el =>
      el.id === id ? { ...el, ...updates } : el
    ))
  }, [])

  const deleteElement = useCallback((id: string) => {
    setElements(prev => prev.filter(el => el.id !== id))
    if (selectedElement === id) {
      setSelectedElement(null)
    }
  }, [selectedElement])

  const addElement = useCallback(async (type: 'image' | 'text', content: string, position?: { x: number, y: number }) => {
    let width = 200
    let height = 200

    if (type === 'image') {
      // Get actual image dimensions and scale to 160px width
      const dimensions = await getImageDimensions(content)
      const targetWidth = 160
      const aspectRatio = dimensions.width / dimensions.height
      width = targetWidth
      height = targetWidth / aspectRatio
    } else {
      // Text elements keep default size
      width = 200
      height = 50
    }

    // Position: use provided position for drag-drop, otherwise center
    let finalPosition = { x: 400, y: 300 }

    if (position) {
      // Drag-drop: use the drop position
      finalPosition = position
    } else {
      // Click: center in canvas
      const canvas = canvasRef.current
      if (canvas) {
        const rect = canvas.getBoundingClientRect()
        finalPosition = {
          x: (rect.width - width) / 2,
          y: (rect.height - height) / 2
        }
      }
    }

    const newElement: CanvasElement = {
      id: Date.now().toString(),
      type,
      content,
      x: finalPosition.x,
      y: finalPosition.y,
      width,
      height,
      zIndex: maxZIndex + 1,
      locked: false
    }
    setElements(prev => [...prev, newElement])
    setMaxZIndex(prev => prev + 1)
    setSelectedElement(newElement.id)
  }, [maxZIndex, getImageDimensions])

  const bringToFront = useCallback((id: string) => {
    const newZIndex = maxZIndex + 1
    updateElement(id, { zIndex: newZIndex })
    setMaxZIndex(newZIndex)
  }, [maxZIndex, updateElement])

  const toggleLock = useCallback((id: string) => {
    setElements(prev => prev.map(el =>
      el.id === id ? { ...el, locked: !el.locked } : el
    ))
  }, [])

  const handleDragStop = useCallback((id: string, d: { x: number, y: number }) => {
    updateElement(id, { x: d.x, y: d.y })
  }, [updateElement])

  // Listen for image drops from sidebar
  React.useEffect(() => {
    const handleDrop = async (e: DragEvent) => {
      e.preventDefault()
      const imageUrl = e.dataTransfer?.getData('text/plain')
      if (imageUrl && canvasRef.current) {
        // Get drop position relative to canvas
        const rect = canvasRef.current.getBoundingClientRect()
        const x = e.clientX - rect.left - 80 // Offset to center image (160px width / 2)
        const y = e.clientY - rect.top - 40  // Offset to center image (estimated height / 2)

        await addElement('image', imageUrl, { x, y })
      }
    }

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault()
    }

    const canvas = canvasRef.current
    if (canvas) {
      canvas.addEventListener('drop', handleDrop)
      canvas.addEventListener('dragover', handleDragOver)
    }

    return () => {
      if (canvas) {
        canvas.removeEventListener('drop', handleDrop)
        canvas.removeEventListener('dragover', handleDragOver)
      }
    }
  }, [addElement])

  return (
    <div className="h-[calc(100%-var(--header-height))] bg-gray-50 flex flex-col">
      {/* View Switcher */}
      <div className="flex justify-center gap-4 p-4 border-b border-gray-200">
        <button
          onClick={() => setView('front')}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${view === 'front'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
        >
          Front
        </button>
        <button
          onClick={() => setView('back')}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${view === 'back'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
        >
          Back
        </button>
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="flex-1 relative overflow-hidden bg-white"
        data-canvas
      >
        {/* T-shirt Template */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative">
            {/* T-shirt SVG */}
            <img src="./download.png" alt="" />

            {/* Design area overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-48 h-64 border-2 border-dashed border-black/30 rounded" />
            </div>
          </div>
        </div>

        {/* Canvas Elements */}
        {elements
          .filter(el => !el.locked)
          .sort((a, b) => a.zIndex - b.zIndex)
          .map(element => (
            <Rnd
              key={element.id}
              size={{ width: element.width, height: element.height }}
              position={{ x: element.x, y: element.y }}
              onDragStop={(_e, d) => handleDragStop(element.id, d)}
              bounds="parent"
              minWidth={30}
              minHeight={30}
              disableDragging={element.locked}
              className={`${selectedElement === element.id ? 'ring-2 ring-blue-500' : ''}`}
              onClick={() => {
                setSelectedElement(element.id)
                bringToFront(element.id)
              }}

              /* -----------------------------------------
                 🔥  LIVE RESIZE (real-time, smooth)
              ------------------------------------------*/
              onResize={(e, direction, ref, delta) => {
                const aspect = element.width / element.height

                let newW = ref.offsetWidth
                let newH = ref.offsetHeight
                let newX = element.x
                let newY = element.y

                const isCorner =
                  direction === "topLeft" ||
                  direction === "topRight" ||
                  direction === "bottomLeft" ||
                  direction === "bottomRight"

                if (isCorner) {
                  // --------------------------
                  // 🔥 CORNER = PROPORTIONAL
                  // --------------------------
                  // Calculate new dimensions maintaining aspect ratio
                  if (delta.width !== 0) {
                    newH = newW / aspect
                  } else if (delta.height !== 0) {
                    newW = newH * aspect
                  }

                  // Adjust position to keep image centered on the opposite corner
                  if (direction === "topLeft") {
                    newX = element.x + (element.width - newW)
                    newY = element.y + (element.height - newH)
                  }
                  if (direction === "topRight") {
                    newY = element.y + (element.height - newH)
                  }
                  if (direction === "bottomLeft") {
                    newX = element.x + (element.width - newW)
                  }
                  // bottomRight doesn't need position adjustment

                } else {
                  // --------------------------
                  // 🔥 SIDE HANDLES (ONE DIRECTION)
                  // --------------------------

                  // LEFT / RIGHT → only width changes, height stays the same
                  if (direction === "left" || direction === "right") {
                    newH = element.height
                  }

                  // TOP / BOTTOM → only height changes, width stays the same
                  if (direction === "top" || direction === "bottom") {
                    newW = element.width
                  }

                  // Adjust position to keep opposite side fixed
                  if (direction === "left") {
                    newX = element.x + (element.width - newW)
                  }
                  if (direction === "top") {
                    newY = element.y + (element.height - newH)
                  }
                  // right and bottom don't need position adjustment
                }

                updateElement(element.id, {
                  width: newW,
                  height: newH,
                  x: newX,
                  y: newY
                })
              }}

              /* -----------------------------------------
                 🔥 FINAL UPDATE (mouseup)
              ------------------------------------------*/
              onResizeStop={(e, direction, ref, delta, position) => {
                updateElement(element.id, {
                  width: ref.offsetWidth,
                  height: ref.offsetHeight,
                  x: position.x,
                  y: position.y
                })
              }}

              resizeHandleStyles={resizeHandleStyles}
              resizeHandleComponent={{
                topLeft: <div className="cursor-nw-resize" />,
                topRight: <div className="cursor-ne-resize" />,
                bottomLeft: <div className="cursor-sw-resize" />,
                bottomRight: <div className="cursor-se-resize" />,

                // SIDE HANDLES — faqat bir yo‘nalishda resize bo‘ladi
                top: <div className="cursor-n-resize" />,
                bottom: <div className="cursor-s-resize" />,
                left: <div className="cursor-w-resize" />,
                right: <div className="cursor-e-resize" />,
              }}

            >
              <div className="w-full h-full relative group">
                {element.type === 'image' ? (
                  <img
                    src={element.content}
                    alt="Canvas element"
                    className="w-full h-full pointer-events-none"
                    draggable={false}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-transparent border-2 border-gray-300 rounded">
                    <span className="text-gray-700 font-medium pointer-events-none">
                      {element.content}
                    </span>
                  </div>
                )}

                {/* Controls */}
                {selectedElement === element.id && (
                  <div className="absolute -top-10 left-0 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleLock(element.id)
                      }}
                      className="bg-white p-1 rounded shadow-md hover:bg-gray-100"
                    >
                      {element.locked ? <Lock size={14} /> : <Unlock size={14} />}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteElement(element.id)
                      }}
                      className="bg-red-500 p-1 rounded shadow-md hover:bg-red-600 text-white"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            </Rnd>

          ))}

        {/* Empty State */}
        {elements.filter(el => !el.locked).length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <div className="text-gray-400 text-lg mb-2">Drop images here</div>
              <div className="text-gray-400 text-sm">or drag from the sidebar</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MainCanvas
