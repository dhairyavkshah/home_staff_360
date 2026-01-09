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
