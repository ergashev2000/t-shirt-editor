import Header from '@/components/EditorLayout/HeaderBar/HeaderBar'
import MainCanvas from '@/components/EditorLayout/MainCanvas'
import LeftBar from '@/components/EditorLayout/LeftBar'
import CropSidebar from '@/components/EditorLayout/MainCanvas/CropSidebar'
import { CanvasProvider, useCanvas } from '@/components/EditorLayout/MainCanvas/CanvasContext'

function EditorContent() {
  const { isCropping, selectedEl } = useCanvas()

  return (
    <main className='h-screen bg-gray-100'>
      <Header />
      <div className='flex gap-2 h-[calc(100dvh-var(--header-height))] p-1'>
        <main className='w-[calc(100%-var(--leftbar-width)-2px)] h-full rounded-lg bg-white flex'>
          <LeftBar />
          <MainCanvas />
        </main>
        <aside className='w-(--leftbar-width) h-full rounded-lg bg-white'>
          {isCropping && selectedEl && (
            <CropSidebar element={selectedEl} />
          )}
        </aside>
      </div>
    </main>
  )
}

export default function Editor() {
  return (
    <CanvasProvider>
      <EditorContent />
    </CanvasProvider>
  )
}
