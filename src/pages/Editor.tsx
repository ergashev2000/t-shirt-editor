import Header from '@/components/EditorLayout/HeaderBar/HeaderBar'
import MainCanvas from '@/components/EditorLayout/MainCanvas/MainCanvas'

const SIDEBAR_MENU = [
  {
    id: 1,
    name: "Upload",
    icon: "",
    link: ""
  },
  {
    id: 2,
    name: "Image",
    icon: "",
    link: ""
  },
  {
    id: 3,
    name: "Text",
    icon: "",
    link: ""
  },
  {
    id: 4,
    name: "Product",
    icon: "",
    link: ""
  },
  {
    id: 5,
    name: "Saved",
    icon: "",
    link: ""
  }
]

export default function Editor() {
  return (
    <main className='h-screen bg-gray-100'>
      <Header />
      <div className='flex gap-2 h-[calc(100vh-48px)] px-1'>
        <main className='w-[calc(100%-340px-2px)] h-full rounded-lg bg-white flex gap-2'>
          <div className='w-[380px] h-full flex gap-2'>
            <div className='h-full bg-gray-400 w-[60px]'>
              <ul className='space-y-1 px-1 py-2'>
                {SIDEBAR_MENU.map((item) => (
                  <li key={item.id}>
                    <a href={item.link} className='w-full flex bg-red-200 text-sm h-12 items-center justify-center'>{item.name}</a>
                  </li>
                ))}
              </ul>
            </div>
            <div className='h-full bg-gray-300 w-[280px]'>

            </div>
          </div>
          <div>
            <MainCanvas />
          </div>
        </main>
        <aside className='w-[380px] h-full rounded-lg bg-white'>

        </aside>
      </div>
    </main>
  )
}
