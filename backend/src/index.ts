import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { projectsRouter } from './routes/projects.js'
import { aiRouter } from './routes/ai.js'
import { requireAuth } from './middleware/auth.js'
import { logger } from './lib/logger.js'

const app = express()
const PORT = process.env.PORT || 3001

// =============================================================================
// Security Middleware
// =============================================================================

// Helmet adds various HTTP headers for security
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'blob:'],
    },
  },
  crossOriginEmbedderPolicy: false, // Needed for some frontend frameworks
}))

// CORS - restrict to localhost in development
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
]

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true)

    if (allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      logger.warn({ origin }, 'CORS blocked request from unauthorized origin')
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}))

// Body parser with size limit
app.use(express.json({ limit: '10mb' }))

// =============================================================================
// Rate Limiting
// =============================================================================

// General API rate limiter
const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
})

// Stricter rate limiter for AI generation endpoints
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 AI requests per minute
  message: { error: 'Too many AI generation requests. Please wait a moment before trying again.' },
  standardHeaders: true,
  legacyHeaders: false,
})

// Apply general limiter to all routes
app.use(generalLimiter)

// =============================================================================
// Routes
// =============================================================================

// Public routes (no auth required, but AI generation has rate limiting)
app.use('/api/ai', aiLimiter, aiRouter)

// Protected routes (require auth)
app.use('/api/projects', requireAuth, projectsRouter)

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// =============================================================================
// Error Handling
// =============================================================================

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error({ err, message: err.message, stack: err.stack }, 'Unhandled error')

  // Don't leak error details in production
  if (process.env.NODE_ENV === 'production') {
    res.status(500).json({ error: 'Internal server error' })
  } else {
    res.status(500).json({ error: 'Internal server error', details: err.message })
  }
})

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' })
})

// =============================================================================
// Server Startup
// =============================================================================

app.listen(PORT, () => {
  logger.info({ port: PORT }, 'Storyflow API server started')

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
