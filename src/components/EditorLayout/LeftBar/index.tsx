import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs'
import UploadBar from './UploadBar'
import ImageBar from './ImageBar'
import TextBar from './TextBar'
import ProductsBar from './ProductsBar'
import SavedBar from './SavedBar'
import { Image, Package, Save, Text, Upload } from 'lucide-react'

const SIDEBAR_MENU = [
  {
    id: 1,
    name: "Upload",
    value: "upload",
    icon: Upload
  },
  {
    id: 2,
    name: "Image",
    value: "image",
    icon: Image
  },
  {
    id: 3,
    name: "Text",
    value: "text",
    icon: Text
  },
  {
    id: 4,
    name: "Product",
    value: "product",
    icon: Package
  },
  {
    id: 5,
    name: "Saved",
    value: "saved",
    icon: Save
  }
]

export default function LeftBar() {
  return (
    <div className='w-(--leftbar-width) flex'>
      <Tabs defaultValue="upload" orientation='vertical' className='flex-row w-full gap-0 bg-[#f3f4f6]'>
        <div className='bg-[#f3f4f6] h-full'>
          <TabsList className="flex-col w-[76px] h-min space-y-2 shadow-none bg-none p-0 pl-1 py-3">
            {SIDEBAR_MENU.map((item) => (
              <TabsTrigger key={item.id} value={item.value} className="text-sm cursor-pointer h-12 py-3 w-full justify-center rounded-none rounded-l-xl shadow-none">
                <div className='flex flex-col gap-2 items-center justify-center'>
                  <item.icon className='text-center' />
                  <span className='text-center text-xs'>{item.name}</span>
                </div>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        <div className='flex-1 bg-white rounded-l-xl overflow-hidden border-r border-gray-200 h-full'>
          <TabsContent value="upload" className="h-full">
            <UploadBar />
          </TabsContent>
          <TabsContent value="image" className="h-full">
            <ImageBar />
          </TabsContent>
          <TabsContent value="text" className="h-full">
            <TextBar />
          </TabsContent>
          <TabsContent value="product" className="h-full">
            <ProductsBar />
          </TabsContent>
          <TabsContent value="saved" className="h-full">
            <SavedBar />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
