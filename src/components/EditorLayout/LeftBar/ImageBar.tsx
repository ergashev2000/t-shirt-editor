import { useQuery } from '@tanstack/react-query';

interface PictureItem {
  id: string
  url: string
  name?: string
  photographer?: string
}

interface PexelsResponse {
  photos: {
    id: number
    url: string
    photographer: string
    src: {
      medium: string
      large: string
    }
    alt: string
  }[]
  total_results: number
  page: number
  per_page: number
}


const EXAMPLE_VECTOR_IMAGES = [
  {
    id: '1',
    url: 'https://ajmall-vc-public-bucket.oss-us-west-1.aliyuncs.com/popshowroom/material/custom_printing/ce8a743d39d447b7a918599b0c899512.png',
    name: 'Example Vector 1',
    photographer: 'Example Photographer'
  },
  {
    id: '2',
    url: 'https://ajmall-vc-public-bucket.oss-accelerate.aliyuncs.com/popshowroom/material/custom_printing/ce2acfd326ff4bd78d63f149047f456a.png',
    name: 'Example Vector 2',
    photographer: 'Example Photographer'
  },
  {
    id: '3',
    url: 'https://ajmall-vc-public-bucket.oss-us-west-1.aliyuncs.com/hugepod/material/ai_template_image/img_0049.png',
    name: 'Example Vector 3',
    photographer: 'Example Photographer'
  }
]

const fetchPictures = async (): Promise<PictureItem[]> => {
  const API_KEY = 'ybDne75Z570K1ZAd5iCuplbyqtNE65OPeiUBfoTDNKXCLoIuT0iurm7S'

  const response = await fetch('https://api.pexels.com/v1/search?query=Vector+art&per_page=500&page=1', {
    headers: {
      'Authorization': API_KEY
    }
  })

  if (!response.ok) {
    throw new Error(`Pexels API error: ${response.status} ${response.statusText}`)
  }

  const pexelsData: PexelsResponse = await response.json()
  const combinedData = [...EXAMPLE_VECTOR_IMAGES, pexelsData];

  return combinedData.flatMap(item => {
    if ('photos' in item) {
      return item.photos.map(photo => ({
        id: photo.id.toString(),
        url: photo.src.large || photo.src.medium,
        name: photo.alt || `Photo by ${photo.photographer}`,
        photographer: photo.photographer
      }));
    } else {
      return [item];
    }
  });
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
