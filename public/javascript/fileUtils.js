/**
 * FileUtils - Utility functions for file handling
 * Browser-compatible version
 */
class FileUtils {
  /**
   * Validate file type and size
   */
  static validateFile(file, maxSize = 10 * 1024 * 1024) { // 10MB default
    if (!file) return false;
    
    // Check file type
    if (!this.validateImageFile(file)) return false;
    
    // Check file size
    if (!this.validateFileSize(file, maxSize)) return false;
    
    return true;
  }

  /**
   * Validate image file type
   */
  static validateImageFile(file) {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    return allowedTypes.includes(file.type);
  }

  /**
   * Validate file size
   */
  static validateFileSize(file, maxSize = 10 * 1024 * 1024) {
    return file.size <= maxSize;
  }

  /**
   * Convert file to base64
   */
  static async fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        resolve(reader.result);
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsDataURL(file);
    });
  }

  /**
   * Convert base64 to blob
   */
  static async base64ToBlob(base64, mimeType = 'image/jpeg') {
    const response = await fetch(base64);
    return await response.blob();
  }

  /**
   * Compress image
   */
  static async compressImage(file, quality = 0.8) {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      const mimeType = file.type || 'image/jpeg';

      img.onload = () => {
        // Calculate new dimensions (optional: resize if too large)
        let { width, height } = img;
        const maxWidth = 1920;
        const maxHeight = 1080;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: mimeType,
              lastModified: Date.now()
            });
            resolve(compressedFile);
          } else {
            reject(new Error('Failed to compress image'));
          }
        }, mimeType, quality);
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Get file information
   */
  static getFileInfo(file) {
    return {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified
    };
  }

  /**
   * Get MIME type from filename
   */
  static getMimeType(filename) {
    const extension = filename.split('.').pop().toLowerCase();
    const mimeTypes = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp'
    };
    return mimeTypes[extension] || 'image/jpeg';
  }

  /**
   * Calculate file size from base64 data
   */
  static calculateFileSize(base64Data) {
    // Remove data URL prefix if present
    const base64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
    // Calculate size: base64 is 4/3 the size of the original data
    return Math.round((base64.length * 3) / 4);
  }
}
