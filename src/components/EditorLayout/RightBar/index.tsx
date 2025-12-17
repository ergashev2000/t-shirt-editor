import Attributes from './Attributes'
import CropSidebar from '../MainCanvas/CropSidebar'
import { useCanvas } from '../MainCanvas/CanvasContext'

export default function RightBar() {
  const { isCropping, selectedEl } = useCanvas()

  return (
    <aside className='w-(--leftbar-width) h-full rounded-lg bg-white shrink-0'>
      {isCropping && selectedEl ? (
        <CropSidebar element={selectedEl} />
      ) : (
        <Attributes />
      )}
    </aside>
  )
}
