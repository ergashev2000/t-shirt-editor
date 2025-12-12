import MainCanvas from './MainCanvas'
import TopBar from './TopBar'

export default function index() {
  return (
    <div className='h-full w-[calc(100%-var(--leftbar-width)-2px)]'>
      <TopBar />
      <MainCanvas />
    </div>
  )
}
