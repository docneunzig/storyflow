import express from 'express'
import cors from 'cors'
import { projectsRouter } from './routes/projects.js'
import { aiRouter } from './routes/ai.js'
import { requireAuth } from './middleware/auth.js'

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json({ limit: '10mb' }))

// Public routes (no auth required)
app.use('/api/ai', aiRouter) // Status endpoint needs to be accessible without auth

// Protected routes (require auth)
app.use('/api/projects', requireAuth, projectsRouter)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err)
  res.status(500).json({ error: 'Internal server error' })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' })
})

app.listen(PORT, () => {
  console.log(`Storyflow API server running on http://localhost:${PORT}`)
  console.log('')
  console.log('Available endpoints:')
  console.log('  GET  /api/health')
  console.log('  GET  /api/projects')
  console.log('  POST /api/projects')
  console.log('  GET  /api/projects/:id')
  console.log('  PUT  /api/projects/:id')
  console.log('  DELETE /api/projects/:id')
  console.log('  GET  /api/ai/status')
  console.log('')
})
