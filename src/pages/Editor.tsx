import Header from '@/components/EditorLayout/HeaderBar/HeaderBar'
import MainCanvas from '@/components/EditorLayout/MainCanvas/MainCanvas'
import LeftBar from '@/components/EditorLayout/LeftBar'

export default function Editor() {
  return (
    <main className='h-screen bg-gray-100'>
      <Header />
      <div className='flex gap-2 h-[calc(100dvh-var(--header-height))] p-1'>
        <main className='w-[calc(100%-var(--leftbar-width)-2px)] h-full rounded-lg bg-white flex gap-2'>
          <LeftBar />
          <div>
            <MainCanvas />
          </div>
        </main>
        <aside className='w-(--leftbar-width) h-full rounded-lg bg-white'>

        </aside>
      </div>
    </main>
  )
}
