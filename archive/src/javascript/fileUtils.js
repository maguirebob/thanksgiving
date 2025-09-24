/**
 * FileUtils - Handles file validation, conversion, and processing
 */
class FileUtils {
  // Allowed image types
  static ALLOWED_IMAGE_TYPES = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp'
  ];

  // Default file size limit (5MB)
  static DEFAULT_MAX_SIZE = 5 * 1024 * 1024;

  /**
   * Validate file (general validation)
   */
  static validateFile(file) {
    if (!file || !file.type) {
      return false;
    }

    return this.validateImageFile(file) && this.validateFileSize(file);
  }

  /**
   * Validate image file
   */
  static validateImageFile(file) {
    if (!file || !file.type) {
      return false;
    }

    return this.ALLOWED_IMAGE_TYPES.includes(file.type.toLowerCase());
  }

  /**
   * Validate file size
   */
  static validateFileSize(file, maxSize = this.DEFAULT_MAX_SIZE) {
    if (!file || !file.size) {
      return false;
    }

    return file.size <= maxSize;
  }

  /**
   * Validate file type
   */
  static validateFileType(file, allowedTypes) {
    if (!file || !file.type) {
      return false;
    }

    return allowedTypes.includes(file.type.toLowerCase());
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
      type: file.type,
      size: file.size,
      lastModified: file.lastModified
    };
  }

  /**
   * Get MIME type from filename
   */
  static getMimeType(filename) {
    const extension = filename.toLowerCase().split('.').pop();
    
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
    if (!base64Data) return 0;
    
    // Remove data URL prefix if present
    const base64 = base64Data.split(',')[1] || base64Data;
    
    // Calculate size: base64 is 4/3 the size of the original data
    return Math.round((base64.length * 3) / 4);
  }

  /**
   * Format file size for display
   */
  static formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Check if file is too large
   */
  static isFileTooLarge(file, maxSize = this.DEFAULT_MAX_SIZE) {
    return file.size > maxSize;
  }

  /**
   * Get file extension
   */
  static getFileExtension(filename) {
    return filename.toLowerCase().split('.').pop();
  }

  /**
   * Check if file extension is allowed
   */
  static isExtensionAllowed(filename, allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp']) {
    const extension = this.getFileExtension(filename);
    return allowedExtensions.includes(extension);
  }
}

module.exports = { FileUtils };
