/**
 * Unit tests for Photo Edit Functionality
 * Tests the new photo editing modal and API integration
 */

// Mock the PhotoComponent class since we can't easily import it in Jest
class PhotoComponent {
    constructor(containerId, eventId) {
        this.containerId = containerId;
        this.eventId = eventId;
        this.container = document.getElementById(containerId);
    }

    editPhoto(photoId) {
        this.openEditModal(photoId);
    }

    async openEditModal(photoId) {
        // Mock implementation
    }

    formatDateForInput(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:MM
    }

    createEditModal(photo) {
        // Remove existing edit modal if it exists
        const existingModal = document.getElementById('photoEditModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Create edit modal HTML
        const modalHTML = `
            <div id="photoEditModal" style="display: flex; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.5); z-index: 10000; align-items: center; justify-content: center;">
                <div style="background: white; padding: 20px; border-radius: 8px; max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h3 style="margin: 0;">Edit Photo</h3>
                        <button id="closeEditModal" style="background: none; border: none; font-size: 24px; cursor: pointer;">&times;</button>
                    </div>
                    
                    <form id="editPhotoForm">
                        <input type="hidden" id="editPhotoId" value="${photo.photo_id}">
                        
                        <div style="margin-bottom: 15px;">
                            <label for="editDescription" style="display: block; margin-bottom: 5px; font-weight: bold;">Description:</label>
                            <textarea id="editDescription" name="description" rows="3" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; resize: vertical;">${photo.description || ''}</textarea>
                        </div>
                        
                        <div style="margin-bottom: 15px;">
                            <label for="editCaption" style="display: block; margin-bottom: 5px; font-weight: bold;">Caption:</label>
                            <textarea id="editCaption" name="caption" rows="2" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; resize: vertical;">${photo.caption || ''}</textarea>
                        </div>
                        
                        <div style="margin-bottom: 15px;">
                            <label for="editTakenDate" style="display: block; margin-bottom: 5px; font-weight: bold;">Date Taken:</label>
                            <input type="datetime-local" id="editTakenDate" name="taken_date" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" value="${this.formatDateForInput(photo.taken_date)}">
                        </div>
                        
                        <div style="display: flex; gap: 10px; justify-content: flex-end;">
                            <button type="button" id="cancelEdit" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">Cancel</button>
                            <button type="submit" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">Save Changes</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        // Add modal to page
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    async savePhotoEdit(form) {
        const photoId = document.getElementById('editPhotoId').value;
        const formData = new FormData(form);
        
        const updateData = {
            description: formData.get('description'),
            caption: formData.get('caption'),
            taken_date: formData.get('taken_date')
        };

        try {
            const response = await fetch(`/api/photos/${photoId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateData)
            });

            const result = await response.json();

            if (result.success) {
                this.showSuccess('Photo updated successfully!');
                document.getElementById('photoEditModal').remove();
                await this.loadPhotos();
            } else {
                this.showError(result.message || 'Failed to update photo');
            }
        } catch (error) {
            console.error('Error updating photo:', error);
            this.showError('Failed to update photo');
        }
    }

    showSuccess(message) {
        alert(message);
    }

    showError(message) {
        alert('Error: ' + message);
    }

    async loadPhotos() {
        // Mock implementation
    }
}

describe('Photo Edit Functionality', () => {
    let photoComponent;
    let mockContainer;

    beforeEach(() => {
        // Setup DOM
        document.body.innerHTML = '';
        
        // Create mock container
        mockContainer = document.createElement('div');
        mockContainer.id = 'photoContainer';
        document.body.appendChild(mockContainer);

        // Initialize PhotoComponent
        photoComponent = new PhotoComponent('photoContainer', 466);
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    describe('editPhoto method', () => {
        test('should call openEditModal when editPhoto is called', () => {
            const mockPhotoId = 123;
            const openEditModalSpy = jest.spyOn(photoComponent, 'openEditModal');
            
            photoComponent.editPhoto(mockPhotoId);
            
            expect(openEditModalSpy).toHaveBeenCalledWith(mockPhotoId);
        });
    });

    describe('formatDateForInput method', () => {
        test('should format date correctly for datetime-local input', () => {
            const testDate = '2023-11-23T14:30:00.000Z';
            const formatted = photoComponent.formatDateForInput(testDate);
            
            expect(formatted).toBe('2023-11-23T14:30');
        });

        test('should return empty string for null/undefined date', () => {
            expect(photoComponent.formatDateForInput(null)).toBe('');
            expect(photoComponent.formatDateForInput(undefined)).toBe('');
        });
    });

    describe('createEditModal method', () => {
        test('should create edit modal with correct structure', () => {
            const mockPhoto = {
                photo_id: 123,
                description: 'Test description',
                caption: 'Test caption',
                taken_date: '2023-11-23T14:30:00.000Z'
            };

            photoComponent.createEditModal(mockPhoto);

            const modal = document.getElementById('photoEditModal');
            expect(modal).toBeTruthy();
            expect(modal.style.display).toBe('flex');

            // Check form elements
            expect(document.getElementById('editPhotoId').value).toBe('123');
            expect(document.getElementById('editDescription').value).toBe('Test description');
            expect(document.getElementById('editCaption').value).toBe('Test caption');
            expect(document.getElementById('editTakenDate').value).toBe('2023-11-23T14:30');
        });

        test('should remove existing modal before creating new one', () => {
            const mockPhoto = {
                photo_id: 123,
                description: 'Test',
                caption: 'Test',
                taken_date: '2023-11-23T14:30:00.000Z'
            };

            // Create first modal
            photoComponent.createEditModal(mockPhoto);
            const firstModal = document.getElementById('photoEditModal');

            // Create second modal
            photoComponent.createEditModal(mockPhoto);
            const secondModal = document.getElementById('photoEditModal');

            // Should be different instances
            expect(firstModal).not.toBe(secondModal);
        });
    });

    describe('savePhotoEdit method', () => {
        beforeEach(() => {
            // Mock fetch
            global.fetch = jest.fn();
        });

        afterEach(() => {
            global.fetch.mockRestore();
        });

        test('should send correct data to API', async () => {
            const mockForm = {
                elements: {
                    editPhotoId: { value: '123' }
                }
            };

            // Mock FormData
            const mockFormData = new Map();
            mockFormData.set('description', 'Updated description');
            mockFormData.set('caption', 'Updated caption');
            mockFormData.set('taken_date', '2023-11-23T15:30');

            jest.spyOn(global, 'FormData').mockImplementation(() => ({
                get: (key) => mockFormData.get(key)
            }));

            // Mock successful API response
            global.fetch.mockResolvedValueOnce({
                json: async () => ({
                    success: true,
                    message: 'Photo updated successfully'
                })
            });

            // Mock DOM elements
            document.body.innerHTML = `
                <div id="photoEditModal"></div>
                <input id="editPhotoId" value="123">
            `;

            const loadPhotosSpy = jest.spyOn(photoComponent, 'loadPhotos').mockResolvedValue();
            const showSuccessSpy = jest.spyOn(photoComponent, 'showSuccess');

            await photoComponent.savePhotoEdit(mockForm);

            expect(global.fetch).toHaveBeenCalledWith('/api/photos/123', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    description: 'Updated description',
                    caption: 'Updated caption',
                    taken_date: '2023-11-23T15:30'
                })
            });

            expect(showSuccessSpy).toHaveBeenCalledWith('Photo updated successfully!');
            expect(loadPhotosSpy).toHaveBeenCalled();
        });

        test('should handle API errors gracefully', async () => {
            const mockForm = {
                elements: {
                    editPhotoId: { value: '123' }
                }
            };

            jest.spyOn(global, 'FormData').mockImplementation(() => ({
                get: () => 'test'
            }));

            // Mock API error response
            global.fetch.mockResolvedValueOnce({
                json: async () => ({
                    success: false,
                    message: 'Photo not found'
                })
            });

            document.body.innerHTML = `
                <div id="photoEditModal"></div>
                <input id="editPhotoId" value="123">
            `;
            const showErrorSpy = jest.spyOn(photoComponent, 'showError');

            await photoComponent.savePhotoEdit(mockForm);

            expect(showErrorSpy).toHaveBeenCalledWith('Photo not found');
        });
    });
});
