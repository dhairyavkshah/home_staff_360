// Maximum file size: 20 MB
export const MAX_FILE_SIZE = 20 * 1024 * 1024;

export interface CompressionResult {
  dataUrl: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  outputType: string;
}

/**
 * Process a file for storage.
 * Files under 20 MB are stored without compression.
 * Files are read as base64 data URLs.
 */
export async function compressImage(file: File): Promise<CompressionResult> {
  return new Promise((resolve, reject) => {
    const originalSize = file.size;

    // Check if file exceeds max size
    if (originalSize > MAX_FILE_SIZE) {
      reject(new Error(`File size exceeds maximum limit of 20 MB`));
      return;
    }

    // No compression - just read the file as data URL
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      resolve({
        dataUrl,
        originalSize,
        compressedSize: originalSize,
        compressionRatio: 1,
        outputType: file.type,
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Compress and resize an image for profile pictures.
 * Output is 512x512 pixels maximum, JPEG format with 0.85 quality.
 */
export async function compressProfileImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = () => {
      img.src = reader.result as string;
    };

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // Calculate dimensions to fit within 512x512 while maintaining aspect ratio
      const maxSize = 512;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxSize) {
          height = Math.round((height * maxSize) / width);
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }
      }

      // For profile pictures, make them square by cropping to center
      const cropSize = Math.min(img.width, img.height);
      const cropX = (img.width - cropSize) / 2;
      const cropY = (img.height - cropSize) / 2;

      canvas.width = maxSize;
      canvas.height = maxSize;

      // Draw cropped and resized image
      ctx.drawImage(
        img,
        cropX, cropY, cropSize, cropSize,
        0, 0, maxSize, maxSize
      );

      // Convert to JPEG with quality 0.85
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      resolve(dataUrl);
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    reader.onerror = () => reject(new Error('Failed to read file'));

    reader.readAsDataURL(file);
  });
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function getStorageEstimate(): { used: number; available: number; usedFormatted: string } {
  let totalUsed = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      const value = localStorage.getItem(key);
      if (value) {
        totalUsed += key.length + value.length;
      }
    }
  }
  const usedBytes = totalUsed * 2;
  const estimatedLimit = 5 * 1024 * 1024;
  
  return {
    used: usedBytes,
    available: Math.max(0, estimatedLimit - usedBytes),
    usedFormatted: formatBytes(usedBytes),
  };
}
