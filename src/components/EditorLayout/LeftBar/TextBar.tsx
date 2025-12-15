import React, { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Palette, Type, Sparkles } from 'lucide-react'

// Font style configurations
const FONT_STYLES = [
  { id: 'bold-modern', name: 'Bold Modern', fontFamily: 'Impact, sans-serif', fontWeight: 'bold', letterSpacing: '2px', textTransform: 'uppercase' as const },
  { id: 'elegant-script', name: 'Elegant Script', fontFamily: 'Georgia, serif', fontWeight: 'normal', fontStyle: 'italic', letterSpacing: '1px' },
  { id: 'retro-block', name: 'Retro Block', fontFamily: 'Arial Black, sans-serif', fontWeight: 'bold', letterSpacing: '4px', textTransform: 'uppercase' as const },
  { id: 'handwritten', name: 'Handwritten', fontFamily: 'Comic Sans MS, cursive', fontWeight: 'normal', letterSpacing: '0px' },
  { id: 'minimal', name: 'Minimal', fontFamily: 'Helvetica, Arial, sans-serif', fontWeight: '300', letterSpacing: '3px', textTransform: 'uppercase' as const },
  { id: 'vintage', name: 'Vintage', fontFamily: 'Times New Roman, serif', fontWeight: 'bold', letterSpacing: '2px' },
  { id: 'grunge', name: 'Grunge', fontFamily: 'Impact, sans-serif', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase' as const },
  { id: 'neon', name: 'Neon', fontFamily: 'Arial, sans-serif', fontWeight: 'bold', letterSpacing: '2px' },
]

// Ready-to-use quotes
const READY_QUOTES = [
  { id: 'q1', text: 'DREAM BIG', color: '#8B5CF6' },
  { id: 'q2', text: 'STAY WILD', color: '#10B981' },
  { id: 'q3', text: 'BE YOURSELF', color: '#F59E0B' },
  { id: 'q4', text: 'NEVER GIVE UP', color: '#EF4444' },
  { id: 'q5', text: 'GOOD VIBES ONLY', color: '#3B82F6' },
  { id: 'q6', text: 'MAKE IT HAPPEN', color: '#EC4899' },
  { id: 'q7', text: 'JUST DO IT', color: '#000000' },
  { id: 'q8', text: 'LOVE YOURSELF', color: '#F472B6' },
]

// Color palette
const COLOR_PALETTE = [
  '#000000', '#FFFFFF', '#EF4444', '#F97316', '#F59E0B', '#84CC16',
  '#10B981', '#06B6D4', '#3B82F6', '#8B5CF6', '#EC4899', '#6B7280'
]

interface TextArtItem {
  id: string
  text: string
  style: typeof FONT_STYLES[0]
  color: string
  dataUrl: string
}

export default function TextBar() {
  const [inputText, setInputText] = useState('')
  const [selectedColor, setSelectedColor] = useState('#000000')
  const [generatedArts, setGeneratedArts] = useState<TextArtItem[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Generate text art as image
  const generateTextArt = useCallback(async (text: string, style: typeof FONT_STYLES[0], color: string): Promise<string> => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return ''

    // Set font
    const fontSize = 48
    const fontStyle = style.fontStyle || 'normal'
    const fontWeight = style.fontWeight || 'normal'
    ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${style.fontFamily}`

    // Measure text
    const metrics = ctx.measureText(text)
    const textWidth = metrics.width + 40
    const textHeight = fontSize + 40

    // Set canvas size
    canvas.width = textWidth
    canvas.height = textHeight

    // Clear and set background transparent
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Set font again after resize
    ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${style.fontFamily}`
    ctx.fillStyle = color
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    // Apply letter spacing manually
    if (style.letterSpacing && style.letterSpacing !== '0px') {
      const spacing = parseInt(style.letterSpacing)
      let x = 20
      const chars = style.textTransform === 'uppercase' ? text.toUpperCase().split('') : text.split('')
      ctx.textAlign = 'left'
      chars.forEach(char => {
        ctx.fillText(char, x, canvas.height / 2)
        x += ctx.measureText(char).width + spacing
      })
    } else {
      const displayText = style.textTransform === 'uppercase' ? text.toUpperCase() : text
      ctx.fillText(displayText, canvas.width / 2, canvas.height / 2)
    }

    return canvas.toDataURL('image/png')
  }, [])

  // Create WordArt - generate all styles
  const handleCreateWordArt = useCallback(async () => {
    if (!inputText.trim()) return

    setIsGenerating(true)
    const newArts: TextArtItem[] = []

    for (const style of FONT_STYLES) {
      const dataUrl = await generateTextArt(inputText, style, selectedColor)
      newArts.push({
        id: `${style.id}-${Date.now()}`,
        text: inputText,
        style,
        color: selectedColor,
        dataUrl
      })
    }

    setGeneratedArts(newArts)
    setIsGenerating(false)
  }, [inputText, selectedColor, generateTextArt])

  // Handle drag start for text art
  const handleDragStart = useCallback((e: React.DragEvent, art: TextArtItem) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'text-art',
      content: art.dataUrl,
      text: art.text
    }))
    e.dataTransfer.effectAllowed = 'copy'
  }, [])

  // Handle click to add to canvas
  const handleAddToCanvas = useCallback((art: TextArtItem) => {
    const event = new CustomEvent('addImageToCanvas', {
      detail: { src: art.dataUrl }
    })
    window.dispatchEvent(event)
  }, [])

  // Handle quote click
  const handleQuoteClick = useCallback(async (quote: typeof READY_QUOTES[0]) => {
    const style = FONT_STYLES[0] // Use bold modern for quotes
    const dataUrl = await generateTextArt(quote.text, style, quote.color)
    const event = new CustomEvent('addImageToCanvas', {
      detail: { src: dataUrl }
    })
    window.dispatchEvent(event)
  }, [generateTextArt])

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
          <Type className="w-4 h-4" />
          Text Art
        </h3>

        {/* Text Input */}
        <Input
          placeholder="Matn kiriting..."
          value={inputText}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputText(e.target.value)}
          className="mb-3"
        />

        {/* Color Picker */}
        <div className="mb-3">
          <label className="text-xs text-gray-500 mb-2 block flex items-center gap-1">
            <Palette className="w-3 h-3" />
            Rang tanlang
          </label>
          <div className="flex flex-wrap gap-1.5">
            {COLOR_PALETTE.map(color => (
              <button
                key={color}
                className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                  selectedColor === color ? 'border-violet-500 ring-2 ring-violet-200' : 'border-gray-200'
                }`}
                style={{ backgroundColor: color }}
                onClick={() => setSelectedColor(color)}
              />
            ))}
          </div>
        </div>

        {/* Create Button */}
        <Button
          className="w-full"
          onClick={handleCreateWordArt}
          disabled={!inputText.trim() || isGenerating}
        >
          <Sparkles className="w-4 h-4 mr-2" />
          {isGenerating ? 'Yaratilmoqda...' : 'Create WordArt'}
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4">
          {/* Generated Arts */}
          {generatedArts.length > 0 && (
            <div className="mb-6">
              <h4 className="text-xs font-medium text-gray-500 mb-3">Yaratilgan dizaynlar</h4>
              <div className="space-y-2">
                {generatedArts.map(art => (
                  <div
                    key={art.id}
                    className="bg-gray-50 rounded-lg p-3 cursor-pointer hover:bg-gray-100 transition-colors border border-transparent hover:border-violet-300"
                    draggable
                    onDragStart={(e) => handleDragStart(e, art)}
                    onClick={() => handleAddToCanvas(art)}
                  >
                    <img
                      src={art.dataUrl}
                      alt={art.text}
                      className="w-full h-auto"
                      style={{ imageRendering: 'crisp-edges' }}
                    />
                    <p className="text-xs text-gray-400 mt-1 text-center">{art.style.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Separator className="my-4" />

          {/* Font Combinations Preview */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-medium text-gray-500">Font kombinatsiyalari</h4>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {FONT_STYLES.slice(0, 6).map(style => (
                <div
                  key={style.id}
                  className="bg-gray-50 rounded-lg p-3 text-center cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => {
                    if (inputText.trim()) {
                      generateTextArt(inputText || 'YOUR TEXT', style, selectedColor).then(dataUrl => {
                        const event = new CustomEvent('addImageToCanvas', {
                          detail: { src: dataUrl }
                        })
                        window.dispatchEvent(event)
                      })
                    }
                  }}
                >
                  <span
                    style={{
                      fontFamily: style.fontFamily,
                      fontWeight: style.fontWeight as string,
                      fontStyle: style.fontStyle,
                      letterSpacing: style.letterSpacing,
                      textTransform: style.textTransform,
                      fontSize: '12px',
                      color: selectedColor
                    }}
                  >
                    {inputText || 'YOUR TEXT'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <Separator className="my-4" />

          {/* Ready to use quotes */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-medium text-gray-500">Tayyor sitatalar</h4>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {READY_QUOTES.map(quote => (
                <div
                  key={quote.id}
                  className="bg-gray-50 rounded-lg p-3 text-center cursor-pointer hover:bg-gray-100 transition-colors border border-transparent hover:border-violet-300"
                  onClick={() => handleQuoteClick(quote)}
                >
                  <span
                    style={{
                      fontFamily: 'Impact, sans-serif',
                      fontWeight: 'bold',
                      fontSize: '11px',
                      color: quote.color
                    }}
                  >
                    {quote.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Hidden canvas for generation */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  )
}
