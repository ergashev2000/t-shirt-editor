import { create } from 'zustand'

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
}

export interface CanvasStore {
  elements: CanvasElement[]
  selectedElement: string | null
  view: 'front' | 'back'
  maxZIndex: number
  
  // Actions
  setElements: (elements: CanvasElement[]) => void
  addElement: (element: CanvasElement) => void
  updateElement: (id: string, updates: Partial<CanvasElement>) => void
  deleteElement: (id: string) => void
  setSelectedElement: (id: string | null) => void
  setView: (view: 'front' | 'back') => void
  bringToFront: (id: string) => void
  toggleLock: (id: string) => void
}

export const useCanvasStore = create<CanvasStore>((set, get) => ({
  elements: [],
  selectedElement: null,
  view: 'front',
  maxZIndex: 1,

  setElements: (elements) => set({ elements }),
  
  addElement: (element) => set((state) => ({
    elements: [...state.elements, element],
    maxZIndex: Math.max(state.maxZIndex, element.zIndex)
  })),
  
  updateElement: (id, updates) => set((state) => ({
    elements: state.elements.map(el =>
      el.id === id ? { ...el, ...updates } : el
    )
  })),
  
  deleteElement: (id) => set((state) => ({
    elements: state.elements.filter(el => el.id !== id),
    selectedElement: state.selectedElement === id ? null : state.selectedElement
  })),
  
  setSelectedElement: (id) => set({ selectedElement: id }),
  
  setView: (view) => set({ view }),
  
  bringToFront: (id) => {
    const newZIndex = get().maxZIndex + 1
    set((state) => ({
      elements: state.elements.map(el =>
        el.id === id ? { ...el, zIndex: newZIndex } : el
      ),
      maxZIndex: newZIndex
    }))
  },
  
  toggleLock: (id) => set((state) => ({
    elements: state.elements.map(el =>
      el.id === id ? { ...el, locked: !el.locked } : el
    )
  }))
}))
