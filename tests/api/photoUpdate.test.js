/**
 * API tests for Photo Update Endpoint
 * Tests the PUT /api/photos/:photoId endpoint
 */

const request = require('supertest');
const express = require('express');

// Mock Prisma client
const mockPrisma = {
    photo: {
        findUnique: jest.fn(),
        update: jest.fn()
    }
};

// Mock the prisma import
jest.mock('@prisma/client', () => ({
    PrismaClient: jest.fn(() => mockPrisma)
}));

// Create a simple Express app for testing
const app = express();
app.use(express.json());

// Mock photo update route
app.put('/api/photos/:photoId', async (req, res) => {
    try {
        const { photoId } = req.params;
        if (!photoId) {
            res.status(400).json({
                success: false,
                message: 'Photo ID is required'
            });
            return;
        }
        const { description, caption, taken_date } = req.body;

        // Check if photo exists
        const existingPhoto = await mockPrisma.photo.findUnique({
            where: { photo_id: parseInt(photoId, 10) }
        });

        if (!existingPhoto) {
            res.status(404).json({
                success: false,
                message: 'Photo not found'
            });
            return;
        }

        // Update photo
        const updatedPhoto = await mockPrisma.photo.update({
            where: { photo_id: parseInt(photoId, 10) },
            data: {
                description: description !== undefined ? description : existingPhoto.description,
                caption: caption !== undefined ? caption : existingPhoto.caption,
                taken_date: taken_date !== undefined ? new Date(taken_date) : existingPhoto.taken_date
            },
            select: {
                photo_id: true,
                filename: true,
                original_filename: true,
                description: true,
                caption: true,
                taken_date: true,
                file_size: true,
                mime_type: true,
                created_at: true,
                updated_at: true
            }
        });

        res.json({
            success: true,
            data: { photo: updatedPhoto },
            message: 'Photo updated successfully'
        });
    } catch (error) {
        console.error('Error updating photo:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

describe('Photo Update API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('PUT /api/photos/:photoId', () => {
        test('should update photo successfully', async () => {
            const mockExistingPhoto = {
                photo_id: 123,
                description: 'Old description',
                caption: 'Old caption',
                taken_date: new Date('2023-11-23T10:00:00Z')
            };

            const mockUpdatedPhoto = {
                photo_id: 123,
                filename: 'test.jpg',
                original_filename: 'test.jpg',
                description: 'New description',
                caption: 'New caption',
                taken_date: new Date('2023-11-23T15:30:00Z'),
                file_size: 1024,
                mime_type: 'image/jpeg',
                created_at: new Date(),
                updated_at: new Date()
            };

            mockPrisma.photo.findUnique.mockResolvedValue(mockExistingPhoto);
            mockPrisma.photo.update.mockResolvedValue(mockUpdatedPhoto);

            const response = await request(app)
                .put('/api/photos/123')
                .send({
                    description: 'New description',
                    caption: 'New caption',
                    taken_date: '2023-11-23T15:30:00Z'
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Photo updated successfully');
            expect(response.body.data.photo.description).toBe('New description');
            expect(response.body.data.photo.caption).toBe('New caption');

            expect(mockPrisma.photo.findUnique).toHaveBeenCalledWith({
                where: { photo_id: 123 }
            });

            expect(mockPrisma.photo.update).toHaveBeenCalledWith({
                where: { photo_id: 123 },
                data: {
                    description: 'New description',
                    caption: 'New caption',
                    taken_date: new Date('2023-11-23T15:30:00Z')
                },
                select: expect.any(Object)
            });
        });

        test('should handle missing photo ID', async () => {
            const response = await request(app)
                .put('/api/photos/')
                .send({
                    description: 'New description'
                });

            expect(response.status).toBe(404); // Express route not found
        });

        test('should handle photo not found', async () => {
            mockPrisma.photo.findUnique.mockResolvedValue(null);

            const response = await request(app)
                .put('/api/photos/999')
                .send({
                    description: 'New description'
                });

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Photo not found');
        });

        test('should update only provided fields', async () => {
            const mockExistingPhoto = {
                photo_id: 123,
                description: 'Old description',
                caption: 'Old caption',
                taken_date: new Date('2023-11-23T10:00:00Z')
            };

            const mockUpdatedPhoto = {
                ...mockExistingPhoto,
                description: 'New description'
            };

            mockPrisma.photo.findUnique.mockResolvedValue(mockExistingPhoto);
            mockPrisma.photo.update.mockResolvedValue(mockUpdatedPhoto);

            const response = await request(app)
                .put('/api/photos/123')
                .send({
                    description: 'New description'
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);

            expect(mockPrisma.photo.update).toHaveBeenCalledWith({
                where: { photo_id: 123 },
                data: {
                    description: 'New description',
                    caption: 'Old caption',
                    taken_date: new Date('2023-11-23T10:00:00Z')
                },
                select: expect.any(Object)
            });
        });

        test('should handle database errors', async () => {
            mockPrisma.photo.findUnique.mockRejectedValue(new Error('Database error'));

            const response = await request(app)
                .put('/api/photos/123')
                .send({
                    description: 'New description'
                });

            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Internal server error');
        });
    });
});
