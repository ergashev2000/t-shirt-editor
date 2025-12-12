import React, { useCallback, useRef, useEffect } from 'react'
import { Rnd } from 'react-rnd'
import { useCanvas, GRID_SIZE } from './CanvasContext'

// Template konfiguratsiyasi - bu yerda chegara pozitsiyasi va o'lchamlarini o'zgartirish mumkin
const CHEGARA = {
  x: 194,           // Chegaraning chap tomoni (px)
  y: 100,           // Chegaraning yuqori tomoni (px)
  width: 210,       // Chegara kengligi (px)
  height: 310,      // Chegara balandligi (px)
  borderRadius: 0,  // Chegara burchak radiusi (px)
}

const MainCanvas = () => {
  const {
    elements,
    selectedElement,
    setSelectedElement,
    isOutOfBounds,
    setIsOutOfBounds,
    snapToGrid,
    undo,
    redo,
    deleteElement,
    updateElement,
    updateElementWithHistory,
    addElement,
    bringToFront,
    snapBackIfOutside,
    snapToGridValue,
    isPartiallyVisible
  } = useCanvas()

  const canvasRef = useRef<HTMLDivElement>(null)
  const designAreaRef = useRef<HTMLDivElement>(null)

  const handleDragStop = useCallback((id: string, d: { x: number, y: number }) => {
    const element = elements.find(el => el.id === id)
    if (!element) return

    const newX = snapToGridValue(d.x)
    const newY = snapToGridValue(d.y)
    const snapped = snapBackIfOutside(newX, newY, element.width, element.height)

    updateElementWithHistory(id, { x: snapped.x, y: snapped.y })
    setIsOutOfBounds(false)
  }, [elements, snapToGridValue, snapBackIfOutside, updateElementWithHistory, setIsOutOfBounds])

  const handleDrag = useCallback((id: string, d: { x: number, y: number }) => {
    const element = elements.find(el => el.id === id)
    if (!element) return

    // Update element position in real-time during drag
    updateElement(id, { x: d.x, y: d.y })

    const visible = isPartiallyVisible(d.x, d.y, element.width, element.height)
    setIsOutOfBounds(!visible)
  }, [elements, isPartiallyVisible, setIsOutOfBounds, updateElement])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedElement) return

      const element = elements.find(el => el.id === selectedElement)
      if (!element || element.locked) return

      const moveAmount = e.shiftKey ? 10 : 1
      let newX = element.x
      let newY = element.y

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault()
          newY -= moveAmount
          break
        case 'ArrowDown':
          e.preventDefault()
          newY += moveAmount
          break
        case 'ArrowLeft':
          e.preventDefault()
          newX -= moveAmount
          break
        case 'ArrowRight':
          e.preventDefault()
          newX += moveAmount
          break
        case 'Delete':
        case 'Backspace':
          e.preventDefault()
          deleteElement(selectedElement)
          return
        case 'z':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            undo()
          }
          return
        case 'y':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            redo()
          }
          return
        default:
          return
      }

      newX = snapToGridValue(newX)
      newY = snapToGridValue(newY)
      const snapped = snapBackIfOutside(newX, newY, element.width, element.height)
      updateElementWithHistory(selectedElement, { x: snapped.x, y: snapped.y })
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedElement, elements, snapToGridValue, snapBackIfOutside, updateElementWithHistory, deleteElement, undo, redo])

  // Listen for image drops from sidebar
  useEffect(() => {
    const handleDrop = async (e: DragEvent) => {
      e.preventDefault()
      const imageUrl = e.dataTransfer?.getData('text/plain')
      if (imageUrl && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect()
        const x = e.clientX - rect.left - 80
        const y = e.clientY - rect.top - 40
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

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === canvasRef.current || e.target === designAreaRef.current) {
      setSelectedElement(null)
    }
  }, [setSelectedElement])

  return (
    <div className="bg-gray-50 flex flex-col justify-center items-center relative">
      {/* Main Canvas */}
      <div
        ref={canvasRef}
        className="flex-1 relative overflow-hidden bg-white"
        style={{ minHeight: '600px', minWidth: '600px' }}
        data-canvas
        onClick={handleCanvasClick}
      >
        {/* T-shirt Template */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative">
            <img src="./download.png" alt="" className='w-[600px] h-[600px]' />
          </div>
        </div>

        {/* Design Area with clip path for overflow hidden */}
        <div
          ref={designAreaRef}
          className={`absolute transition-colors duration-200 ${isOutOfBounds
            ? 'border-2 border-red-500 border-dashed'
            : 'border-2 border-dashed border-black/30'
            }`}
          style={{
            left: CHEGARA.x,
            top: CHEGARA.y,
            width: CHEGARA.width,
            height: CHEGARA.height,
            overflow: 'hidden',
            borderRadius: `${CHEGARA.borderRadius}px`
          }}
        >
          {/* Grid overlay when snap is enabled */}
          {snapToGrid && (
            <div
              className="absolute inset-0 pointer-events-none opacity-20"
              style={{
                backgroundImage: `
                  linear-gradient(to right, #3b82f6 1px, transparent 1px),
                  linear-gradient(to bottom, #3b82f6 1px, transparent 1px)
                `,
                backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`
              }}
            />
          )}
        </div>

        {/* Clipped content area - elements are clipped to design area */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: CHEGARA.x,
            top: CHEGARA.y,
            width: CHEGARA.width,
            height: CHEGARA.height,
            overflow: 'hidden',
            zIndex: 10
          }}
        >
          {elements
            .sort((a, b) => a.zIndex - b.zIndex)
            .map(element => (
              <div
                key={`clipped-${element.id}`}
                className="absolute pointer-events-none"
                style={{
                  left: element.x - CHEGARA.x,
                  top: element.y - CHEGARA.y,
                  width: element.width,
                  height: element.height
                }}
              >
                {element.type === 'image' ? (
                  <img
                    src={element.content}
                    alt=""
                    className="w-full h-full"
                    draggable={false}
                    style={{
                      transform: `${element.flipH ? 'scaleX(-1)' : ''} ${element.flipV ? 'scaleY(-1)' : ''}`.trim() || 'none'
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-gray-700 font-medium">{element.content}</span>
                  </div>
                )}
              </div>
            ))}
        </div>

        {/* Canvas Elements - Interactive layer (transparent, only for interaction) */}
        {elements
          .sort((a, b) => a.zIndex - b.zIndex)
          .map(element => (
            <Rnd
              key={element.id}
              size={{ width: element.width, height: element.height }}
              position={{ x: element.x, y: element.y }}
              onDrag={(_e, d) => handleDrag(element.id, d)}
              onDragStop={(_e, d) => handleDragStop(element.id, d)}
              minWidth={20}
              minHeight={20}
              disableDragging={element.locked}
              enableResizing={!element.locked ? {
                bottomRight: true,
                bottomLeft: true,
                topRight: true,
                topLeft: true,
                bottom: false,
                top: false,
                left: false,
                right: false
              } : false}
              lockAspectRatio={true}
              className={`${selectedElement === element.id
                ? isOutOfBounds ? 'ring-2 ring-red-500' : 'ring-2 ring-blue-500'
                : 'hover:ring-2 hover:ring-blue-300'
                } ${element.locked ? 'opacity-70' : ''} cursor-move`}
              style={{ zIndex: element.zIndex + 100 }}
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation()
                setSelectedElement(element.id)
                bringToFront(element.id)
              }}

              onResize={(_e, _direction, ref, _delta, position) => {
                const newWidth = ref.offsetWidth
                const newHeight = ref.offsetHeight

                // Update element position and size in real-time
                updateElement(element.id, {
                  width: newWidth,
                  height: newHeight,
                  x: position.x,
                  y: position.y
                })

                // Check if outside design area
                const visible = isPartiallyVisible(position.x, position.y, newWidth, newHeight)
                setIsOutOfBounds(!visible)
              }}

              onResizeStop={(_e, _direction, ref, _delta, position) => {
                const newWidth = ref.offsetWidth
                const newHeight = ref.offsetHeight
                const snapped = snapBackIfOutside(position.x, position.y, newWidth, newHeight)

                updateElementWithHistory(element.id, {
                  width: newWidth,
                  height: newHeight,
                  x: snapped.x,
                  y: snapped.y,
                  aspectRatio: newWidth / newHeight
                })
                setIsOutOfBounds(false)
              }}

              resizeHandleStyles={{
                bottomRight: {
                  width: "14px",
                  height: "14px",
                  background: "#3b82f6",
                  borderRadius: "2px",
                  bottom: "-7px",
                  right: "-7px",
                  cursor: "nwse-resize",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                },
                bottomLeft: {
                  width: "14px",
                  height: "14px",
                  background: "#3b82f6",
                  borderRadius: "2px",
                  bottom: "-7px",
                  left: "-7px",
                  cursor: "nesw-resize",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                },
                topRight: {
                  width: "14px",
                  height: "14px",
                  background: "#3b82f6",
                  borderRadius: "2px",
                  top: "-7px",
                  right: "-7px",
                  cursor: "nesw-resize",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                },
                topLeft: {
                  width: "14px",
                  height: "14px",
                  background: "#3b82f6",
                  borderRadius: "2px",
                  top: "-7px",
                  left: "-7px",
                  cursor: "nwse-resize",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                }
              }}
              resizeHandleComponent={{
                topLeft: <div className="cursor-nwse-resize" />,
                topRight: <div className="cursor-nesw-resize" />,
                bottomLeft: <div className="cursor-nesw-resize" />,
                bottomRight: <div className="cursor-nwse-resize" />
              }}
            >

            </Rnd>
          ))}
        {/* Empty State */}
        {elements.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <div className="text-gray-400 text-lg mb-2">Drop images here</div>
              <div className="text-gray-400 text-sm">or drag from the sidebar</div>
            </div>
          </div>
        )}

        {/* Out of bounds warning */}
        {isOutOfBounds && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium animate-pulse">
            Element outside design area - will snap back on release
          </div>
        )}
      </div>

      {/* Keyboard shortcuts help */}
      <div className="absolute bottom-2 right-2 text-xs text-gray-400 bg-white/80 px-2 py-1 rounded">
        Arrow keys: Move • Shift+Arrow: Move faster • Delete: Remove • Ctrl+Z/Y: Undo/Redo
      </div>
    </div>
  )
}

export default MainCanvas
