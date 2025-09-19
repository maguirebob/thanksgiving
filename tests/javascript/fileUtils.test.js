const { FileUtils } = require('../../src/javascript/fileUtils');

describe('FileUtils', () => {
  describe('validateFile', () => {
    test('should validate valid image file', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      expect(FileUtils.validateFile(file)).toBe(true);
    });

    test('should reject non-image file', () => {
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });
      
      expect(FileUtils.validateFile(file)).toBe(false);
    });

    test('should reject file without type', () => {
      const file = new File(['test'], 'test');
      
      expect(FileUtils.validateFile(file)).toBe(false);
    });
  });

  describe('validateImageFile', () => {
    test('should validate image files', () => {
      const jpgFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const pngFile = new File(['test'], 'test.png', { type: 'image/png' });
      const gifFile = new File(['test'], 'test.gif', { type: 'image/gif' });
      const webpFile = new File(['test'], 'test.webp', { type: 'image/webp' });

      expect(FileUtils.validateImageFile(jpgFile)).toBe(true);
      expect(FileUtils.validateImageFile(pngFile)).toBe(true);
      expect(FileUtils.validateImageFile(gifFile)).toBe(true);
      expect(FileUtils.validateImageFile(webpFile)).toBe(true);
    });

    test('should reject non-image files', () => {
      const txtFile = new File(['test'], 'test.txt', { type: 'text/plain' });
      const pdfFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });

      expect(FileUtils.validateImageFile(txtFile)).toBe(false);
      expect(FileUtils.validateImageFile(pdfFile)).toBe(false);
    });
  });

  describe('validateFileSize', () => {
    test('should validate file within size limit', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 1024 * 1024 }); // 1MB

      expect(FileUtils.validateFileSize(file, 5 * 1024 * 1024)).toBe(true);
    });

    test('should reject file exceeding size limit', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 10 * 1024 * 1024 }); // 10MB

      expect(FileUtils.validateFileSize(file, 5 * 1024 * 1024)).toBe(false);
    });

    test('should use default size limit', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 6 * 1024 * 1024 }); // 6MB

      expect(FileUtils.validateFileSize(file)).toBe(false);
    });
  });

  describe('validateFileType', () => {
    test('should validate file with allowed type', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const allowedTypes = ['image/jpeg', 'image/png'];

      expect(FileUtils.validateFileType(file, allowedTypes)).toBe(true);
    });

    test('should reject file with disallowed type', () => {
      const file = new File(['test'], 'test.gif', { type: 'image/gif' });
      const allowedTypes = ['image/jpeg', 'image/png'];

      expect(FileUtils.validateFileType(file, allowedTypes)).toBe(false);
    });
  });

  describe('fileToBase64', () => {
    test('should convert file to base64', async () => {
      const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });
      
      const result = await FileUtils.fileToBase64(file);
      
      expect(typeof result).toBe('string');
      expect(result).toMatch(/^data:image\/jpeg;base64,/);
    }, 15000);

    test('should handle file read errors', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      // Mock FileReader to throw error
      const originalFileReader = window.FileReader;
      window.FileReader = jest.fn().mockImplementation(() => ({
        readAsDataURL: jest.fn().mockImplementation(() => {
          throw new Error('Read error');
        }),
        result: null,
        onload: null,
        onerror: null
      }));

      await expect(FileUtils.fileToBase64(file))
        .rejects.toThrow('Read error');

      window.FileReader = originalFileReader;
    });
  });

  describe('base64ToBlob', () => {
    test('should convert base64 to blob', async () => {
      const base64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD';
      const mimeType = 'image/jpeg';
      
      // Mock fetch to return a proper response
      global.fetch = jest.fn().mockResolvedValue({
        blob: () => Promise.resolve(new Blob(['mock'], { type: mimeType }))
      });
      
      const blob = await FileUtils.base64ToBlob(base64, mimeType);
      
      expect(blob).toBeDefined();
      expect(blob.type).toBe(mimeType);
    });
  });

  describe('compressImage', () => {
    test('should compress image with specified quality', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      // Mock Image to trigger onload immediately
      const mockImage = {
        src: '',
        width: 100,
        height: 100,
        naturalWidth: 100,
        naturalHeight: 100,
        complete: false,
        onload: null,
        onerror: null
      };
      
      global.Image = jest.fn().mockImplementation(() => mockImage);
      
      // Trigger onload immediately
      setTimeout(() => {
        if (mockImage.onload) mockImage.onload();
      }, 0);
      
      const compressedFile = await FileUtils.compressImage(file, 0.5);
      
      expect(compressedFile).toBeInstanceOf(File);
      expect(compressedFile.type).toBe('image/jpeg');
    }, 15000);

    test('should use default quality if not specified', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      // Mock Image to trigger onload immediately
      const mockImage = {
        src: '',
        width: 100,
        height: 100,
        naturalWidth: 100,
        naturalHeight: 100,
        complete: false,
        onload: null,
        onerror: null
      };
      
      global.Image = jest.fn().mockImplementation(() => mockImage);
      
      // Trigger onload immediately
      setTimeout(() => {
        if (mockImage.onload) mockImage.onload();
      }, 0);
      
      const compressedFile = await FileUtils.compressImage(file);
      
      expect(compressedFile).toBeInstanceOf(File);
    }, 15000);
  });

  describe('getFileInfo', () => {
    test('should return file information', () => {
      const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 1024 });
      
      const info = FileUtils.getFileInfo(file);
      
      expect(info).toEqual({
        name: 'test.jpg',
        type: 'image/jpeg',
        size: 1024,
        lastModified: file.lastModified
      });
    });
  });

  describe('getMimeType', () => {
    test('should return correct MIME type for jpg', () => {
      expect(FileUtils.getMimeType('test.jpg')).toBe('image/jpeg');
      expect(FileUtils.getMimeType('test.JPG')).toBe('image/jpeg');
      expect(FileUtils.getMimeType('test.jpeg')).toBe('image/jpeg');
    });

    test('should return correct MIME type for png', () => {
      expect(FileUtils.getMimeType('test.png')).toBe('image/png');
      expect(FileUtils.getMimeType('test.PNG')).toBe('image/png');
    });

    test('should return correct MIME type for gif', () => {
      expect(FileUtils.getMimeType('test.gif')).toBe('image/gif');
      expect(FileUtils.getMimeType('test.GIF')).toBe('image/gif');
    });

    test('should return correct MIME type for webp', () => {
      expect(FileUtils.getMimeType('test.webp')).toBe('image/webp');
      expect(FileUtils.getMimeType('test.WEBP')).toBe('image/webp');
    });

    test('should return default MIME type for unknown extension', () => {
      expect(FileUtils.getMimeType('test.unknown')).toBe('image/jpeg');
    });
  });

  describe('calculateFileSize', () => {
    test('should calculate file size from base64 data', () => {
      const base64Data = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      
      const size = FileUtils.calculateFileSize(base64Data);
      
      expect(typeof size).toBe('number');
      expect(size).toBeGreaterThan(0);
    });

    test('should handle empty base64 data', () => {
      const size = FileUtils.calculateFileSize('');
      
      expect(size).toBe(0);
    });
  });
});
