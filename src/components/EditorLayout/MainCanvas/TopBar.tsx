import { Scan, ZoomIn, ZoomOut } from 'lucide-react'

export default function TopBar() {
  return (
    <div className='h-14 flex justify-between items-center w-full border-b border-gray-200 px-3'>
      <div className='flex gap-6 items-center justify-center'>
        <span className='w-5 h-5 rounded-full bg-red-600 outline outline-red-600 outline-offset-2'></span>
        <span className='w-5 h-5 rounded-full bg-green-600 outline outline-green-600 outline-offset-2'></span>
        <span className='w-5 h-5 rounded-full bg-blue-600 outline outline-blue-600 outline-offset-2'></span>
      </div>

      <div className='flex gap-6 items-center justify-center'>
        <span>
          <Scan />
        </span>
        <span>
          <ZoomIn />
        </span>
        <span>
          <ZoomOut />
        </span>
      </div>
    </div>
  )
}
