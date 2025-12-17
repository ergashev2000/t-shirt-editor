import Header from '@/components/EditorLayout/HeaderBar/HeaderBar'
import MainCanvas from '@/components/EditorLayout/MainCanvas'
import LeftBar from '@/components/EditorLayout/LeftBar'
import RightBar from '@/components/EditorLayout/RightBar'
import { CanvasProvider } from '@/components/EditorLayout/MainCanvas/CanvasContext'

function EditorContent() {
  return (
    <main className='h-screen bg-gray-100'>
      <Header />
      <div className='flex gap-2 h-[calc(100dvh-var(--header-height))] p-1'>
        <main className='w-full h-full rounded-lg bg-white flex'>
          <LeftBar />
          <MainCanvas />
          <RightBar />
        </main>
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
