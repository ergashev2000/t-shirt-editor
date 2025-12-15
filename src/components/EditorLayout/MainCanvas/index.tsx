import MainCanvas from './MainCanvas'
import TopBar from './TopBar'
import { CanvasProvider, useCanvas } from './CanvasContext'
import CropSidebar from './CropSidebar'

function MainCanvasWithCrop() {
  const { isCropping, selectedEl } = useCanvas()
  
  return (
    <div className='h-full w-[calc(100%-var(--leftbar-width)-2px)] flex'>
      {/* Crop Sidebar - shows when cropping */}
      {isCropping && selectedEl && (
        <CropSidebar element={selectedEl} />
      )}
      
      <div className='flex-1 flex flex-col'>
        <TopBar />
        <div className='flex-1 bg-white flex justify-center items-center'>
          <MainCanvas />
        </div>
      </div>
    </div>
  )
}

export default function index() {
  return (
    <CanvasProvider>
      <MainCanvasWithCrop />
    </CanvasProvider>
  )
}
