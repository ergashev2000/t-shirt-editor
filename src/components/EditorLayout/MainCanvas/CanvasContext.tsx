import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'
import { removeBackground as removeBg } from '@imgly/background-removal'

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
  rotation?: number
}

interface HistoryState {
  elements: CanvasElement[]
  selectedElement: string | null
}

// Design area configuration
export const CANVAS_SIZE = 700
export const GRID_SIZE = 10

// Product design area configurations
export interface DesignAreaConfig {
  id: string
  name: string
  x: number
  y: number
  width: number
  height: number
  productImage: string
  borderColor: string
  borderRadius: number
}

// Product sides configuration
export type ProductSide = 'front' | 'back'

// eslint-disable-next-line react-refresh/only-export-components

export const PRODUCT_DESIGN_AREAS: DesignAreaConfig[] = [
  {
    id: 'tshirt-front',
    name: 'T-Shirt (Old)',
    x: 0,
    y: -35,
    width: 220,
    height: 350,
    productImage: './images/tshirt-front.png',
    borderColor: 'rgba(139, 69, 19, 0.3)',
    borderRadius: 2
  },
  {
    id: 'tshirt-back',
    name: 'T-Shirt (Orqa)',
    x: 0,
    y: -35,
    width: 220,
    height: 350,
    productImage: './images/tshirt-back.png',
    borderColor: 'rgba(139, 69, 19, 0.3)',
    borderRadius: 2
  },
  {
    id: 'hoodie-front',
    name: 'Hoodie (Old\')',
    x: 0,
    y: 0,
    width: 180,
    height: 240,
    productImage: './download.png',
    borderColor: 'rgba(100, 100, 100, 0.3)',
    borderRadius: 8
  },
  {
    id: 'hoodie-back',
    name: 'Hoodie (Orqa)',
    x: 0,
    y: 0,
    width: 200,
    height: 280,
    productImage: './download.png',
    borderColor: 'rgba(100, 100, 100, 0.3)',
    borderRadius: 8
  },
  {
    id: 'mug',
    name: 'Krujka',
    x: 0,
    y: 0,
    width: 250,
    height: 150,
    productImage: './download.png',
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4
  }
]
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

  // Design area
  designArea: DesignAreaConfig
  setDesignAreaById: (id: string) => void
  productDesignAreas: DesignAreaConfig[]

  // Product side (front/back)
  currentSide: ProductSide
  setCurrentSide: (side: ProductSide) => void

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
  removeBackground: () => Promise<void>
  isRemovingBg: boolean
  removingBgElementId: string | null

  // Cropping
  isCropping: boolean
  cropBox: { x: number; y: number; width: number; height: number } | null
  setCropBox: React.Dispatch<React.SetStateAction<{ x: number; y: number; width: number; height: number } | null>>
  startCropping: () => void
  cancelCropping: () => void
  applyCrop: () => Promise<void>

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
  // Separate elements for front and back
  const [frontElements, setFrontElements] = useState<CanvasElement[]>([])
  const [backElements, setBackElements] = useState<CanvasElement[]>([])
  const [currentSide, setCurrentSideState] = useState<ProductSide>('front')

  // Use ref to track current side for callbacks
  const currentSideRef = useRef<ProductSide>(currentSide)
  currentSideRef.current = currentSide

  // Current elements based on side
  const elements = currentSide === 'front' ? frontElements : backElements

  // Stable setElements function that always uses current side
  const setElements = useCallback((updater: React.SetStateAction<CanvasElement[]>) => {
    if (currentSideRef.current === 'front') {
      setFrontElements(updater)
    } else {
      setBackElements(updater)
    }
  }, [])

  const [selectedElement, setSelectedElement] = useState<string | null>(null)
  const [maxZIndex, setMaxZIndex] = useState(1)
  const [snapToGrid, setSnapToGrid] = useState(false)
  const [isOutOfBounds, setIsOutOfBounds] = useState(false)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  const [designArea, setDesignArea] = useState<DesignAreaConfig>(PRODUCT_DESIGN_AREAS[0])
  const [isRemovingBg, setIsRemovingBg] = useState(false)
  const [removingBgElementId, setRemovingBgElementId] = useState<string | null>(null)
  const [isCropping, setIsCropping] = useState(false)
  const [cropBox, setCropBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null)

  const historyRef = useRef<HistoryState[]>([])
  const historyIndexRef = useRef(-1)

  const selectedEl = elements.find(el => el.id === selectedElement)

  // Switch between front and back
  const setCurrentSide = useCallback((side: ProductSide) => {
    setSelectedElement(null) // Clear selection when switching
    setCurrentSideState(side)
    // Update design area based on side
    const areaId = side === 'front' ? 'tshirt-front' : 'tshirt-back'
    const area = PRODUCT_DESIGN_AREAS.find(a => a.id === areaId)
    if (area) {
      setDesignArea(area)
    }
  }, [])

  // Set design area by product id
  const setDesignAreaById = useCallback((id: string) => {
    const area = PRODUCT_DESIGN_AREAS.find(a => a.id === id)
    if (area) {
      setDesignArea(area)
    }
  }, [])

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
    const areaRight = designArea.x + designArea.width
    const areaBottom = designArea.y + designArea.height

    return !(
      elementRight < designArea.x ||
      x > areaRight ||
      elementBottom < designArea.y ||
      y > areaBottom
    )
  }, [designArea])

  // Snap element back if completely outside design area
  const snapBackIfOutside = useCallback((x: number, y: number, width: number, height: number) => {
    const elementRight = x + width
    const elementBottom = y + height
    const areaRight = designArea.x + designArea.width
    const areaBottom = designArea.y + designArea.height

    const isCompletelyOutside =
      elementRight < designArea.x ||
      x > areaRight ||
      elementBottom < designArea.y ||
      y > areaBottom

    if (!isCompletelyOutside) return { x, y }

    let newX = x
    let newY = y

    if (elementRight < designArea.x) {
      newX = designArea.x - width + 20
    } else if (x > areaRight) {
      newX = areaRight - 20
    }

    if (elementBottom < designArea.y) {
      newY = designArea.y - height + 20
    } else if (y > areaBottom) {
      newY = areaBottom - 20
    }

    return { x: newX, y: newY }
  }, [designArea])

  // Snap to grid
  const snapToGridValue = useCallback((value: number): number => {
    if (!snapToGrid) return value
    return Math.round(value / GRID_SIZE) * GRID_SIZE
  }, [snapToGrid])

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
    // Prevent deleting while bg removal in progress
    if (removingBgElementId === id) return
    
    setElements(prev => {
      const newElements = prev.filter(el => el.id !== id)
      saveToHistory(newElements, null)
      return newElements
    })
    if (selectedElement === id) {
      setSelectedElement(null)
    }
  }, [selectedElement, saveToHistory, removingBgElementId])

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
      x: designArea.x + (designArea.width - width) / 2,
      y: designArea.y + (designArea.height - height) / 2
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
      aspectRatio,
      rotation: 0
    }

    setElements(prev => {
      const newElements = [...prev, newElement]
      saveToHistory(newElements, newElement.id)
      return newElements
    })
    setMaxZIndex(prev => prev + 1)
    setSelectedElement(newElement.id)
  }, [maxZIndex, getImageDimensions, snapBackIfOutside, saveToHistory, designArea])

  const bringToFront = useCallback((id: string) => {
    const newZIndex = maxZIndex + 1
    updateElement(id, { zIndex: newZIndex })
    setMaxZIndex(newZIndex)
  }, [maxZIndex, updateElement])

  // Element actions that work on selected element
  const centerElement = useCallback(() => {
    if (!selectedEl) return
    const x = designArea.x + (designArea.width - selectedEl.width) / 2
    const y = designArea.y + (designArea.height - selectedEl.height) / 2
    updateElementWithHistory(selectedEl.id, { x, y })
  }, [selectedEl, updateElementWithHistory, designArea])

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
      zIndex: maxZIndex + 1,
      rotation: selectedEl.rotation || 0
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
    updateElementWithHistory(selectedEl.id, { x: designArea.x })
  }, [selectedEl, updateElementWithHistory, designArea])

  const alignRight = useCallback(() => {
    if (!selectedEl) return
    updateElementWithHistory(selectedEl.id, { x: designArea.x + designArea.width - selectedEl.width })
  }, [selectedEl, updateElementWithHistory, designArea])

  const alignTop = useCallback(() => {
    if (!selectedEl) return
    updateElementWithHistory(selectedEl.id, { y: designArea.y })
  }, [selectedEl, updateElementWithHistory, designArea])

  const alignBottom = useCallback(() => {
    if (!selectedEl) return
    updateElementWithHistory(selectedEl.id, { y: designArea.y + designArea.height - selectedEl.height })
  }, [selectedEl, updateElementWithHistory, designArea])

  const alignCenterH = useCallback(() => {
    if (!selectedEl) return
    const x = designArea.x + (designArea.width - selectedEl.width) / 2
    updateElementWithHistory(selectedEl.id, { x })
  }, [selectedEl, updateElementWithHistory, designArea])

  const alignCenterV = useCallback(() => {
    if (!selectedEl) return
    const y = designArea.y + (designArea.height - selectedEl.height) / 2
    updateElementWithHistory(selectedEl.id, { y })
  }, [selectedEl, updateElementWithHistory, designArea])

  const removeBackground = useCallback(async () => {
    if (!selectedEl || selectedEl.type !== 'image' || isRemovingBg) return

    const elementId = selectedEl.id
    setIsRemovingBg(true)
    setRemovingBgElementId(elementId)
    
    try {
      // Optimized settings to reduce browser strain
      const blob = await removeBg(selectedEl.content, {
        model: 'isnet_quint8',  // Use quantized model for faster/lighter processing
        output: {
          format: 'image/png',
          quality: 1  // Slightly lower quality for performance
        }
      })
      const url = URL.createObjectURL(blob)
      updateElementWithHistory(elementId, { content: url })
    } catch (error) {
      console.error('Background removal failed:', error)
    } finally {
      setIsRemovingBg(false)
      setRemovingBgElementId(null)
    }
  }, [selectedEl, updateElementWithHistory, isRemovingBg])

  // Cropping functions
  const startCropping = useCallback(() => {
    // Prevent cropping while bg removal in progress
    if (!selectedEl || selectedEl.type !== 'image' || removingBgElementId === selectedEl.id) return
    // Initialize crop box to full element size
    setCropBox({ x: 0, y: 0, width: selectedEl.width, height: selectedEl.height })
    setIsCropping(true)
  }, [selectedEl, removingBgElementId])

  const cancelCropping = useCallback(() => {
    setIsCropping(false)
    setCropBox(null)
  }, [])

  const applyCrop = useCallback(async () => {
    if (!selectedEl || selectedEl.type !== 'image' || !cropBox) return

    try {
      // Load the original image
      const img = new Image()
      img.crossOrigin = 'anonymous'

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = reject
        img.src = selectedEl.content
      })

      // Calculate crop coordinates relative to original image
      const scaleX = img.naturalWidth / selectedEl.width
      const scaleY = img.naturalHeight / selectedEl.height

      const cropX = cropBox.x * scaleX
      const cropY = cropBox.y * scaleY
      const cropWidth = cropBox.width * scaleX
      const cropHeight = cropBox.height * scaleY

      // Create canvas for cropping with high quality settings
      const canvas = document.createElement('canvas')
      canvas.width = cropWidth
      canvas.height = cropHeight
      const ctx = canvas.getContext('2d', {
        alpha: true,
        desynchronized: false,
        willReadFrequently: false
      })

      if (!ctx) return

      // Enable high quality image rendering
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'

      // Draw cropped portion
      ctx.drawImage(
        img,
        cropX, cropY, cropWidth, cropHeight,
        0, 0, cropWidth, cropHeight
      )

      // Get cropped image as data URL with maximum quality
      // Use PNG for lossless quality, or JPEG with quality 1.0 for smaller file size
      const croppedDataUrl = canvas.toDataURL('image/png', 1.0)

      // Calculate new element position (center the cropped area where it was)
      const newX = selectedEl.x + cropBox.x
      const newY = selectedEl.y + cropBox.y

      // Update element with cropped image
      updateElementWithHistory(selectedEl.id, {
        content: croppedDataUrl,
        x: newX,
        y: newY,
        width: cropBox.width,
        height: cropBox.height,
        aspectRatio: cropBox.width / cropBox.height
      })

      // Exit crop mode
      setIsCropping(false)
      setCropBox(null)
    } catch (error) {
      console.error('Crop failed:', error)
    }
  }, [selectedEl, cropBox, updateElementWithHistory])

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
      removeBackground,
      isRemovingBg,
      removingBgElementId,
      isCropping,
      cropBox,
      setCropBox,
      startCropping,
      cancelCropping,
      applyCrop,
      alignLeft,
      alignRight,
      alignTop,
      alignBottom,
      alignCenterH,
      alignCenterV,
      snapBackIfOutside,
      snapToGridValue,
      isPartiallyVisible,
      getImageDimensions,
      designArea,
      setDesignAreaById,
      productDesignAreas: PRODUCT_DESIGN_AREAS,
      currentSide,
      setCurrentSide
    }}>
      {children}
    </CanvasContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCanvas() {
  const context = useContext(CanvasContext)
  if (!context) {
    throw new Error('useCanvas must be used within a CanvasProvider')
  }
  return context
}
