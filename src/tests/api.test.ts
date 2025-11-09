import request from 'supertest';
import { createServer } from '../index';
import { db } from '../db/database';
import * as http from 'http';

describe('CRUD API Tests', () => {
  let server: http.Server;
  let app: any;

  beforeAll(() => {
    app = createServer();
    server = app.listen(4000);
  });

  afterAll((done) => {
    server.close(done);
  });

  beforeEach(async () => {
    await db.clear();
  });

  describe('Scenario 1: Basic CRUD operations', () => {
    it('should perform complete CRUD cycle', async () => {
      // 1. Get all records (empty array expected)
      const getAllResponse = await request(app)
        .get('/api/users')
        .expect(200);

      expect(getAllResponse.body).toEqual([]);

      const newUser = {
        username: 'John Doe',
        age: 30,
        hobbies: ['reading', 'gaming']
      };

      const createResponse = await request(app)
        .post('/api/users')
        .send(newUser)
        .expect(201);

      expect(createResponse.body).toMatchObject({
        username: 'John Doe',
        age: 30,
        hobbies: ['reading', 'gaming']
      });
      expect(createResponse.body.id).toBeDefined();

      const userId = createResponse.body.id;

      // 3. Get the created user by id
      const getByIdResponse = await request(app)
        .get(`/api/users/${userId}`)
        .expect(200);

      expect(getByIdResponse.body).toEqual(createResponse.body);

      // 4. Update the user
      const updateData = {
        username: 'John Updated',
        age: 31,
        hobbies: ['reading', 'gaming', 'swimming']
      };

      const updateResponse = await request(app)
        .put(`/api/users/${userId}`)
        .send(updateData)
        .expect(200);

      expect(updateResponse.body).toMatchObject({
        id: userId,
        username: 'John Updated',
        age: 31,
        hobbies: ['reading', 'gaming', 'swimming']
      });

      // 5. Delete the user
      await request(app)
        .delete(`/api/users/${userId}`)
        .expect(204);

      // 6. Try to get the deleted user
      await request(app)
        .get(`/api/users/${userId}`)
        .expect(404);
    });
  });

  describe('Scenario 2: Multiple users management', () => {
    it('should handle multiple users correctly', async () => {
      // Create multiple users
      const user1 = {
        username: 'Alice',
        age: 25,
        hobbies: ['painting']
      };

      const user2 = {
        username: 'Bob',
        age: 35,
        hobbies: ['cooking', 'traveling']
      };

      const createResponse1 = await request(app)
        .post('/api/users')
        .send(user1)
        .expect(201);

      const createResponse2 = await request(app)
        .post('/api/users')
        .send(user2)
        .expect(201);

      // Get all users
      const getAllResponse = await request(app)
        .get('/api/users')
        .expect(200);

      expect(getAllResponse.body).toHaveLength(2);
      expect(getAllResponse.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ username: 'Alice' }),
          expect.objectContaining({ username: 'Bob' })
        ])
      );

      // Delete first user
      await request(app)
        .delete(`/api/users/${createResponse1.body.id}`)
        .expect(204);

      // Check only one user remains
      const getAllAfterDelete = await request(app)
        .get('/api/users')
        .expect(200);

      expect(getAllAfterDelete.body).toHaveLength(1);
      expect(getAllAfterDelete.body[0].username).toBe('Bob');
    });
  });

  describe('Scenario 3: Error handling and validation', () => {
    it('should handle invalid requests correctly', async () => {
      // Try to get user with invalid UUID
      await request(app)
        .get('/api/users/invalid-id')
        .expect(400);

      // Try to get non-existent user with valid UUID
      await request(app)
        .get('/api/users/550e8400-e29b-41d4-a716-446655440000')
        .expect(404);

      // Try to create user with missing fields
      await request(app)
        .post('/api/users')
        .send({ username: 'Test' })
        .expect(400);

      // Try to create user with invalid age type
      await request(app)
        .post('/api/users')
        .send({
          username: 'Test',
          age: 'thirty',
          hobbies: []
        })
        .expect(400);

      // Try to create user with invalid hobbies type
      await request(app)
        .post('/api/users')
        .send({
          username: 'Test',
          age: 30,
          hobbies: 'reading'
        })
        .expect(400);

      // Try to update non-existent user
      await request(app)
        .put('/api/users/550e8400-e29b-41d4-a716-446655440000')
        .send({
          username: 'Updated',
          age: 25,
          hobbies: []
        })
        .expect(404);

      // Try to delete non-existent user
      await request(app)
        .delete('/api/users/550e8400-e29b-41d4-a716-446655440000')
        .expect(404);

      // Try to access non-existent endpoint
      await request(app)
        .get('/api/invalid')
        .expect(404);
    });
  });

  describe('Scenario 4: Partial updates', () => {
    it('should handle partial updates correctly', async () => {
      // Create a user
      const newUser = {
        username: 'Charlie',
        age: 28,
        hobbies: ['music', 'sports']
      };

      const createResponse = await request(app)
        .post('/api/users')
        .send(newUser)
        .expect(201);

      const userId = createResponse.body.id;

      // Update only username
      const partialUpdate1 = await request(app)
        .put(`/api/users/${userId}`)
        .send({ username: 'Charlie Updated' })
        .expect(200);

      expect(partialUpdate1.body).toMatchObject({
        id: userId,
        username: 'Charlie Updated',
        age: 28,
        hobbies: ['music', 'sports']
      });

      // Update only age
      const partialUpdate2 = await request(app)
        .put(`/api/users/${userId}`)
        .send({ age: 29 })
        .expect(200);

      expect(partialUpdate2.body).toMatchObject({
        id: userId,
        username: 'Charlie Updated',
        age: 29,
        hobbies: ['music', 'sports']
      });

      // Update only hobbies
      const partialUpdate3 = await request(app)
        .put(`/api/users/${userId}`)
        .send({ hobbies: ['gaming'] })
        .expect(200);

      expect(partialUpdate3.body).toMatchObject({
        id: userId,
        username: 'Charlie Updated',
        age: 29,
        hobbies: ['gaming']
      });
    });
  });
});