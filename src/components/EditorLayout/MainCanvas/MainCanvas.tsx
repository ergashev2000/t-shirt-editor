import React, { useCallback, useRef, useEffect, useState } from 'react'
import { useCanvas, GRID_SIZE, PRODUCT_DESIGN_AREAS } from './CanvasContext'
import type { CanvasElement } from './CanvasContext'
import ElementToolbar from './ElementToolbar'
import CropOverlay from './CropOverlay'
import MagicBgRemovalOverlay from './MagicBgRemovalOverlay'

// PRODUCT_DESIGN_AREAS dan birinchi templateni olish
const CHEGARA = PRODUCT_DESIGN_AREAS[0]
const SNAP_THRESHOLD = 8

type HandleType = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'

interface DragState {
  elementId: string
  startMouseX: number
  startMouseY: number
  startElX: number
  startElY: number
}

interface ResizeState {
  elementId: string
  handle: HandleType
  startMouseX: number
  startMouseY: number
  startElX: number
  startElY: number
  startWidth: number
  startHeight: number
  aspectRatio: number
}

interface RotateState {
  elementId: string
  startMouseX: number
  startMouseY: number
  centerX: number
  centerY: number
  startRotation: number
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
    isPartiallyVisible,
    designArea,
    isCropping,
    cancelCropping,
    removingBgElementId,
    isBgRemovalCompleting,
    selectedColor
  } = useCanvas()

  const canvasRef = useRef<HTMLDivElement>(null)
  const designAreaRef = useRef<HTMLDivElement>(null)
  const interactiveLayerRef = useRef<HTMLDivElement>(null)

  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [isRotating, setIsRotating] = useState(false)
  const [showCenterGuide, setShowCenterGuide] = useState<{ horizontal: boolean; vertical: boolean }>({ horizontal: false, vertical: false })
  const [hoveredHandle, setHoveredHandle] = useState<HandleType | null>(null)
  const [activeHandle, setActiveHandle] = useState<HandleType | null>(null)

  const dragStateRef = useRef<DragState | null>(null)
  const resizeStateRef = useRef<ResizeState | null>(null)
  const rotateStateRef = useRef<RotateState | null>(null)

  // Get design area center
  const getDesignAreaCenter = useCallback(() => {
    return {
      x: designArea.width / 2,
      y: designArea.height / 2
    }
  }, [designArea])

  // Check if element is centered and snap
  const checkCenterSnap = useCallback((element: CanvasElement, newX: number, newY: number) => {
    const center = getDesignAreaCenter()
    const elCenterX = newX + element.width / 2
    const elCenterY = newY + element.height / 2

    const isHorizontalCenter = Math.abs(elCenterX - center.x) < SNAP_THRESHOLD
    const isVerticalCenter = Math.abs(elCenterY - center.y) < SNAP_THRESHOLD

    let snappedX = newX
    let snappedY = newY

    if (isHorizontalCenter) {
      snappedX = center.x - element.width / 2
    }
    if (isVerticalCenter) {
      snappedY = center.y - element.height / 2
    }

    return {
      x: snappedX,
      y: snappedY,
      showHorizontal: isVerticalCenter,
      showVertical: isHorizontalCenter
    }
  }, [getDesignAreaCenter])

  // Get mouse position relative to interactive layer
  const getRelativeMousePos = useCallback((e: MouseEvent | React.MouseEvent) => {
    if (!interactiveLayerRef.current) return { x: 0, y: 0 }
    const rect = interactiveLayerRef.current.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }
  }, [])

  // Handle element drag start
  const handleDragStart = useCallback((e: React.MouseEvent, elementId: string) => {
    e.stopPropagation()
    const element = elements.find(el => el.id === elementId)
    if (!element || element.locked || removingBgElementId === elementId) return

    const pos = getRelativeMousePos(e)
    dragStateRef.current = {
      elementId,
      startMouseX: pos.x,
      startMouseY: pos.y,
      startElX: element.x,
      startElY: element.y
    }
    setIsDragging(true)
    setSelectedElement(elementId)
    bringToFront(elementId)
  }, [elements, getRelativeMousePos, setSelectedElement, bringToFront, removingBgElementId])

  // Handle resize start
  const handleResizeStart = useCallback((e: React.MouseEvent, elementId: string, handle: HandleType) => {
    e.stopPropagation()
    e.preventDefault()
    const element = elements.find(el => el.id === elementId)
    if (!element || element.locked || removingBgElementId === elementId) return

    const pos = getRelativeMousePos(e)
    resizeStateRef.current = {
      elementId,
      handle,
      startMouseX: pos.x,
      startMouseY: pos.y,
      startElX: element.x,
      startElY: element.y,
      startWidth: element.width,
      startHeight: element.height,
      aspectRatio: element.aspectRatio || element.width / element.height
    }
    setIsResizing(true)
    setActiveHandle(handle)
  }, [elements, getRelativeMousePos, removingBgElementId])

  // Handle rotate start
  const handleRotateStart = useCallback((e: React.MouseEvent, elementId: string) => {
    e.stopPropagation()
    e.preventDefault()
    const element = elements.find(el => el.id === elementId)
    if (!element || element.locked || removingBgElementId === elementId) return

    const pos = getRelativeMousePos(e)
    const centerX = element.x + element.width / 2
    const centerY = element.y + element.height / 2

    rotateStateRef.current = {
      elementId,
      startMouseX: pos.x,
      startMouseY: pos.y,
      centerX,
      centerY,
      startRotation: element.rotation || 0
    }
    setIsRotating(true)
  }, [elements, getRelativeMousePos, removingBgElementId])

  // Mouse move handler
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const pos = getRelativeMousePos(e)

      // Handle dragging
      if (isDragging && dragStateRef.current) {
        const { elementId, startMouseX, startMouseY, startElX, startElY } = dragStateRef.current
        const element = elements.find(el => el.id === elementId)
        if (!element) return

        const deltaX = pos.x - startMouseX
        const deltaY = pos.y - startMouseY
        let newX = startElX + deltaX
        let newY = startElY + deltaY

        // Check center snap first (before grid snap)
        const centerSnap = checkCenterSnap(element, newX, newY)
        setShowCenterGuide({ horizontal: centerSnap.showHorizontal, vertical: centerSnap.showVertical })

        // Apply grid snap only if not center snapped
        if (centerSnap.showVertical) {
          newX = centerSnap.x
        } else {
          newX = snapToGridValue(newX)
        }

        if (centerSnap.showHorizontal) {
          newY = centerSnap.y
        } else {
          newY = snapToGridValue(newY)
        }

        updateElement(elementId, { x: newX, y: newY })

        const visible = isPartiallyVisible(newX, newY, element.width, element.height)
        setIsOutOfBounds(!visible)
      }

      // Handle resizing
      if (isResizing && resizeStateRef.current) {
        const { elementId, handle, startMouseX, startMouseY, startElX, startElY, startWidth, startHeight, aspectRatio } = resizeStateRef.current
        const element = elements.find(el => el.id === elementId)
        if (!element) return

        const deltaX = pos.x - startMouseX
        const deltaY = pos.y - startMouseY

        let newWidth = startWidth
        let newHeight = startHeight
        let newX = startElX
        let newY = startElY

        // Calculate new dimensions based on handle
        switch (handle) {
          case 'se':
            newWidth = Math.max(20, startWidth + deltaX)
            newHeight = newWidth / aspectRatio
            break
          case 'sw':
            newWidth = Math.max(20, startWidth - deltaX)
            newHeight = newWidth / aspectRatio
            newX = startElX + startWidth - newWidth
            break
          case 'ne':
            newWidth = Math.max(20, startWidth + deltaX)
            newHeight = newWidth / aspectRatio
            newY = startElY + startHeight - newHeight
            break
          case 'nw':
            newWidth = Math.max(20, startWidth - deltaX)
            newHeight = newWidth / aspectRatio
            newX = startElX + startWidth - newWidth
            newY = startElY + startHeight - newHeight
            break
          case 'e':
            newWidth = Math.max(20, startWidth + deltaX)
            newHeight = newWidth / aspectRatio
            newY = startElY + (startHeight - newHeight) / 2
            break
          case 'w':
            newWidth = Math.max(20, startWidth - deltaX)
            newHeight = newWidth / aspectRatio
            newX = startElX + startWidth - newWidth
            newY = startElY + (startHeight - newHeight) / 2
            break
          case 'n':
            newHeight = Math.max(20, startHeight - deltaY)
            newWidth = newHeight * aspectRatio
            newX = startElX + (startWidth - newWidth) / 2
            newY = startElY + startHeight - newHeight
            break
          case 's':
            newHeight = Math.max(20, startHeight + deltaY)
            newWidth = newHeight * aspectRatio
            newX = startElX + (startWidth - newWidth) / 2
            break
        }

        updateElement(elementId, { x: newX, y: newY, width: newWidth, height: newHeight })

        const visible = isPartiallyVisible(newX, newY, newWidth, newHeight)
        setIsOutOfBounds(!visible)
      }

      // Handle rotating
      if (isRotating && rotateStateRef.current) {
        const { elementId, centerX, centerY, startRotation } = rotateStateRef.current

        const angle = Math.atan2(pos.y - centerY, pos.x - centerX) * (180 / Math.PI)
        const startAngle = Math.atan2(rotateStateRef.current.startMouseY - centerY, rotateStateRef.current.startMouseX - centerX) * (180 / Math.PI)
        let newRotation = startRotation + (angle - startAngle)

        // Snap to 0, 90, 180, 270 degrees
        const snapAngles = [0, 90, 180, 270, 360, -90, -180, -270]
        for (const snapAngle of snapAngles) {
          if (Math.abs(newRotation - snapAngle) < 5) {
            newRotation = snapAngle
            break
          }
        }


        updateElement(elementId, { rotation: newRotation })
      }
    }

    const handleMouseUp = () => {
      if (isDragging && dragStateRef.current) {
        const { elementId } = dragStateRef.current
        const element = elements.find(el => el.id === elementId)
        if (element) {
          const snapped = snapBackIfOutside(element.x, element.y, element.width, element.height)
          updateElementWithHistory(elementId, { x: snapped.x, y: snapped.y })
        }
        dragStateRef.current = null
        setIsDragging(false)
        setShowCenterGuide({ horizontal: false, vertical: false })
        setIsOutOfBounds(false)
      }

      if (isResizing && resizeStateRef.current) {
        const { elementId } = resizeStateRef.current
        const element = elements.find(el => el.id === elementId)
        if (element) {
          const snapped = snapBackIfOutside(element.x, element.y, element.width, element.height)
          updateElementWithHistory(elementId, {
            x: snapped.x,
            y: snapped.y,
            width: element.width,
            height: element.height,
            aspectRatio: element.width / element.height
          })
        }
        resizeStateRef.current = null
        setIsResizing(false)
        setActiveHandle(null)
        setIsOutOfBounds(false)
      }

      if (isRotating && rotateStateRef.current) {
        const { elementId } = rotateStateRef.current
        const element = elements.find(el => el.id === elementId)
        if (element) {
          updateElementWithHistory(elementId, { rotation: element.rotation })
        }
        rotateStateRef.current = null
        setIsRotating(false)
      }
    }

    if (isDragging || isResizing || isRotating) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, isResizing, isRotating, elements, getRelativeMousePos, snapToGridValue, checkCenterSnap, updateElement, isPartiallyVisible, setIsOutOfBounds, snapBackIfOutside, updateElementWithHistory])

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
          // Prevent deleting while bg removal in progress
          if (removingBgElementId === selectedElement) return
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
  }, [selectedElement, elements, snapToGridValue, snapBackIfOutside, updateElementWithHistory, deleteElement, undo, redo, removingBgElementId])

  // Listen for image drops from sidebar
  useEffect(() => {
    const handleDrop = async (e: DragEvent) => {
      e.preventDefault()
      const imageUrl = e.dataTransfer?.getData('text/plain')
      if (imageUrl) {
        await addElement('image', imageUrl)
      }

      // Handle text-art drops
      const jsonData = e.dataTransfer?.getData('application/json')
      if (jsonData) {
        try {
          const data = JSON.parse(jsonData)
          if (data.type === 'text-art' && data.content) {
            await addElement('image', data.content)
          }
        } catch {
          // Ignore parse errors
        }
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

  // Listen for addImageToCanvas custom event (from TextBar click)
  useEffect(() => {
    const handleAddImage = async (e: Event) => {
      const customEvent = e as CustomEvent<{ src: string }>
      if (customEvent.detail?.src) {
        await addElement('image', customEvent.detail.src)
      }
    }

    window.addEventListener('addImageToCanvas', handleAddImage)
    return () => {
      window.removeEventListener('addImageToCanvas', handleAddImage)
    }
  }, [addElement])

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === canvasRef.current || e.target === designAreaRef.current) {
      if (isCropping) {
        cancelCropping()
      } else {
        setSelectedElement(null)
      }
    }
  }, [setSelectedElement, isCropping, cancelCropping])

  // Render resize handles
  const renderHandles = (element: CanvasElement) => {
    if (selectedElement !== element.id || element.locked) return null

    const handleSize = 10
    const pillWidth = 6
    const pillHeight = 20

    // Burchaklar uchun stil (doira) - binafsha rang
    const cornerStyle = {
      width: handleSize,
      height: handleSize,
      backgroundColor: '#8b5cf6',
      border: '2px solid #8b5cf6',
      borderRadius: '50%',
      position: 'absolute' as const,
      zIndex: 1000,
      boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
      transition: 'background-color 0.15s ease',
    }

    // Yon tomonlar uchun stil (pill) - binafsha rang
    const edgeStyleVertical = {
      width: pillWidth,
      height: pillHeight,
      backgroundColor: 'white',
      border: '2px solid #8b5cf6',
      borderRadius: pillWidth / 2,
      position: 'absolute' as const,
      zIndex: 1000,
      boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
      transition: 'background-color 0.15s ease',
    }

    const edgeStyleHorizontal = {
      width: pillHeight,
      height: pillWidth,
      backgroundColor: 'white',
      border: '2px solid #8b5cf6',
      borderRadius: pillWidth / 2,
      position: 'absolute' as const,
      zIndex: 1000,
      boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
      transition: 'background-color 0.15s ease',
    }

    const handles: { type: HandleType; style: React.CSSProperties; baseStyle: React.CSSProperties; cursor: string }[] = [
      // Burchaklar
      { type: 'nw', baseStyle: cornerStyle, style: { top: -handleSize / 2, left: -handleSize / 2 }, cursor: 'nwse-resize' },
      { type: 'ne', baseStyle: cornerStyle, style: { top: -handleSize / 2, right: -handleSize / 2 }, cursor: 'nesw-resize' },
      { type: 'se', baseStyle: cornerStyle, style: { bottom: -handleSize / 2, right: -handleSize / 2 }, cursor: 'nwse-resize' },
      { type: 'sw', baseStyle: cornerStyle, style: { bottom: -handleSize / 2, left: -handleSize / 2 }, cursor: 'nesw-resize' },
      // Yon tomonlar (pill)
      { type: 'n', baseStyle: edgeStyleHorizontal, style: { top: -(pillWidth + 2) / 2, left: '50%', transform: 'translateX(-50%)' }, cursor: 'ns-resize' },
      { type: 's', baseStyle: edgeStyleHorizontal, style: { bottom: -(pillWidth + 2) / 2, left: '50%', transform: 'translateX(-50%)' }, cursor: 'ns-resize' },
      { type: 'e', baseStyle: edgeStyleVertical, style: { top: '50%', right: -(pillWidth + 2) / 2, transform: 'translateY(-50%)' }, cursor: 'ew-resize' },
      { type: 'w', baseStyle: edgeStyleVertical, style: { top: '50%', left: -(pillWidth + 2) / 2, transform: 'translateY(-50%)' }, cursor: 'ew-resize' },
    ]

    return (
      <>
        {handles.map(({ type, style, baseStyle, cursor }) => {
          // Resize qilayotganda faqat aktiv handle ko'rinadi
          if (isResizing && activeHandle && activeHandle !== type) return null

          const isHovered = hoveredHandle === type
          const isCorner = ['nw', 'ne', 'se', 'sw'].includes(type)
          // Burchaklar uchun binafsha, yon tomonlar uchun oq fon
          const bgColor = isCorner
            ? (isHovered ? '#f3f0ff' : '#ffffff')
            : (isHovered ? '#f3f0ff' : '#ffffff')

          return (
            <div
              key={type}
              style={{ ...baseStyle, ...style, cursor, backgroundColor: bgColor }}
              onMouseDown={(e) => handleResizeStart(e, element.id, type)}
              onMouseEnter={() => setHoveredHandle(type)}
              onMouseLeave={() => setHoveredHandle(null)}
            />
          )
        })}
        {/* Rotate handle - counter-rotate to stay upright */}
        <div
          style={{
            position: 'absolute',
            bottom: -35,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            cursor: 'grab'
          }}
          onMouseDown={(e) => handleRotateStart(e, element.id)}
        >
          <div style={{ width: 1, height: 15, backgroundColor: isRotating ? '#f97316' : '#8b5cf6' }} />
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: '50%',
              border: `2px solid ${isRotating ? '#f97316' : '#8b5cf6'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
              transition: 'border-color 0.15s ease',
              cursor: 'grabbing'
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2">
              <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
          </div>
        </div>
      </>
    )
  }

  return (
    <div className="bg-gray-50 flex flex-col justify-center items-center relative h-full w-full">
      {/* Main Canvas */}
      <div
        ref={canvasRef}
        className="flex-1 relative overflow-hidden bg-white"
        style={{ height: '100%', width: '100%' }}
        data-canvas
        onClick={handleCanvasClick}
      >
        {/* T-shirt Template */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative" style={{ backgroundColor: selectedColor.hex }}>
            <img src={designArea.productImage || ''} alt="Product template" className='w-[600px] h-[600px]' />
          </div>
        </div>

        {/* Design Area with SVG border */}
        <div
          ref={designAreaRef}
          className="absolute pointer-events-none"
          style={{
            left: `calc(50% + ${CHEGARA.x}px)`,
            top: `calc(50% + ${CHEGARA.y}px)`,
            transform: 'translate(-50%, -50%)',
            width: CHEGARA.width,
            height: CHEGARA.height,
            overflow: 'hidden',
            borderRadius: `${CHEGARA.borderRadius}px`
          }}
        >
          {/* SVG Border - smooth dashed line */}
          <svg
            className={`absolute inset-0 w-full h-full transition-all duration-300 ${isDragging || isResizing ? 'opacity-100' : selectedElement ? 'opacity-60' : 'opacity-0'}`}
            style={{ pointerEvents: 'none' }}
          >
            <rect
              x="1"
              y="1"
              width={CHEGARA.width - 2}
              height={CHEGARA.height - 2}
              fill="none"
              stroke={isOutOfBounds ? '#ef4444' : isDragging || isResizing ? '#000000' : CHEGARA.borderColor}
              strokeWidth={1}
              strokeDasharray="8 4"
              strokeLinecap="round"
              rx={CHEGARA.borderRadius}
              ry={CHEGARA.borderRadius}
            />
          </svg>
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

        {/* Center guide lines */}
        {(showCenterGuide.horizontal || showCenterGuide.vertical) && (
          <div
            className="absolute pointer-events-none"
            style={{
              left: `calc(50% + ${CHEGARA.x}px)`,
              top: `calc(50% + ${CHEGARA.y}px)`,
              transform: 'translate(-50%, -50%)',
              width: CHEGARA.width,
              height: CHEGARA.height,
              zIndex: 25
            }}
          >
            {showCenterGuide.vertical && (
              <div
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: 0,
                  width: "2px",
                  height: '100%',
                  backgroundColor: '#ef4444',
                  transform: 'translateX(-50%)'
                }}
              />
            )}
            {showCenterGuide.horizontal && (
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: 0,
                  width: '100%',
                  height: "2px",
                  backgroundColor: '#ef4444',
                  transform: 'translateY(-50%)'
                }}
              />
            )}
          </div>
        )}

        {/* Clipped content area - elements are clipped to design area */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: `calc(50% + ${CHEGARA.x}px)`,
            top: `calc(50% + ${CHEGARA.y}px)`,
            transform: 'translate(-50%, -50%)',
            width: CHEGARA.width,
            height: CHEGARA.height,
            overflow: 'hidden',
            zIndex: 10,
            borderRadius: `${CHEGARA.borderRadius}px`
          }}
        >
          {elements
            .filter(el => !el.hidden)
            .sort((a, b) => a.zIndex - b.zIndex)
            .map(element => (
              <div
                key={`clipped-${element.id}`}
                className="absolute pointer-events-none"
                style={{
                  left: element.x,
                  top: element.y,
                  width: element.width,
                  height: element.height,
                  transform: `rotate(${element.rotation || 0}deg)`,
                  transformOrigin: 'center center'
                }}
              >
                {element.type === 'image' ? (
                  <img
                    src={element.content}
                    alt=""
                    className="w-full h-full"
                    draggable={false}
                    style={{
                      transform: `${element.flipH ? 'scaleX(-1)' : ''} ${element.flipV ? 'scaleY(-1)' : ''}`.trim() || 'none',
                      imageRendering: 'auto',
                      backfaceVisibility: 'hidden'
                    } as React.CSSProperties}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-gray-700 font-medium">{element.content}</span>
                  </div>
                )}
              </div>
            ))}
        </div>

        {/* Element Toolbar - fixed at top of design area (hide during crop) */}
        {selectedElement && !isDragging && !isResizing && !isRotating && !isCropping && (() => {
          const element = elements.find(el => el.id === selectedElement)
          if (!element) return null
          return (
            <div
              style={{
                position: 'absolute',
                left: `calc(50% + ${CHEGARA.x}px)`,
                top: `calc(50% + ${CHEGARA.y}px - ${CHEGARA.height / 2}px - 60px)`,
                transform: 'translateX(-50%)',
                zIndex: 1000
              }}
            >
              <ElementToolbar
                element={element}
                position={{ x: 0, y: 0 }}
              />
            </div>
          )
        })()}

        {/* Canvas Elements - Interactive layer */}
        <div
          ref={interactiveLayerRef}
          className="absolute"
          style={{
            left: `calc(50% + ${CHEGARA.x}px)`,
            top: `calc(50% + ${CHEGARA.y}px)`,
            transform: 'translate(-50%, -50%)',
            width: CHEGARA.width,
            height: CHEGARA.height,
            zIndex: 20,
            borderRadius: `${CHEGARA.borderRadius}px`
          }}
        >
          {elements
            .filter(el => !el.hidden)
            .sort((a, b) => a.zIndex - b.zIndex)
            .map(element => (
              <div
                key={element.id}
                className={`absolute cursor-move ${selectedElement === element.id
                  ? isOutOfBounds ? 'ring-2 ring-red-500' : 'ring-2 ring-violet-500'
                  : 'hover:ring-2 hover:ring-violet-300'
                  } ${element.locked ? 'opacity-70 cursor-not-allowed' : ''}`}
                style={{
                  left: element.x,
                  top: element.y,
                  width: element.width,
                  height: element.height,
                  zIndex: element.zIndex + 100,
                  transform: `rotate(${element.rotation || 0}deg)`,
                  transformOrigin: 'center center'
                }}
                onMouseDown={(e) => !isCropping && removingBgElementId !== element.id && handleDragStart(e, element.id)}
                onClick={(e) => {
                  e.stopPropagation()
                  if (!isCropping && removingBgElementId !== element.id) {
                    setSelectedElement(element.id)
                    bringToFront(element.id)
                  }
                }}
              >
                {/* Transparent overlay for interaction */}
                <div className="w-full h-full" />

                {/* Magic effect during background removal */}
                <MagicBgRemovalOverlay
                  key={`magic-${element.id}-${removingBgElementId}`}
                  isActive={removingBgElementId === element.id}
                  isCompleting={isBgRemovalCompleting}
                  bgColor={selectedColor.hex}
                />

                {/* Resize and rotate handles - hide during crop or bg removal */}
                {!isCropping && removingBgElementId !== element.id && renderHandles(element)}

                {/* Crop overlay - show when cropping this element */}
                {isCropping && selectedElement === element.id && element.type === 'image' && (
                  <CropOverlay element={element} />
                )}
              </div>
            ))}
        </div>

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
    </div>
  )
}

export default MainCanvas
