import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import type { Request, Response } from 'express';
import express from 'express';
import request from 'supertest';

// Mock der shared-Bibliothek muss vor dem Import erfolgen
const mockAdd = jest.fn();
jest.unstable_mockModule('shared', () => ({
  add: mockAdd,
}));

// Dynamischer Import nach dem Mock
const { demoRouter } = await import('./demo.js');

describe('demoRouter', () => {
  let app: express.Application;

  beforeEach(() => {
    // Reset aller Mocks vor jedem Test
    jest.clearAllMocks();

    // Express-App mit dem Router erstellen
    app = express();
    app.use(express.json());
    app.use('/', demoRouter);
  });

  describe('POST /add', () => {
    it('sollte zwei Zahlen korrekt addieren', async () => {
      // Arrange
      mockAdd.mockReturnValue(8);

      // Act
      const response = await request(app)
        .post('/add')
        .send({ a: 5, b: 3 });

      // Assert
      expect(mockAdd).toHaveBeenCalledWith(5, 3);
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ result: 8 });
    });

    it('sollte negative Zahlen korrekt verarbeiten', async () => {
      // Arrange
      mockAdd.mockReturnValue(-15);

      // Act
      const response = await request(app)
        .post('/add')
        .send({ a: -10, b: -5 });

      // Assert
      expect(mockAdd).toHaveBeenCalledWith(-10, -5);
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ result: -15 });
    });

    it('sollte Dezimalzahlen korrekt verarbeiten', async () => {
      // Arrange
      mockAdd.mockReturnValue(4);

      // Act
      const response = await request(app)
        .post('/add')
        .send({ a: 1.5, b: 2.5 });

      // Assert
      expect(mockAdd).toHaveBeenCalledWith(1.5, 2.5);
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ result: 4 });
    });

    it('sollte 400-Fehler zurückgeben, wenn a keine Zahl ist', async () => {
      // Act
      const response = await request(app)
        .post('/add')
        .send({ a: 'nicht-eine-zahl', b: 5 });

      // Assert
      expect(mockAdd).not.toHaveBeenCalled();
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Both a and b must be numbers' });
    });

    it('sollte 400-Fehler zurückgeben, wenn b keine Zahl ist', async () => {
      // Act
      const response = await request(app)
        .post('/add')
        .send({ a: 5, b: 'nicht-eine-zahl' });

      // Assert
      expect(mockAdd).not.toHaveBeenCalled();
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Both a and b must be numbers' });
    });

    it('sollte 400-Fehler zurückgeben, wenn beide Parameter keine Zahlen sind', async () => {
      // Act
      const response = await request(app)
        .post('/add')
        .send({ a: 'text', b: 'text' });

      // Assert
      expect(mockAdd).not.toHaveBeenCalled();
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Both a and b must be numbers' });
    });

    it('sollte 400-Fehler zurückgeben, wenn Parameter fehlen', async () => {
      // Act
      const response = await request(app)
        .post('/add')
        .send({});

      // Assert
      expect(mockAdd).not.toHaveBeenCalled();
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Both a and b must be numbers' });
    });

    it('sollte mit Null-Werten korrekt umgehen', async () => {
      // Arrange
      mockAdd.mockReturnValue(0);

      // Act
      const response = await request(app)
        .post('/add')
        .send({ a: 0, b: 0 });

      // Assert
      expect(mockAdd).toHaveBeenCalledWith(0, 0);
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ result: 0 });
    });
  });
});
