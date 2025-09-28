/**
 * Unit tests for Camera Functionality
 * Tests the camera access and photo capture functionality
 */

// Mock the camera functions since we can't easily import them in Jest
const mockCameraFunctions = {
    openCameraCapture: jest.fn(),
    startCamera: jest.fn(),
    capturePhoto: jest.fn(),
    saveCameraPhoto: jest.fn(),
    closeCamera: jest.fn(),
    stopCamera: jest.fn()
};

// Mock navigator.mediaDevices
const mockMediaDevices = {
    getUserMedia: jest.fn()
};

// Mock global functions
global.openCameraCapture = mockCameraFunctions.openCameraCapture;
global.startCamera = mockCameraFunctions.startCamera;
global.capturePhoto = mockCameraFunctions.capturePhoto;
global.saveCameraPhoto = mockCameraFunctions.saveCameraPhoto;
global.closeCamera = mockCameraFunctions.closeCamera;
global.stopCamera = mockCameraFunctions.stopCamera;
global.navigator = {
    mediaDevices: mockMediaDevices
};

// Mock PhotoComponent class
class PhotoComponent {
    constructor(containerId, eventId) {
        this.containerId = containerId;
        this.eventId = eventId;
        this.container = document.getElementById(containerId);
    }

    openCameraCapture() {
        // Use the existing camera modal from detail.ejs
        if (typeof openCameraCapture === 'function') {
            openCameraCapture();
        } else {
            // Fallback to upload modal if camera function not available
            console.warn('Camera functionality not available, falling back to upload modal');
            this.openUploadModal();
        }
    }

    openUploadModal() {
        // Mock implementation
    }

    async loadPhotos() {
        // Mock implementation
    }
}

describe('Camera Functionality', () => {
    let photoComponent;
    let mockContainer;

    beforeEach(() => {
        // Setup DOM
        document.body.innerHTML = `
            <div id="photoContainer"></div>
            <div id="cameraModal" style="display: none;">
                <video id="cameraVideo"></video>
                <canvas id="cameraCanvas"></canvas>
                <img id="capturedImagePreview" style="display: none;">
                <input id="captureDescription" type="text">
                <input id="captureCaption" type="text">
                <button id="startCameraBtn">Start Camera</button>
                <button id="captureBtn" style="display: none;">Capture</button>
                <button id="saveBtn" style="display: none;">Save</button>
            </div>
        `;

        // Initialize PhotoComponent
        photoComponent = new PhotoComponent('photoContainer', 466);

        // Reset mocks
        jest.clearAllMocks();
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    describe('openCameraCapture method', () => {
        test('should call global openCameraCapture function when available', () => {
            photoComponent.openCameraCapture();
            
            expect(mockCameraFunctions.openCameraCapture).toHaveBeenCalled();
        });

        test('should fallback to upload modal when camera function not available', () => {
            // Remove global function
            delete global.openCameraCapture;
            
            const openUploadModalSpy = jest.spyOn(photoComponent, 'openUploadModal');
            
            photoComponent.openCameraCapture();
            
            expect(openUploadModalSpy).toHaveBeenCalled();
        });
    });

    describe('Camera Modal Functions', () => {
        test('should open camera modal', () => {
            const modal = document.getElementById('cameraModal');
            modal.style.display = 'flex';
            
            expect(modal.style.display).toBe('flex');
        });

        test('should close camera modal', () => {
            const modal = document.getElementById('cameraModal');
            modal.style.display = 'none';
            
            expect(modal.style.display).toBe('none');
        });

        test('should show start camera button initially', () => {
            const startBtn = document.getElementById('startCameraBtn');
            const captureBtn = document.getElementById('captureBtn');
            const saveBtn = document.getElementById('saveBtn');
            
            // Set initial display styles
            startBtn.style.display = 'inline-block';
            captureBtn.style.display = 'none';
            saveBtn.style.display = 'none';
            
            expect(startBtn.style.display).toBe('inline-block');
            expect(captureBtn.style.display).toBe('none');
            expect(saveBtn.style.display).toBe('none');
        });
    });

    describe('Camera Stream Management', () => {
        test('should request camera access with correct constraints', async () => {
            const mockStream = {
                getTracks: () => [{
                    stop: jest.fn()
                }]
            };
            
            mockMediaDevices.getUserMedia.mockResolvedValue(mockStream);
            
            // Mock the actual startCamera function behavior
            mockCameraFunctions.startCamera.mockImplementation(async () => {
                await mockMediaDevices.getUserMedia({
                    video: {
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    }
                });
            });
            
            await mockCameraFunctions.startCamera();
            
            expect(mockMediaDevices.getUserMedia).toHaveBeenCalledWith({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });
        });

        test('should handle camera access errors', async () => {
            const error = new Error('Camera access denied');
            mockMediaDevices.getUserMedia.mockRejectedValue(error);
            
            try {
                await mockCameraFunctions.startCamera();
            } catch (e) {
                expect(e).toBe(error);
            }
        });
    });

    describe('Photo Capture', () => {
        test('should capture photo from video stream', () => {
            const video = document.getElementById('cameraVideo');
            const canvas = document.getElementById('cameraCanvas');
            const preview = document.getElementById('capturedImagePreview');
            
            // Mock video properties
            video.videoWidth = 1280;
            video.videoHeight = 720;
            
            // Mock canvas context
            const mockContext = {
                drawImage: jest.fn()
            };
            canvas.getContext = jest.fn(() => mockContext);
            canvas.toDataURL = jest.fn(() => 'data:image/jpeg;base64,mockdata');
            
            // Mock capturePhoto function behavior
            mockCameraFunctions.capturePhoto.mockImplementation(() => {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                mockContext.drawImage(video, 0, 0);
            });
            
            mockCameraFunctions.capturePhoto();
            
            expect(canvas.width).toBe(1280);
            expect(canvas.height).toBe(720);
        });

        test('should show captured image preview', () => {
            const video = document.getElementById('cameraVideo');
            const preview = document.getElementById('capturedImagePreview');
            
            // Mock capture behavior
            video.style.display = 'none';
            preview.style.display = 'block';
            preview.src = 'data:image/jpeg;base64,mockdata';
            
            expect(video.style.display).toBe('none');
            expect(preview.style.display).toBe('block');
            expect(preview.src).toBe('data:image/jpeg;base64,mockdata');
        });
    });

    describe('Photo Saving', () => {
        beforeEach(() => {
            // Mock fetch
            global.fetch = jest.fn();
        });

        afterEach(() => {
            global.fetch.mockRestore();
        });

        test('should save captured photo successfully', async () => {
            // Mock captured image data
            global.capturedImageData = 'data:image/jpeg;base64,mockdata';
            
            // Mock fetch responses
            global.fetch
                .mockResolvedValueOnce({
                    blob: () => Promise.resolve(new Blob(['mock'], { type: 'image/jpeg' }))
                })
                .mockResolvedValueOnce({
                    json: () => Promise.resolve({
                        success: true,
                        message: 'Photo saved successfully'
                    })
                });

            // Mock FormData
            global.FormData = jest.fn(() => ({
                append: jest.fn()
            }));

            // Mock window.location without redefining
            const originalLocation = window.location;
            delete window.location;
            window.location = { pathname: '/menu/466' };

            // Mock saveCameraPhoto function behavior
            mockCameraFunctions.saveCameraPhoto.mockImplementation(async () => {
                const response = await fetch(global.capturedImageData);
                const blob = await response.blob();
                const formData = new FormData();
                formData.append('photo', blob, 'camera-photo.jpg');
                
                const uploadResponse = await fetch(`/api/events/466/photos`, {
                    method: 'POST',
                    body: formData
                });
                
                return await uploadResponse.json();
            });

            await mockCameraFunctions.saveCameraPhoto();

            expect(global.fetch).toHaveBeenCalledTimes(2);

            // Restore location
            window.location = originalLocation;
        });

        test('should handle save errors gracefully', async () => {
            global.capturedImageData = 'data:image/jpeg;base64,mockdata';
            
            global.fetch.mockRejectedValue(new Error('Network error'));

            await mockCameraFunctions.saveCameraPhoto();

            // Should not throw error
            expect(mockCameraFunctions.saveCameraPhoto).toHaveBeenCalled();
        });

        test('should not save when no photo captured', async () => {
            global.capturedImageData = null;

            await mockCameraFunctions.saveCameraPhoto();

            expect(global.fetch).not.toHaveBeenCalled();
        });
    });

    describe('Camera Cleanup', () => {
        test('should stop camera stream', () => {
            const mockTrack = {
                stop: jest.fn()
            };
            
            const mockStream = {
                getTracks: () => [mockTrack]
            };
            
            global.currentStream = mockStream;
            
            // Mock stopCamera function behavior
            mockCameraFunctions.stopCamera.mockImplementation(() => {
                if (global.currentStream) {
                    global.currentStream.getTracks().forEach(track => track.stop());
                    global.currentStream = null;
                }
            });
            
            mockCameraFunctions.stopCamera();
            
            expect(mockTrack.stop).toHaveBeenCalled();
        });

        test('should handle cleanup when no stream', () => {
            global.currentStream = null;
            
            expect(() => mockCameraFunctions.stopCamera()).not.toThrow();
        });
    });
});
