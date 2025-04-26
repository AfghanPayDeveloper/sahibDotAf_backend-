import request from 'supertest';
import app from '../src/index.js'; 
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

describe('PUT /api/me - Update User Profile with Image Upload', () => {
    let server;
    let token; // Placeholder for auth token
    const testImagePath = path.join(__dirname, './test-image.jpg');

    // Create a temporary test image
    beforeAll(async () => {
        // Create a mock image file for testing
        if (!fs.existsSync(testImagePath)) {
            fs.writeFileSync(testImagePath, Buffer.from('Test image content'), 'utf8');
        }

        // Start server and setup test token
        server = app.listen(5001); // Test server port
        token = 'YOUR_VALID_JWT_TOKEN_HERE'; // Replace with a valid token
    });

    afterAll(async () => {
        // Close server and clean up test image
        server.close();
        if (fs.existsSync(testImagePath)) {
            fs.unlinkSync(testImagePath);
        }
        await mongoose.connection.close();
    });

    test('should update profile image successfully', async () => {
        const response = await request(app)
            .put('/api/me')
            .set('Authorization', `Bearer ${token}`)
            .attach('profileImage', testImagePath) // Upload the test image
            .field('fullName', 'Test User') // Additional form field
            .field('email', 'testuser@example.com');

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('message', 'User details updated successfully');
        expect(response.body.user).toHaveProperty('profileImage');

        const profileImagePath = response.body.user.profileImage;
        expect(profileImagePath).toMatch(/\/uploads\/\d+-test-image\.jpg/);

        // Verify the image exists in the uploads directory
        const uploadedImagePath = path.join(__dirname, `../uploads/${path.basename(profileImagePath)}`);
        expect(fs.existsSync(uploadedImagePath)).toBe(true);
    });

    test('should return error if no token provided', async () => {
        const response = await request(app)
            .put('/api/me')
            .attach('profileImage', testImagePath)
            .field('fullName', 'Test User');

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('error', 'Unauthorized');
    });

    test('should return error for invalid file size', async () => {
        const largeImagePath = path.join(__dirname, './large-test-image.jpg');

        // Create a large test image
        fs.writeFileSync(largeImagePath, Buffer.alloc(11 * 1024 * 1024)); // 11MB

        const response = await request(app)
            .put('/api/me')
            .set('Authorization', `Bearer ${token}`)
            .attach('profileImage', largeImagePath);

        expect(response.status).toBe(500);
        expect(response.body).toHaveProperty('error');

        // Clean up large test image
        fs.unlinkSync(largeImagePath);
    });
});
