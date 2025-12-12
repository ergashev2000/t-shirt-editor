import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'

export interface CanvasElement {
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

interface HistoryState {
  elements: CanvasElement[]
  selectedElement: string | null
}

// Design area configuration
export const CANVAS_SIZE = 700
export const DESIGN_AREA = {
  x: (CANVAS_SIZE - 192) / 2,
  y: (CANVAS_SIZE - 256) / 2,
  width: 192,
  height: 256
}

export const GRID_SIZE = 10

interface CanvasContextType {
  // State
  elements: CanvasElement[]
  setElements: React.Dispatch<React.SetStateAction<CanvasElement[]>>
  selectedElement: string | null
  setSelectedElement: React.Dispatch<React.SetStateAction<string | null>>
  selectedEl: CanvasElement | undefined
  maxZIndex: number
  setMaxZIndex: React.Dispatch<React.SetStateAction<number>>
  snapToGrid: boolean
  setSnapToGrid: React.Dispatch<React.SetStateAction<boolean>>
  isOutOfBounds: boolean
  setIsOutOfBounds: React.Dispatch<React.SetStateAction<boolean>>
  canUndo: boolean
  canRedo: boolean

  // Actions
  undo: () => void
  redo: () => void
  saveToHistory: (newElements: CanvasElement[], newSelected: string | null) => void
  deleteElement: (id: string) => void
  updateElement: (id: string, updates: Partial<CanvasElement>) => void
  updateElementWithHistory: (id: string, updates: Partial<CanvasElement>) => void
  addElement: (type: 'image' | 'text', content: string, position?: { x: number; y: number }) => Promise<void>
  bringToFront: (id: string) => void

  // Element actions
  centerElement: () => void
  flipHorizontal: () => void
  flipVertical: () => void
  duplicateElement: () => void
  toggleLock: () => void

  // Alignment
  alignLeft: () => void
  alignRight: () => void
  alignTop: () => void
  alignBottom: () => void
  alignCenterH: () => void
  alignCenterV: () => void

  // Helpers
  snapBackIfOutside: (x: number, y: number, width: number, height: number) => { x: number; y: number }
  snapToGridValue: (value: number) => number
  isPartiallyVisible: (x: number, y: number, width: number, height: number) => boolean
  getImageDimensions: (src: string) => Promise<{ width: number; height: number }>
}

const CanvasContext = createContext<CanvasContextType | null>(null)

export function CanvasProvider({ children }: { children: React.ReactNode }) {
  const [elements, setElements] = useState<CanvasElement[]>([])
  const [selectedElement, setSelectedElement] = useState<string | null>(null)
  const [maxZIndex, setMaxZIndex] = useState(1)
  const [snapToGrid, setSnapToGrid] = useState(false)
  const [isOutOfBounds, setIsOutOfBounds] = useState(false)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  const historyRef = useRef<HistoryState[]>([])
  const historyIndexRef = useRef(-1)
  const isInitialized = useRef(false)

  const selectedEl = elements.find(el => el.id === selectedElement)

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
  const getImageDimensions = useCallback((src: string): Promise<{ width: number; height: number }> => {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => resolve({ width: img.width, height: img.height })
      img.onerror = () => resolve({ width: 200, height: 200 })
      img.src = src
    })
  }, [])

  // Check if element has any part visible in design area
  const isPartiallyVisible = useCallback((x: number, y: number, width: number, height: number): boolean => {
    const elementRight = x + width
    const elementBottom = y + height
    const areaRight = DESIGN_AREA.x + DESIGN_AREA.width
    const areaBottom = DESIGN_AREA.y + DESIGN_AREA.height

    return !(
      elementRight < DESIGN_AREA.x ||
      x > areaRight ||
      elementBottom < DESIGN_AREA.y ||
      y > areaBottom
    )
  }, [])

  // Snap element back if completely outside design area
  const snapBackIfOutside = useCallback((x: number, y: number, width: number, height: number) => {
    const elementRight = x + width
    const elementBottom = y + height
    const areaRight = DESIGN_AREA.x + DESIGN_AREA.width
    const areaBottom = DESIGN_AREA.y + DESIGN_AREA.height

    const isCompletelyOutside =
      elementRight < DESIGN_AREA.x ||
      x > areaRight ||
      elementBottom < DESIGN_AREA.y ||
      y > areaBottom

    if (!isCompletelyOutside) return { x, y }

    let newX = x
    let newY = y

    if (elementRight < DESIGN_AREA.x) {
      newX = DESIGN_AREA.x - width + 20
    } else if (x > areaRight) {
      newX = areaRight - 20
    }

    if (elementBottom < DESIGN_AREA.y) {
      newY = DESIGN_AREA.y - height + 20
    } else if (y > areaBottom) {
      newY = areaBottom - 20
    }

    return { x: newX, y: newY }
  }, [])

  // Snap to grid
  const snapToGridValue = useCallback((value: number): number => {
    if (!snapToGrid) return value
    return Math.round(value / GRID_SIZE) * GRID_SIZE
  }, [snapToGrid])

  // Initialize with default image
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
      historyRef.current = [{ elements: [defaultElement], selectedElement: null }]
      historyIndexRef.current = 0
    }

    initializeDefaultImage()
  }, [getImageDimensions])

  const updateElement = useCallback((id: string, updates: Partial<CanvasElement>) => {
    setElements(prev => prev.map(el => el.id === id ? { ...el, ...updates } : el))
  }, [])

  const updateElementWithHistory = useCallback((id: string, updates: Partial<CanvasElement>) => {
    setElements(prev => {
      const newElements = prev.map(el => el.id === id ? { ...el, ...updates } : el)
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

  const addElement = useCallback(async (type: 'image' | 'text', content: string, position?: { x: number; y: number }) => {
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

    let finalPosition = {
      x: DESIGN_AREA.x + (DESIGN_AREA.width - width) / 2,
      y: DESIGN_AREA.y + (DESIGN_AREA.height - height) / 2
    }

    if (position) {
      const snapped = snapBackIfOutside(position.x, position.y, width, height)
      finalPosition = snapped
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
  }, [maxZIndex, getImageDimensions, snapBackIfOutside, saveToHistory])

  const bringToFront = useCallback((id: string) => {
    const newZIndex = maxZIndex + 1
    updateElement(id, { zIndex: newZIndex })
    setMaxZIndex(newZIndex)
  }, [maxZIndex, updateElement])

  // Element actions that work on selected element
  const centerElement = useCallback(() => {
    if (!selectedEl) return
    const x = DESIGN_AREA.x + (DESIGN_AREA.width - selectedEl.width) / 2
    const y = DESIGN_AREA.y + (DESIGN_AREA.height - selectedEl.height) / 2
    updateElementWithHistory(selectedEl.id, { x, y })
  }, [selectedEl, updateElementWithHistory])

  const flipHorizontal = useCallback(() => {
    if (!selectedEl) return
    updateElementWithHistory(selectedEl.id, { flipH: !selectedEl.flipH })
  }, [selectedEl, updateElementWithHistory])

  const flipVertical = useCallback(() => {
    if (!selectedEl) return
    updateElementWithHistory(selectedEl.id, { flipV: !selectedEl.flipV })
  }, [selectedEl, updateElementWithHistory])

  const toggleLock = useCallback(() => {
    if (!selectedEl) return
    setElements(prev => {
      const newElements = prev.map(el => el.id === selectedEl.id ? { ...el, locked: !el.locked } : el)
      saveToHistory(newElements, selectedElement)
      return newElements
    })
  }, [selectedEl, saveToHistory, selectedElement])

  const duplicateElement = useCallback(() => {
    if (!selectedEl) return
    const newElement: CanvasElement = {
      ...selectedEl,
      id: Date.now().toString(),
      x: selectedEl.x + 20,
      y: selectedEl.y + 20,
      zIndex: maxZIndex + 1
    }
    setElements(prev => {
      const newElements = [...prev, newElement]
      saveToHistory(newElements, newElement.id)
      return newElements
    })
    setMaxZIndex(prev => prev + 1)
    setSelectedElement(newElement.id)
  }, [selectedEl, maxZIndex, saveToHistory])

  // Alignment functions
  const alignLeft = useCallback(() => {
    if (!selectedEl) return
    updateElementWithHistory(selectedEl.id, { x: DESIGN_AREA.x })
  }, [selectedEl, updateElementWithHistory])

  const alignRight = useCallback(() => {
    if (!selectedEl) return
    updateElementWithHistory(selectedEl.id, { x: DESIGN_AREA.x + DESIGN_AREA.width - selectedEl.width })
  }, [selectedEl, updateElementWithHistory])

  const alignTop = useCallback(() => {
    if (!selectedEl) return
    updateElementWithHistory(selectedEl.id, { y: DESIGN_AREA.y })
  }, [selectedEl, updateElementWithHistory])

  const alignBottom = useCallback(() => {
    if (!selectedEl) return
    updateElementWithHistory(selectedEl.id, { y: DESIGN_AREA.y + DESIGN_AREA.height - selectedEl.height })
  }, [selectedEl, updateElementWithHistory])

  const alignCenterH = useCallback(() => {
    if (!selectedEl) return
    const x = DESIGN_AREA.x + (DESIGN_AREA.width - selectedEl.width) / 2
    updateElementWithHistory(selectedEl.id, { x })
  }, [selectedEl, updateElementWithHistory])

  const alignCenterV = useCallback(() => {
    if (!selectedEl) return
    const y = DESIGN_AREA.y + (DESIGN_AREA.height - selectedEl.height) / 2
    updateElementWithHistory(selectedEl.id, { y })
  }, [selectedEl, updateElementWithHistory])

  return (
    <CanvasContext.Provider value={{
      elements,
      setElements,
      selectedElement,
      setSelectedElement,
      selectedEl,
      maxZIndex,
      setMaxZIndex,
      snapToGrid,
      setSnapToGrid,
      isOutOfBounds,
      setIsOutOfBounds,
      canUndo,
      canRedo,
      undo,
      redo,
      saveToHistory,
      deleteElement,
      updateElement,
      updateElementWithHistory,
      addElement,
      bringToFront,
      centerElement,
      flipHorizontal,
      flipVertical,
      duplicateElement,
      toggleLock,
      alignLeft,
      alignRight,
      alignTop,
      alignBottom,
      alignCenterH,
      alignCenterV,
      snapBackIfOutside,
      snapToGridValue,
      isPartiallyVisible,
      getImageDimensions
    }}>
      {children}
    </CanvasContext.Provider>
  )
}

export function useCanvas() {
  const context = useContext(CanvasContext)
  if (!context) {
    throw new Error('useCanvas must be used within a CanvasProvider')
  }
  return context
}
