import React from 'react'
import { useCanvas } from './CanvasContext'
import { Button } from '@/components/ui/button'
import { X, Check } from 'lucide-react'

interface AspectRatioOption {
  label: string
  ratio: number | null // null = free
}

const aspectRatios: AspectRatioOption[] = [
  { label: 'Free', ratio: null },
  { label: '1:1', ratio: 1 },
  { label: '9:16', ratio: 9 / 16 },
  { label: '16:9', ratio: 16 / 9 },
  { label: '10:16', ratio: 10 / 16 },
  { label: '16:10', ratio: 16 / 10 },
  { label: '2:3', ratio: 2 / 3 },
  { label: '3:2', ratio: 3 / 2 },
  { label: '3:4', ratio: 3 / 4 },
  { label: '4:3', ratio: 4 / 3 },
  { label: '4:5', ratio: 4 / 5 },
  { label: '5:4', ratio: 5 / 4 },
]

interface CropSidebarProps {
  element: {
    width: number
    height: number
  }
}

const CropSidebar: React.FC<CropSidebarProps> = ({ element }) => {
  const { cropBox, setCropBox, applyCrop, cancelCropping } = useCanvas()
  const [selectedRatio, setSelectedRatio] = React.useState<number | null>(null)

  if (!cropBox) return null

  const handleRatioSelect = (ratio: number | null) => {
    setSelectedRatio(ratio)
    
    if (ratio === null) return // Free - do nothing
    
    // Calculate new crop box with aspect ratio
    const currentCenterX = cropBox.x + cropBox.width / 2
    const currentCenterY = cropBox.y + cropBox.height / 2
    
    let newWidth = cropBox.width
    let newHeight = cropBox.height
    
    // Adjust to match aspect ratio
    const currentRatio = cropBox.width / cropBox.height
    
    if (currentRatio > ratio) {
      // Too wide, reduce width
      newWidth = cropBox.height * ratio
    } else {
      // Too tall, reduce height
      newHeight = cropBox.width / ratio
    }
    
    // Ensure within bounds
    if (newWidth > element.width) {
      newWidth = element.width
      newHeight = newWidth / ratio
    }
    if (newHeight > element.height) {
      newHeight = element.height
      newWidth = newHeight * ratio
    }
    
    // Center the new crop box
    let newX = currentCenterX - newWidth / 2
    let newY = currentCenterY - newHeight / 2
    
    // Constrain to element bounds
    newX = Math.max(0, Math.min(element.width - newWidth, newX))
    newY = Math.max(0, Math.min(element.height - newHeight, newY))
    
    setCropBox({ x: newX, y: newY, width: newWidth, height: newHeight })
  }

  const handleWidthChange = (value: string) => {
    const newWidth = parseFloat(value)
    if (isNaN(newWidth) || newWidth < 20) return
    
    const constrainedWidth = Math.min(newWidth, element.width - cropBox.x)
    let newHeight = cropBox.height
    
    if (selectedRatio !== null) {
      newHeight = constrainedWidth / selectedRatio
      if (newHeight > element.height - cropBox.y) {
        newHeight = element.height - cropBox.y
      }
    }
    
    setCropBox({ ...cropBox, width: constrainedWidth, height: newHeight })
  }

  const handleHeightChange = (value: string) => {
    const newHeight = parseFloat(value)
    if (isNaN(newHeight) || newHeight < 20) return
    
    const constrainedHeight = Math.min(newHeight, element.height - cropBox.y)
    let newWidth = cropBox.width
    
    if (selectedRatio !== null) {
      newWidth = constrainedHeight * selectedRatio
      if (newWidth > element.width - cropBox.x) {
        newWidth = element.width - cropBox.x
      }
    }
    
    setCropBox({ ...cropBox, width: newWidth, height: constrainedHeight })
  }

  return (
    <div className="w-full bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <h3 className="font-medium text-gray-900">Crop</h3>
        <button
          onClick={cancelCropping}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <X className="h-5 w-5 text-gray-500" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Crop Area Section */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Crop Area</h4>
          
          {/* Width & Height inputs */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-600 w-14">Width</label>
              <div className="flex-1 flex items-center gap-2">
                <input
                  type="number"
                  value={Math.round(cropBox.width)}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleWidthChange(e.target.value)}
                  className="h-9 w-full px-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
                <span className="text-sm text-gray-500">px</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-600 w-14">Height</label>
              <div className="flex-1 flex items-center gap-2">
                <input
                  type="number"
                  value={Math.round(cropBox.height)}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleHeightChange(e.target.value)}
                  className="h-9 w-full px-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
                <span className="text-sm text-gray-500">px</span>
              </div>
            </div>
          </div>
        </div>

        {/* Aspect Ratio Presets */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Aspect Ratio</h4>
          <div className="grid grid-cols-3 gap-2">
            {aspectRatios.map((option) => (
              <button
                key={option.label}
                onClick={() => handleRatioSelect(option.ratio)}
                className={`
                  flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all
                  ${selectedRatio === option.ratio 
                    ? 'border-violet-500 bg-violet-50' 
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                  }
                `}
              >
                <div 
                  className={`
                    border-2 border-dashed rounded-sm mb-2
                    ${selectedRatio === option.ratio ? 'border-violet-500' : 'border-gray-400'}
                  `}
                  style={{
                    width: option.ratio === null ? 40 : option.ratio > 1 ? 40 : 30 * (option.ratio || 1),
                    height: option.ratio === null ? 40 : option.ratio > 1 ? 40 / option.ratio : 30,
                    minWidth: 24,
                    minHeight: 24,
                    maxWidth: 40,
                    maxHeight: 40
                  }}
                />
                <span className={`text-xs ${selectedRatio === option.ratio ? 'text-violet-700 font-medium' : 'text-gray-600'}`}>
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-gray-200 flex gap-2">
        <Button
          variant="outline"
          className="flex-1"
          onClick={cancelCropping}
        >
          <X className="h-4 w-4 mr-2" />
          Bekor
        </Button>
        <Button
          className="flex-1 bg-violet-600 hover:bg-violet-700"
          onClick={applyCrop}
        >
          <Check className="h-4 w-4 mr-2" />
          Saqlash
        </Button>
      </div>
    </div>
  )
}

export default CropSidebar
