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

const distributeIntoColumns = (items: PictureItem[], columnCount: number) => {
  const columns: PictureItem[][] = Array.from({ length: columnCount }, () => [])

  items.forEach((item, index) => {
    const columnIndex = index % columnCount
    columns[columnIndex].push(item)
  })

  return columns
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

  const columns = distributeIntoColumns(pictures, 2)

  return (
    <div className="h-full overflow-y-auto pl-3 pr-1 py-3">
      <div className="grid grid-cols-2 gap-2">
        {columns.map((column, columnIndex) => (
          <div key={columnIndex} className="grid gap-2">
            {column.map((picture) => (
              <div key={picture.id} className="group cursor-pointer">
                <img
                  className="h-auto max-w-full rounded-lg transition-transform group-hover:scale-105"
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
        ))}
      </div>
      {pictures.length === 0 && (
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-500">No images found</div>
        </div>
      )}
    </div>
  );
};

export default ImageBar;
