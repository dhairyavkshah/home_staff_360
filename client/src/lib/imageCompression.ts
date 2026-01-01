const MAX_WIDTH = 1920;
const MAX_HEIGHT = 1920;
const JPEG_QUALITY = 0.8;
const PNG_QUALITY = 0.9;

export interface CompressionResult {
  dataUrl: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  outputType: string;
}

export async function compressImage(
  file: File,
  maxWidth: number = MAX_WIDTH,
  maxHeight: number = MAX_HEIGHT,
  quality: number = JPEG_QUALITY
): Promise<CompressionResult> {
  return new Promise((resolve, reject) => {
    const originalSize = file.size;

    if (!file.type.startsWith('image/')) {
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
      return;
    }

    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      let { width, height } = img;
      const needsResize = width > maxWidth || height > maxHeight;

      if (needsResize) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      canvas.width = width;
      canvas.height = height;

      if (ctx) {
        const isPng = file.type === 'image/png';
        const outputType = isPng ? 'image/png' : 'image/jpeg';
        const outputQuality = isPng ? PNG_QUALITY : quality;
        
        if (!isPng) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        const dataUrl = canvas.toDataURL(outputType, outputQuality);
        const base64Length = dataUrl.split(',')[1]?.length || 0;
        const compressedSize = Math.round((base64Length * 3) / 4);

        if (compressedSize >= originalSize && !needsResize) {
          const reader = new FileReader();
          reader.onload = () => {
            resolve({
              dataUrl: reader.result as string,
              originalSize,
              compressedSize: originalSize,
              compressionRatio: 1,
              outputType: file.type,
            });
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
          return;
        }

        resolve({
          dataUrl,
          originalSize,
          compressedSize,
          compressionRatio: originalSize / compressedSize,
          outputType,
        });
      } else {
        reject(new Error('Canvas context not available'));
      }
    };

    img.onerror = () => reject(new Error('Failed to load image'));

    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
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
