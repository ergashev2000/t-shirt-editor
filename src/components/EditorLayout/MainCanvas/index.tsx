import MainCanvas from './MainCanvas'
import TopBar from './TopBar'

export default function index() {
  return (
    <div className='h-full flex-1 flex flex-col'>
      <TopBar />
      <div className='flex-1 bg-white flex justify-center items-center'>
        <MainCanvas />
      </div>
    </div>
  )
}
