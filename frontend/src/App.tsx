import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom'
import { Toaster } from '@/components/ui/Toaster'
import { Layout } from '@/components/layout/Layout'
import { ProjectList } from '@/pages/ProjectList'
import { ProjectWorkspace } from '@/pages/ProjectWorkspace'
import { LogoutPage } from '@/pages/LogoutPage'
import { AuthCheck } from '@/components/auth/AuthCheck'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'

// Auth wrapper component for routes
function AuthWrapper() {
  return (
    <AuthCheck>
      <Outlet />
    </AuthCheck>
  )
}

function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-text-secondary mb-4">404</h1>
        <p className="text-xl text-text-secondary mb-8">Page not found</p>
        <a href="/" className="btn-primary">
          Go Home
        </a>
      </div>
    </div>
  )
}

// Create router with data router pattern for useBlocker support
const router = createBrowserRouter([
  {
    element: <AuthWrapper />,
    children: [
      // Logout page
      { path: '/logout', element: <LogoutPage /> },

      // Project list - home page
      { path: '/', element: <ProjectList /> },

      // Project workspace - all sections
      {
        path: '/projects/:projectId',
        element: <Layout />,
        children: [
          { index: true, element: <Navigate to="specification" replace /> },
          { path: 'specification', element: <ProjectWorkspace section="specification" /> },
          { path: 'brainstorm', element: <ProjectWorkspace section="brainstorm" /> },
          { path: 'plot', element: <ProjectWorkspace section="plot" /> },
          { path: 'characters', element: <ProjectWorkspace section="characters" /> },
          { path: 'characters/:characterId', element: <ProjectWorkspace section="character-detail" /> },
          { path: 'scenes', element: <ProjectWorkspace section="scenes" /> },
          { path: 'scenes/:sceneId', element: <ProjectWorkspace section="scene-detail" /> },
          { path: 'write', element: <ProjectWorkspace section="write" /> },
          { path: 'write/:chapterId', element: <ProjectWorkspace section="chapter-editor" /> },
          { path: 'review', element: <ProjectWorkspace section="review" /> },
          { path: 'export', element: <ProjectWorkspace section="export" /> },
          { path: 'wiki', element: <ProjectWorkspace section="wiki" /> },
          { path: 'wiki/:category', element: <ProjectWorkspace section="wiki-category" /> },
          { path: 'stats', element: <ProjectWorkspace section="stats" /> },
          { path: 'market', element: <ProjectWorkspace section="market" /> },
        ],
      },

      // 404 handler
      { path: '*', element: <NotFound /> },
    ],
  },
])

function App() {
  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
      <Toaster />
    </ErrorBoundary>
  )
}

export default App
