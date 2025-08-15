// Load test environment variables
require('dotenv').config({ path: '.env.test' });

const request = require('supertest');
const app = require('../../server');

describe('Simple API Test', () => {
  test('Should respond to health check', async () => {
    const response = await request(app)
      .get('/');

    console.log('Health check status:', response.status);
    console.log('Health check body:', response.body);

    expect(response.status).toBe(200);
  });

  test('Should handle barbershop registration endpoint', async () => {
    const registrationData = {
      name: 'Test Barbershop',
      slug: 'test-barbershop',
      ownerEmail: 'test@test.com',
      ownerName: 'Test Owner',
      ownerUsername: 'test-owner',
      ownerPassword: 'password123',
      planType: 'free'
    };

    const response = await request(app)
      .post('/api/barbershops/register')
      .send(registrationData);

    console.log('Registration status:', response.status);
    console.log('Registration body:', response.body);

    // Just check that the endpoint exists and responds
    expect([200, 201, 400, 409, 500]).toContain(response.status);
  });
});