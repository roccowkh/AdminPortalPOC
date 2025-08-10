// Configuration for the application
export const config = {
  // Note: API calls use Vite proxy, so we only need full URL for images
  backendUrl: 'http://localhost:5001',
}

// Utility function to construct image URLs
export function getImageUrl(imagePath: string): string {
  if (imagePath.startsWith('http')) {
    return imagePath
  }

  // Use relative path to go through Vite proxy, avoiding CORS issues
  // Remove leading slash if present to avoid double slashes
  const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath
  return `/${cleanPath}`
}
