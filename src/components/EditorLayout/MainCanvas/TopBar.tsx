import {
  AlignCenter,
  AlignHorizontalDistributeCenter,
  AlignVerticalDistributeCenter,
  AlignStartVertical,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignEndHorizontal,
  FlipHorizontal,
  FlipVertical,
  Copy,
  Save,
  Eye,
  Undo2,
  Redo2,
  Grid3X3,
  Shirt
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Toggle } from '@/components/ui/toggle'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useCanvas } from './CanvasContext'

export default function TopBar() {

  const {
    selectedEl,
    canUndo,
    canRedo,
    undo,
    redo,
    snapToGrid,
    setSnapToGrid,
    duplicateElement,
    flipHorizontal,
    flipVertical,
    alignLeft,
    alignRight,
    alignTop,
    alignBottom,
    alignCenterH,
    alignCenterV,
    centerElement,
    currentSide,
    setCurrentSide,
    designArea,
    selectedColor,
    setSelectedColor,
  } = useCanvas()

  const hasSelection = !!selectedEl

  return (
    <TooltipProvider delayDuration={300}>
      <div className="h-auto border-b border-gray-200">
        {/* Main Toolbar */}
        <div className="h-14 flex justify-between items-center w-full px-3">
          {/* Left section - Colors */}
          <div className="flex items-center gap-2">
            {/* Color Picker */}
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500 mr-1">Rang:</span>
              <div className="flex items-center gap-0.5">
                {designArea.availableColors.slice(0, 8).map((color) => (
                  <Tooltip key={color.id}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setSelectedColor(color)}
                        className={`w-6 h-6 rounded-full border-2 transition-all hover:scale-110 ${
                          selectedColor.id === color.id
                            ? 'border-violet-500 ring-2 ring-violet-200'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                        style={{ backgroundColor: color.hex }}
                        title={color.name}
                      />
                    </TooltipTrigger>
                    <TooltipContent>{color.name}</TooltipContent>
                  </Tooltip>
                ))}
                {designArea.availableColors.length > 8 && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="w-6 h-6 rounded-full border-2 border-gray-300 bg-gradient-to-br from-red-400 via-yellow-400 to-blue-400 hover:border-gray-400 transition-all hover:scale-110 flex items-center justify-center text-xs font-bold text-white">
                        +{designArea.availableColors.length - 8}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-2">
                      <div className="grid grid-cols-4 gap-1">
                        {designArea.availableColors.slice(8).map((color) => (
                          <Tooltip key={color.id}>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => setSelectedColor(color)}
                                className={`w-7 h-7 rounded-full border-2 transition-all hover:scale-110 ${
                                  selectedColor.id === color.id
                                    ? 'border-violet-500 ring-2 ring-violet-200'
                                    : 'border-gray-300 hover:border-gray-400'
                                }`}
                                style={{ backgroundColor: color.hex }}
                                title={color.name}
                              />
                            </TooltipTrigger>
                            <TooltipContent>{color.name}</TooltipContent>
                          </Tooltip>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            </div>

            <Separator orientation="vertical" className="h-8 mx-1" />

            {/* Align */}
            <Popover>
              <Tooltip>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={!hasSelection}
                      className="flex flex-col items-center h-auto py-1 px-3 min-w-[50px]"
                    >
                      <AlignCenter size={20} />
                      <span className="text-[10px] mt-0.5">Align</span>
                    </Button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent>Align element</TooltipContent>
              </Tooltip>
              <PopoverContent className="w-auto p-2" align="start">
                <div className="flex items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={alignLeft}>
                        <AlignStartVertical size={18} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Align left</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={alignCenterH}>
                        <AlignHorizontalDistributeCenter size={18} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Align center horizontal</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={alignRight}>
                        <AlignEndVertical size={18} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Align right</TooltipContent>
                  </Tooltip>

                  <Separator orientation="vertical" className="h-5 mx-1" />

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={alignTop}>
                        <AlignStartHorizontal size={18} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Align top</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={alignCenterV}>
                        <AlignVerticalDistributeCenter size={18} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Align center vertical</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={alignBottom}>
                        <AlignEndHorizontal size={18} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Align bottom</TooltipContent>
                  </Tooltip>

                  <Separator orientation="vertical" className="h-5 mx-1" />

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={centerElement}>
                        <AlignCenter size={18} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Center in design area</TooltipContent>
                  </Tooltip>
                </div>
              </PopoverContent>
            </Popover>

            {/* Flip */}
            <Popover>
              <Tooltip>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={!hasSelection}
                      className="flex flex-col items-center h-auto py-1 px-3 min-w-[50px]"
                    >
                      <FlipHorizontal size={20} />
                      <span className="text-[10px] mt-0.5">Flip</span>
                    </Button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent>Flip element</TooltipContent>
              </Tooltip>
              <PopoverContent className="w-auto p-2" align="start">
                <div className="flex items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 gap-2" onClick={flipHorizontal}>
                        <FlipHorizontal size={18} />
                        <span className="text-xs">Horizontal</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Flip horizontally</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 gap-2" onClick={flipVertical}>
                        <FlipVertical size={18} />
                        <span className="text-xs">Vertical</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Flip vertically</TooltipContent>
                  </Tooltip>
                </div>
              </PopoverContent>
            </Popover>

            {/* Duplicate */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={duplicateElement}
                  disabled={!hasSelection}
                  className="flex flex-col items-center h-auto py-1 px-3 min-w-[50px]"
                >
                  <Copy size={20} />
                  <span className="text-[10px] mt-0.5">Duplicate</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Duplicate element (Ctrl+D)</TooltipContent>
            </Tooltip>

            {/* Save as template */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => alert('Save as template feature coming soon')}
                  disabled={!hasSelection}
                  className="flex flex-col items-center h-auto py-1 px-3 min-w-[80px]"
                >
                  <Save size={20} />
                  <span className="text-[10px] mt-0.5">Save as template</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Save as template</TooltipContent>
            </Tooltip>

            {/* Image Review */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => alert('Image review feature coming soon')}
                  className="flex flex-col items-center h-auto py-1 px-3 min-w-[80px]"
                >
                  <Eye size={20} />
                  <span className="text-[10px] mt-0.5">Image Review</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Review image</TooltipContent>
            </Tooltip>
          </div>

          {/* Right section - Undo/Redo/Grid */}
          <div className="flex items-center gap-1">
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <Button
                variant={currentSide === 'front' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCurrentSide('front')}
                className="h-8 px-3 gap-1.5"
              >
                <Shirt size={16} />
                <span className="text-xs">Old</span>
              </Button>
              <Button
                variant={currentSide === 'back' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCurrentSide('back')}
                className="h-8 px-3 gap-1.5"
              >
                <Shirt size={16} className="rotate-180" />
                <span className="text-xs">Orqa</span>
              </Button>
            </div>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={undo}
                  disabled={!canUndo}
                >
                  <Undo2 size={20} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={redo}
                  disabled={!canRedo}
                >
                  <Redo2 size={20} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Redo (Ctrl+Y)</TooltipContent>
            </Tooltip>

            <Separator orientation="vertical" className="h-6 mx-1" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Toggle
                  pressed={snapToGrid}
                  onPressedChange={setSnapToGrid}
                  size="sm"
                >
                  <Grid3X3 size={20} />
                </Toggle>
              </TooltipTrigger>
              <TooltipContent>Snap to grid</TooltipContent>
            </Tooltip>
          </div>
        </div>

      </div>
    </TooltipProvider>
  )
}
