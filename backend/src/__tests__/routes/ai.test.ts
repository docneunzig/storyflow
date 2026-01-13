import { describe, it, expect, jest } from '@jest/globals'
import express from 'express'
import request from 'supertest'

// Mock fs before importing anything else
jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(true),
}))

// Mock child_process to prevent actual spawning
jest.mock('child_process', () => ({
  spawn: jest.fn().mockReturnValue({
    stdout: { on: jest.fn() },
    stderr: { on: jest.fn() },
    on: jest.fn(),
    kill: jest.fn(),
  }),
}))

// Import the router after mocking
import { aiRouter } from '../../routes/ai.js'

describe('AI Router', () => {
  const app = express()
  app.use(express.json())
  app.use('/api/ai', aiRouter)

  describe('GET /api/ai/status', () => {
    it('should return AI status', async () => {
      const response = await request(app).get('/api/ai/status')

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('authenticated')
      expect(response.body).toHaveProperty('cliAuthenticated')
      expect(response.body).toHaveProperty('canUseAI')
      expect(response.body).toHaveProperty('message')
    })

    it('should return unauthenticated when forced', async () => {
      const response = await request(app).get('/api/ai/status?force=unauthenticated')

      expect(response.status).toBe(200)
      expect(response.body.authenticated).toBe(false)
      expect(response.body.cliAuthenticated).toBe(false)
      expect(response.body.canUseAI).toBe(false)
    })
  })

  describe('POST /api/ai/consistency-check', () => {
    it('should return placeholder response', async () => {
      const response = await request(app)
        .post('/api/ai/consistency-check')
        .send({
          content: 'Test content',
          context: {},
        })

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('status', 'success')
      expect(response.body).toHaveProperty('warnings')
      expect(Array.isArray(response.body.warnings)).toBe(true)
    })
  })

  describe('Route structure', () => {
    it('should have status endpoint', () => {
      const routes = (aiRouter as { stack: { route: { path: string } }[] }).stack
        .filter(r => r.route)
        .map(r => r.route.path)

      expect(routes).toContain('/status')
    })

    it('should have generate endpoint', () => {
      const routes = (aiRouter as { stack: { route: { path: string } }[] }).stack
        .filter(r => r.route)
        .map(r => r.route.path)

      expect(routes).toContain('/generate')
    })

    it('should have stream endpoint', () => {
      const routes = (aiRouter as { stack: { route: { path: string } }[] }).stack
        .filter(r => r.route)
        .map(r => r.route.path)

      expect(routes).toContain('/stream/:generationId')
    })

    it('should have consistency-check endpoint', () => {
      const routes = (aiRouter as { stack: { route: { path: string } }[] }).stack
        .filter(r => r.route)
        .map(r => r.route.path)

      expect(routes).toContain('/consistency-check')
    })
  })
})
