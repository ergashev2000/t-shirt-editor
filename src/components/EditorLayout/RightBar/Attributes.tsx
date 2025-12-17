import { useState, useCallback, useMemo } from 'react'
import { Eye, EyeOff, Lock, Unlock, Trash2, Link, Unlink } from 'lucide-react'
import { useCanvas, type CanvasElement } from '../MainCanvas/CanvasContext'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'

export default function Attributes() {
  const {
    elements,
    selectedElement,
    setSelectedElement,
    selectedEl,
    updateElementWithHistory,
    deleteElement,
    updateElement,
    designArea,
    bringToFront
  } = useCanvas()

  const [aspectLocked, setAspectLocked] = useState(true)

  // Compute local values from selected element
  const localValues = useMemo(() => {
    if (!selectedEl) return { width: '', height: '', rotation: '', scale: '' }
    const originalWidth = selectedEl.aspectRatio ? selectedEl.height * selectedEl.aspectRatio : selectedEl.width
    const scale = (selectedEl.width / originalWidth) * 100
    return {
      width: Math.round(selectedEl.width).toString(),
      height: Math.round(selectedEl.height).toString(),
      rotation: (selectedEl.rotation || 0).toFixed(1),
      scale: scale.toFixed(2)
    }
  }, [selectedEl])

  // Handle width change
  const handleWidthChange = useCallback((value: string) => {
    if (!selectedEl) return

    const newWidth = parseFloat(value)
    if (isNaN(newWidth) || newWidth <= 0) return

    if (aspectLocked && selectedEl.aspectRatio) {
      const newHeight = newWidth / selectedEl.aspectRatio
      updateElementWithHistory(selectedEl.id, { width: newWidth, height: newHeight })
    } else {
      updateElementWithHistory(selectedEl.id, { width: newWidth })
    }
  }, [selectedEl, aspectLocked, updateElementWithHistory])

  // Handle height change
  const handleHeightChange = useCallback((value: string) => {
    if (!selectedEl) return

    const newHeight = parseFloat(value)
    if (isNaN(newHeight) || newHeight <= 0) return

    if (aspectLocked && selectedEl.aspectRatio) {
      const newWidth = newHeight * selectedEl.aspectRatio
      updateElementWithHistory(selectedEl.id, { width: newWidth, height: newHeight })
    } else {
      updateElementWithHistory(selectedEl.id, { height: newHeight })
    }
  }, [selectedEl, aspectLocked, updateElementWithHistory])

  // Handle rotation change
  const handleRotationChange = useCallback((value: string) => {
    if (!selectedEl) return

    const newRotation = parseFloat(value)
    if (isNaN(newRotation)) return

    updateElementWithHistory(selectedEl.id, { rotation: newRotation })
  }, [selectedEl, updateElementWithHistory])

  // Handle scale change
  const handleScaleChange = useCallback((value: string) => {
    if (!selectedEl) return

    const newScale = parseFloat(value)
    if (isNaN(newScale) || newScale <= 0) return

    const scaleFactor = newScale / 100
    if (selectedEl.aspectRatio) {
      const baseWidth = selectedEl.height * selectedEl.aspectRatio
      const newWidth = baseWidth * scaleFactor
      const newHeight = selectedEl.height * scaleFactor
      updateElementWithHistory(selectedEl.id, { width: newWidth, height: newHeight })
    }
  }, [selectedEl, updateElementWithHistory])

  // Toggle element visibility
  const toggleVisibility = useCallback((element: CanvasElement) => {
    updateElement(element.id, { hidden: !element.hidden })
  }, [updateElement])

  // Toggle element lock
  const toggleLock = useCallback((element: CanvasElement) => {
    updateElementWithHistory(element.id, { locked: !element.locked })
  }, [updateElementWithHistory])

  // Delete element
  const handleDelete = useCallback((elementId: string) => {
    deleteElement(elementId)
  }, [deleteElement])

  // Select layer
  const handleSelectLayer = useCallback((elementId: string) => {
    setSelectedElement(elementId)
    bringToFront(elementId)
  }, [setSelectedElement, bringToFront])

  // Get DPI for element (approximate based on design area)
  const getElementDPI = useCallback((element: CanvasElement) => {
    // Approximate DPI calculation based on element size vs design area
    const baseDPI = 300
    const scaleFactor = Math.min(element.width / designArea.width, element.height / designArea.height)
    return Math.round(baseDPI * scaleFactor * 10) / 10
  }, [designArea])

  // Sort elements by zIndex (highest first for layer list)
  const sortedElements = [...elements].sort((a, b) => b.zIndex - a.zIndex)

  return (
    <div className="w-full border-l border-gray-200 flex flex-col h-full">
      {/* Attributes Section */}
      <div className="p-4 border-b border-gray-200">
        <div className='flex items-center justify-between mb-2'>
          <h3 className="text-sm font-semibold text-gray-900">Attributes</h3>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => setAspectLocked(!aspectLocked)}
            title={aspectLocked ? "Unlock aspect ratio" : "Lock aspect ratio"}
          >
            {aspectLocked ? (
              <Link className="h-4 w-4 text-blue-600" />
            ) : (
              <Unlink className="h-4 w-4 text-gray-400" />
            )}
          </Button>
        </div>
        <div>
          {/* Width & Height */}
          <div className='space-y-4'>
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <label className="text-xs text-gray-500 mb-1 block">Width</label>
                <div className="flex">
                  <Input
                    type="number"
                    value={localValues.width}
                    onChange={(e) => handleWidthChange(e.target.value)}
                    className="h-8 text-sm rounded-r-none ring-0"
                    min={1}
                    disabled={!selectedEl}
                  />
                  <span className="h-8 w-8 justify-center bg-gray-100 border border-l-0 border-input rounded-r-md flex items-center text-xs text-gray-500">
                    px
                  </span>
                </div>
              </div>

              <div className="flex-1">
                <label className="text-xs text-gray-500 mb-1 block">Height</label>
                <div className="flex">
                  <Input
                    type="number"
                    value={localValues.height}
                    onChange={(e) => handleHeightChange(e.target.value)}
                    className="h-8 text-sm rounded-r-none ring-0"
                    min={1}
                  />
                  <span className="h-8 w-8 justify-center bg-gray-100 border border-l-0 border-input rounded-r-md flex items-center text-xs text-gray-500">
                    px
                  </span>
                </div>
              </div>
            </div>

            {/* Rotate & Scale */}
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs text-gray-500 mb-1 block">Rotate</label>
                <div className="flex">
                  <Input
                    type="number"
                    value={localValues.rotation}
                    onChange={(e) => handleRotationChange(e.target.value)}
                    className="h-8 text-sm rounded-r-none ring-0"
                    step={0.1}
                    disabled={!selectedEl}
                  />
                  <span className="h-8 w-8 justify-center bg-gray-100 border border-l-0 border-input rounded-r-md flex items-center text-xs text-gray-500">
                    °
                  </span>
                </div>
              </div>

              <div className="flex-1">
                <label className="text-xs text-gray-500 mb-1 block">Scale</label>
                <div className="flex">
                  <Input
                    type="number"
                    value={localValues.scale}
                    onChange={(e) => handleScaleChange(e.target.value)}
                    className="h-8 text-sm rounded-r-none ring-0"
                    step={0.01}
                    min={0.01}
                    disabled={!selectedEl}
                  />
                  <span className="h-8 w-8 justify-center bg-gray-100 border border-l-0 border-input rounded-r-md flex items-center text-xs text-gray-500">
                    %
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Layers Section */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="p-4 pb-2">
          <h3 className="text-sm font-semibold text-gray-900">Layers</h3>
        </div>

        <ScrollArea className="flex-1 px-4 pb-4">
          {sortedElements.length > 0 ? (
            <div className="space-y-2">
              {sortedElements.map((element, index) => {
                const isSelected = selectedElement === element.id
                const isHidden = element.hidden
                const dpi = getElementDPI(element)

                return (
                  <div
                    key={element.id}
                    className={`flex items-center gap-2 p-2 m-0.5 rounded-lg cursor-pointer transition-colors ${isSelected
                      ? 'bg-blue-50 ring-1 ring-blue-200'
                      : 'hover:bg-gray-50'
                      }`}
                    onClick={() => handleSelectLayer(element.id)}
                  >
                    {/* Thumbnail */}
                    <div className="w-10 h-10 rounded bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
                      {element.type === 'image' ? (
                        <img
                          src={element.content}
                          alt={`Layer ${index + 1}`}
                          className="w-full h-full object-cover"
                          style={{
                            transform: `${element.flipH ? 'scaleX(-1)' : ''} ${element.flipV ? 'scaleY(-1)' : ''}`,
                            opacity: isHidden ? 0.4 : 1
                          }}
                        />
                      ) : (
                        <span className="text-xs text-gray-500 truncate px-1">
                          {element.content.substring(0, 6)}
                        </span>
                      )}
                    </div>

                    {/* Layer Info */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${isHidden ? 'text-gray-400' : 'text-gray-900'}`}>
                        Layer {sortedElements.length - index}
                      </p>
                      <p className="text-xs text-gray-400">
                        DPI: {dpi}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-0.5 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleVisibility(element)
                        }}
                        title={isHidden ? "Ko'rsatish" : "Yashirish"}
                      >
                        {isHidden ? (
                          <EyeOff className="h-3.5 w-3.5 text-gray-400" />
                        ) : (
                          <Eye className="h-3.5 w-3.5 text-gray-500" />
                        )}
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleLock(element)
                        }}
                        title={element.locked ? "Qulfni ochish" : "Qulflash"}
                      >
                        {element.locked ? (
                          <Lock className="h-3.5 w-3.5 text-blue-600" />
                        ) : (
                          <Unlock className="h-3.5 w-3.5 text-gray-400" />
                        )}
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 hover:text-red-600"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(element.id)
                        }}
                        title="O'chirish"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">
              Hali layerlar yo'q
            </p>
          )}
        </ScrollArea>
      </div>
    </div>
  )
}
