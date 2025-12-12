import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { Rnd } from 'react-rnd'
import { 
  Trash2, 
  Lock, 
  Unlock, 
  AlignCenter, 
  FlipHorizontal, 
  FlipVertical, 
  Eraser,
  Undo2,
  Redo2,
  Grid3X3
} from 'lucide-react'
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
  flipH?: boolean
  flipV?: boolean
  aspectRatio?: number
}

// Design area configuration (centered in 700x700 canvas)
const CANVAS_SIZE = 700
const DESIGN_AREA = {
  x: (CANVAS_SIZE - 192) / 2,
  y: (CANVAS_SIZE - 256) / 2,
  width: 192,
  height: 256
}

// Grid snap size
const GRID_SIZE = 10

// History state for undo/redo
interface HistoryState {
  elements: CanvasElement[]
  selectedElement: string | null
}

const MainCanvas = () => {
  const [elements, setElements] = useState<CanvasElement[]>([])
  const [selectedElement, setSelectedElement] = useState<string | null>(null)
  const [maxZIndex, setMaxZIndex] = useState(1)
  const [snapToGrid, setSnapToGrid] = useState(false)
  const [isOutOfBounds, setIsOutOfBounds] = useState(false)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  
  const canvasRef = useRef<HTMLDivElement>(null)
  const designAreaRef = useRef<HTMLDivElement>(null)
  const historyRef = useRef<HistoryState[]>([])
  const historyIndexRef = useRef(-1)
  const isInitialized = useRef(false)

  // Update undo/redo button states
  const updateHistoryButtons = useCallback(() => {
    setCanUndo(historyIndexRef.current > 0)
    setCanRedo(historyIndexRef.current < historyRef.current.length - 1)
  }, [])

  // Save to history
  const saveToHistory = useCallback((newElements: CanvasElement[], newSelected: string | null) => {
    const newState: HistoryState = { 
      elements: JSON.parse(JSON.stringify(newElements)), 
      selectedElement: newSelected 
    }
    historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1)
    historyRef.current.push(newState)
    historyIndexRef.current = historyRef.current.length - 1
    updateHistoryButtons()
  }, [updateHistoryButtons])

  // Undo
  const undo = useCallback(() => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current -= 1
      const prevState = historyRef.current[historyIndexRef.current]
      setElements(prevState.elements)
      setSelectedElement(prevState.selectedElement)
      updateHistoryButtons()
    }
  }, [updateHistoryButtons])

  // Redo
  const redo = useCallback(() => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current += 1
      const nextState = historyRef.current[historyIndexRef.current]
      setElements(nextState.elements)
      setSelectedElement(nextState.selectedElement)
      updateHistoryButtons()
    }
  }, [updateHistoryButtons])

  // Helper function to get image dimensions
  const getImageDimensions = useCallback((src: string): Promise<{ width: number, height: number }> => {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        resolve({ width: img.width, height: img.height })
      }
      img.onerror = () => {
        resolve({ width: 200, height: 200 })
      }
      img.src = src
    })
  }, [])

  // Check if element is within design area bounds
  const checkBounds = useCallback((x: number, y: number, width: number, height: number): boolean => {
    return (
      x >= DESIGN_AREA.x &&
      y >= DESIGN_AREA.y &&
      x + width <= DESIGN_AREA.x + DESIGN_AREA.width &&
      y + height <= DESIGN_AREA.y + DESIGN_AREA.height
    )
  }, [])

  // Constrain position to design area
  const constrainToDesignArea = useCallback((x: number, y: number, width: number, height: number) => {
    let newX = x
    let newY = y

    // Snap back to nearest valid position
    if (x < DESIGN_AREA.x) newX = DESIGN_AREA.x
    if (y < DESIGN_AREA.y) newY = DESIGN_AREA.y
    if (x + width > DESIGN_AREA.x + DESIGN_AREA.width) {
      newX = DESIGN_AREA.x + DESIGN_AREA.width - width
    }
    if (y + height > DESIGN_AREA.y + DESIGN_AREA.height) {
      newY = DESIGN_AREA.y + DESIGN_AREA.height - height
    }

    // If element is larger than design area, center it
    if (width > DESIGN_AREA.width) {
      newX = DESIGN_AREA.x + (DESIGN_AREA.width - width) / 2
    }
    if (height > DESIGN_AREA.height) {
      newY = DESIGN_AREA.y + (DESIGN_AREA.height - height) / 2
    }

    return { x: newX, y: newY }
  }, [])

  // Snap to grid
  const snapToGridValue = useCallback((value: number): number => {
    if (!snapToGrid) return value
    return Math.round(value / GRID_SIZE) * GRID_SIZE
  }, [snapToGrid])

  // Initialize with default image (runs only once)
  useEffect(() => {
    if (isInitialized.current) return
    isInitialized.current = true

    const initializeDefaultImage = async () => {
      const defaultImageUrl = 'https://ajmall-vc-public-bucket.oss-us-west-1.aliyuncs.com/hugepod/material/ai_template_image/img_0061.png'
      const dimensions = await getImageDimensions(defaultImageUrl)

      const targetWidth = 160
      const aspectRatio = dimensions.width / dimensions.height
      const scaledHeight = targetWidth / aspectRatio

      const x = DESIGN_AREA.x + (DESIGN_AREA.width - targetWidth) / 2
      const y = DESIGN_AREA.y + (DESIGN_AREA.height - scaledHeight) / 2

      const defaultElement: CanvasElement = {
        id: '1',
        type: 'image',
        content: defaultImageUrl,
        x,
        y,
        width: targetWidth,
        height: scaledHeight,
        zIndex: 1,
        locked: false,
        flipH: false,
        flipV: false,
        aspectRatio
      }

      setElements([defaultElement])
      // Initial history state
      historyRef.current = [{ elements: [defaultElement], selectedElement: null }]
      historyIndexRef.current = 0
    }

    initializeDefaultImage()
  }, [getImageDimensions])

  const updateElement = useCallback((id: string, updates: Partial<CanvasElement>) => {
    setElements(prev => {
      const newElements = prev.map(el =>
        el.id === id ? { ...el, ...updates } : el
      )
      return newElements
    })
  }, [])

  const updateElementWithHistory = useCallback((id: string, updates: Partial<CanvasElement>) => {
    setElements(prev => {
      const newElements = prev.map(el =>
        el.id === id ? { ...el, ...updates } : el
      )
      saveToHistory(newElements, selectedElement)
      return newElements
    })
  }, [saveToHistory, selectedElement])

  const deleteElement = useCallback((id: string) => {
    setElements(prev => {
      const newElements = prev.filter(el => el.id !== id)
      saveToHistory(newElements, null)
      return newElements
    })
    if (selectedElement === id) {
      setSelectedElement(null)
    }
  }, [selectedElement, saveToHistory])

  const addElement = useCallback(async (type: 'image' | 'text', content: string, position?: { x: number, y: number }) => {
    let width = 200
    let height = 200
    let aspectRatio = 1

    if (type === 'image') {
      const dimensions = await getImageDimensions(content)
      const targetWidth = 160
      aspectRatio = dimensions.width / dimensions.height
      width = targetWidth
      height = targetWidth / aspectRatio
    } else {
      width = 200
      height = 50
    }

    // Center in design area by default
    let finalPosition = {
      x: DESIGN_AREA.x + (DESIGN_AREA.width - width) / 2,
      y: DESIGN_AREA.y + (DESIGN_AREA.height - height) / 2
    }

    if (position) {
      // Constrain dropped position to design area
      const constrained = constrainToDesignArea(position.x, position.y, width, height)
      finalPosition = constrained
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
      locked: false,
      flipH: false,
      flipV: false,
      aspectRatio
    }
    
    setElements(prev => {
      const newElements = [...prev, newElement]
      saveToHistory(newElements, newElement.id)
      return newElements
    })
    setMaxZIndex(prev => prev + 1)
    setSelectedElement(newElement.id)
  }, [maxZIndex, getImageDimensions, constrainToDesignArea, saveToHistory])

  const bringToFront = useCallback((id: string) => {
    const newZIndex = maxZIndex + 1
    updateElement(id, { zIndex: newZIndex })
    setMaxZIndex(newZIndex)
  }, [maxZIndex, updateElement])

  const toggleLock = useCallback((id: string) => {
    setElements(prev => {
      const newElements = prev.map(el =>
        el.id === id ? { ...el, locked: !el.locked } : el
      )
      saveToHistory(newElements, selectedElement)
      return newElements
    })
  }, [saveToHistory, selectedElement])

  // Center element in design area
  const centerElement = useCallback((id: string) => {
    const element = elements.find(el => el.id === id)
    if (!element) return

    const x = DESIGN_AREA.x + (DESIGN_AREA.width - element.width) / 2
    const y = DESIGN_AREA.y + (DESIGN_AREA.height - element.height) / 2
    updateElementWithHistory(id, { x, y })
  }, [elements, updateElementWithHistory])

  // Flip element horizontally
  const flipHorizontal = useCallback((id: string) => {
    const element = elements.find(el => el.id === id)
    if (!element) return
    updateElementWithHistory(id, { flipH: !element.flipH })
  }, [elements, updateElementWithHistory])

  // Flip element vertically
  const flipVertical = useCallback((id: string) => {
    const element = elements.find(el => el.id === id)
    if (!element) return
    updateElementWithHistory(id, { flipV: !element.flipV })
  }, [elements, updateElementWithHistory])

  // Remove background (placeholder - would need actual API integration)
  const removeBackground = useCallback(() => {
    // This would typically call an API like remove.bg
    alert('Remove background feature would connect to an API like remove.bg')
  }, [])

  const handleDragStop = useCallback((id: string, d: { x: number, y: number }) => {
    const element = elements.find(el => el.id === id)
    if (!element) return

    // Snap to grid if enabled
    let newX = snapToGridValue(d.x)
    let newY = snapToGridValue(d.y)

    // Constrain to design area
    const constrained = constrainToDesignArea(newX, newY, element.width, element.height)
    
    updateElementWithHistory(id, { x: constrained.x, y: constrained.y })
  }, [elements, snapToGridValue, constrainToDesignArea, updateElementWithHistory])

  // Handle drag to show out-of-bounds warning
  const handleDrag = useCallback((id: string, d: { x: number, y: number }) => {
    const element = elements.find(el => el.id === id)
    if (!element) return
    
    const outOfBounds = !checkBounds(d.x, d.y, element.width, element.height)
    setIsOutOfBounds(outOfBounds)
  }, [elements, checkBounds])

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
            if (e.shiftKey) {
              redo()
            } else {
              undo()
            }
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

      // Apply grid snap if enabled
      newX = snapToGridValue(newX)
      newY = snapToGridValue(newY)

      // Constrain to design area
      const constrained = constrainToDesignArea(newX, newY, element.width, element.height)
      updateElementWithHistory(selectedElement, { x: constrained.x, y: constrained.y })
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedElement, elements, snapToGridValue, constrainToDesignArea, updateElementWithHistory, deleteElement, undo, redo])

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

  // Click outside to deselect
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === canvasRef.current || e.target === designAreaRef.current) {
      setSelectedElement(null)
    }
  }, [])

  // Get selected element for menu
  const selectedEl = useMemo(() => 
    elements.find(el => el.id === selectedElement), 
    [elements, selectedElement]
  )

  return (
    <div className="bg-gray-50 flex flex-col justify-center items-center relative">
      {/* Top Toolbar */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-white rounded-lg shadow-lg px-3 py-2">
        <button
          onClick={undo}
          disabled={!canUndo}
          className="p-2 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 size={18} />
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          className="p-2 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Redo (Ctrl+Y)"
        >
          <Redo2 size={18} />
        </button>
        <div className="w-px h-6 bg-gray-200 mx-1" />
        <button
          onClick={() => setSnapToGrid(!snapToGrid)}
          className={`p-2 rounded transition-colors ${snapToGrid ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
          title="Snap to Grid"
        >
          <Grid3X3 size={18} />
        </button>
      </div>

      {/* Main Canvas */}
      <div
        ref={canvasRef}
        className="flex-1 relative overflow-hidden bg-white"
        style={{ minHeight: '700px', minWidth: '700px' }}
        data-canvas
        onClick={handleCanvasClick}
      >
        {/* T-shirt Template */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative">
            <img src="./download.png" alt="" />
          </div>
        </div>

        {/* Design Area with clip path for overflow hidden */}
        <div
          ref={designAreaRef}
          className={`absolute transition-colors duration-200 ${
            isOutOfBounds 
              ? 'border-2 border-red-500 border-dashed' 
              : 'border-2 border-dashed border-black/30'
          }`}
          style={{
            left: DESIGN_AREA.x,
            top: DESIGN_AREA.y,
            width: DESIGN_AREA.width,
            height: DESIGN_AREA.height,
            overflow: 'hidden',
            borderRadius: '4px'
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

        {/* Canvas Elements */}
        {elements
          .sort((a, b) => a.zIndex - b.zIndex)
          .map(element => (
            <Rnd
              key={element.id}
              size={{ width: element.width, height: element.height }}
              position={{ x: element.x, y: element.y }}
              onDrag={(_e, d) => handleDrag(element.id, d)}
              onDragStop={(_e, d) => handleDragStop(element.id, d)}
              minWidth={30}
              minHeight={30}
              disableDragging={element.locked}
              enableResizing={!element.locked}
              className={`${
                selectedElement === element.id 
                  ? 'ring-2 ring-blue-500 shadow-lg' 
                  : 'hover:ring-1 hover:ring-blue-300'
              } ${element.locked ? 'opacity-70' : ''} transition-shadow`}
              style={{ zIndex: element.zIndex }}
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation()
                setSelectedElement(element.id)
                bringToFront(element.id)
              }}

              onResize={(_e, direction, ref, delta) => {
                const aspect = element.aspectRatio || (element.width / element.height)

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
                  if (delta.width !== 0) {
                    newH = newW / aspect
                  } else if (delta.height !== 0) {
                    newW = newH * aspect
                  }

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
                } else {
                  if (direction === "left" || direction === "right") {
                    newH = element.height
                  }
                  if (direction === "top" || direction === "bottom") {
                    newW = element.width
                  }
                  if (direction === "left") {
                    newX = element.x + (element.width - newW)
                  }
                  if (direction === "top") {
                    newY = element.y + (element.height - newH)
                  }
                }

                updateElement(element.id, {
                  width: newW,
                  height: newH,
                  x: newX,
                  y: newY
                })
              }}

              onResizeStop={(_e, _direction, ref, _delta, position) => {
                const newWidth = ref.offsetWidth
                const newHeight = ref.offsetHeight
                const constrained = constrainToDesignArea(position.x, position.y, newWidth, newHeight)
                
                updateElementWithHistory(element.id, {
                  width: newWidth,
                  height: newHeight,
                  x: constrained.x,
                  y: constrained.y
                })
              }}

              resizeHandleStyles={resizeHandleStyles}
              resizeHandleComponent={{
                topLeft: <div className="cursor-nw-resize" />,
                topRight: <div className="cursor-ne-resize" />,
                bottomLeft: <div className="cursor-sw-resize" />,
                bottomRight: <div className="cursor-se-resize" />,
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
                    className="w-full h-full pointer-events-none select-none"
                    draggable={false}
                    style={{
                      transform: `${element.flipH ? 'scaleX(-1)' : ''} ${element.flipV ? 'scaleY(-1)' : ''}`.trim() || 'none'
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-transparent border-2 border-gray-300 rounded">
                    <span className="text-gray-700 font-medium pointer-events-none">
                      {element.content}
                    </span>
                  </div>
                )}

                {/* Lock indicator */}
                {element.locked && (
                  <div className="absolute top-1 right-1 bg-black/50 rounded p-1">
                    <Lock size={12} className="text-white" />
                  </div>
                )}
              </div>
            </Rnd>
          ))}

        {/* Context Menu for Selected Element */}
        {selectedEl && (
          <div 
            className="absolute z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-2 flex flex-col gap-1 min-w-[160px]"
            style={{
              left: Math.min(selectedEl.x + selectedEl.width + 10, CANVAS_SIZE - 180),
              top: Math.max(selectedEl.y, 10)
            }}
          >
            <button
              onClick={() => deleteElement(selectedEl.id)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded transition-colors w-full text-left"
            >
              <Trash2 size={16} />
              Delete
            </button>
            
            <button
              onClick={() => toggleLock(selectedEl.id)}
              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 rounded transition-colors w-full text-left"
            >
              {selectedEl.locked ? <Unlock size={16} /> : <Lock size={16} />}
              {selectedEl.locked ? 'Unlock' : 'Lock'}
            </button>

            <div className="h-px bg-gray-200 my-1" />

            <button
              onClick={() => centerElement(selectedEl.id)}
              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 rounded transition-colors w-full text-left"
            >
              <AlignCenter size={16} />
              Center
            </button>

            <div className="h-px bg-gray-200 my-1" />

            <button
              onClick={() => flipHorizontal(selectedEl.id)}
              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 rounded transition-colors w-full text-left"
            >
              <FlipHorizontal size={16} />
              Flip Horizontal
            </button>

            <button
              onClick={() => flipVertical(selectedEl.id)}
              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 rounded transition-colors w-full text-left"
            >
              <FlipVertical size={16} />
              Flip Vertical
            </button>

            {selectedEl.type === 'image' && (
              <>
                <div className="h-px bg-gray-200 my-1" />
                <button
                  onClick={() => removeBackground()}
                  className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 rounded transition-colors w-full text-left"
                >
                  <Eraser size={16} />
                  Remove Background
                </button>
              </>
            )}
          </div>
        )}

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
