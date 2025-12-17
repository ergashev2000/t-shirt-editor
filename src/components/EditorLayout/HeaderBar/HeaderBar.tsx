import Logo from '/images/logo-light.png'

export default function HeaderBar() {
  return (
    <header className='h-(--header-height) w-full flex items-center p-1'>
      <div className='bg-[#2b2d2e] w-full h-full flex items-center px-1 rounded-lg'>
        <div className='px-3'>
          <img src={Logo} className='h-6' />
        </div>
        <div className='flex gap-4 items-center'>
          <button className='px-4 rounded-md py-1 bg-white'>Back</button>
          <div>
            <span className='text-base font-medium text-white'>Snow Washed Oversized Cotton T-Shirt</span>
          </div>
        </div>
      </div>
    </header>
  )
}
