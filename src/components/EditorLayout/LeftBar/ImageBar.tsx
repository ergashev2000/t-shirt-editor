import { useQuery } from '@tanstack/react-query';
import DataExample from './data.json'

interface PictureItem {
  id: string
  url: string
  name?: string
  photographer?: string
}

const fetchPictures = async (): Promise<PictureItem[]> => {

  return DataExample.map((photo) => ({
    id: photo.uniqueId,
    url: photo.urlHd,
    name: photo.name || `Photo by ${photo.userId}`,
    photographer: photo.userId
  }))
}

const checkerboardStyle = {
  backgroundImage: `linear-gradient(45deg, #e0e0e0 25%, transparent 25%), 
                    linear-gradient(-45deg, #e0e0e0 25%, transparent 25%), 
                    linear-gradient(45deg, transparent 75%, #e0e0e0 75%), 
                    linear-gradient(-45deg, transparent 75%, #e0e0e0 75%)`,
  backgroundSize: '16px 16px',
  backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
  backgroundColor: '#ffffff'
}

const ImageBar = () => {

  const {
    data: pictures = [],
    isLoading,
    error,
    isError
  } = useQuery({
    queryKey: ['pictures'],
    queryFn: fetchPictures,
    retry: 2,
    retryDelay: 1000,
    staleTime: 5 * 60 * 1000,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading images...</div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-red-500 text-center p-4">
          <div className="mb-2">{error instanceof Error ? error.message : 'Failed to load images'}</div>
          <div className="text-sm text-gray-400">Please check your API connection</div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto pl-3 pr-1 py-3">
      {pictures.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-500">No images found</div>
        </div>
      ) : (
        <div style={{ columnCount: 2, columnGap: '8px' }}>
          {pictures.map((picture) => (
            <div 
              key={picture.id} 
              className="group cursor-pointer mb-2 break-inside-avoid"
              style={{ ...checkerboardStyle, borderRadius: '8px', overflow: 'hidden' }}
            >
              <img
                className="w-full h-auto block transition-transform group-hover:scale-105"
                src={picture.url}
                alt={picture.name || 'Image'}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', picture.url)
                }}
                onError={(e) => {
                  e.currentTarget.src = '/placeholder-image.jpg'
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageBar;
