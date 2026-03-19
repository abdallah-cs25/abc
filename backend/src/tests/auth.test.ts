import request from 'supertest';
import app from '../index';
import prisma from '../lib/prisma';

// Clean up database before tests
beforeAll(async () => {
    // Delete test user if exists
    await prisma.user.deleteMany({
        where: { email: 'test@example.com' }
    });
});

afterAll(async () => {
    // Cleanup
    await prisma.user.deleteMany({
        where: { email: 'test@example.com' }
    });
    await prisma.$disconnect();
});

describe('Auth API', () => {
    const testUser = {
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
        role: 'CUSTOMER',
        phone: '+213555999888'
    };

    let token = '';

    it('should register a new user', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send(testUser);

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.user.email).toBe(testUser.email);

        // Save token for next tests if needed, though login gives a fresh one
    });

    it('should fail to register existing user', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send(testUser);

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    it('should login with valid credentials', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: testUser.email,
                password: testUser.password
            });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.token).toBeDefined();
        token = res.body.data.token;
    });

    it('should fail login with invalid password', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: testUser.email,
                password: 'wrongpassword'
            });

        expect(res.status).toBe(401);
    });

    it('should access protected profile route', async () => {
        const res = await request(app)
            .get('/api/auth/me')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.data.email).toBe(testUser.email);
    });
});
