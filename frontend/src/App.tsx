import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/Toaster'
import { Layout } from '@/components/layout/Layout'
import { ProjectList } from '@/pages/ProjectList'
import { ProjectWorkspace } from '@/pages/ProjectWorkspace'
import { AuthCheck } from '@/components/auth/AuthCheck'

function App() {
  return (
    <BrowserRouter>
      <AuthCheck>
        <Routes>
          {/* Project list - home page */}
          <Route path="/" element={<ProjectList />} />

          {/* Project workspace - all sections */}
          <Route path="/projects/:projectId" element={<Layout />}>
            <Route index element={<Navigate to="specification" replace />} />
            <Route path="specification" element={<ProjectWorkspace section="specification" />} />
            <Route path="plot" element={<ProjectWorkspace section="plot" />} />
            <Route path="characters" element={<ProjectWorkspace section="characters" />} />
            <Route path="characters/:characterId" element={<ProjectWorkspace section="character-detail" />} />
            <Route path="scenes" element={<ProjectWorkspace section="scenes" />} />
            <Route path="scenes/:sceneId" element={<ProjectWorkspace section="scene-detail" />} />
            <Route path="write" element={<ProjectWorkspace section="write" />} />
            <Route path="write/:chapterId" element={<ProjectWorkspace section="chapter-editor" />} />
            <Route path="review" element={<ProjectWorkspace section="review" />} />
            <Route path="export" element={<ProjectWorkspace section="export" />} />
            <Route path="wiki" element={<ProjectWorkspace section="wiki" />} />
            <Route path="wiki/:category" element={<ProjectWorkspace section="wiki-category" />} />
            <Route path="stats" element={<ProjectWorkspace section="stats" />} />
            <Route path="market" element={<ProjectWorkspace section="market" />} />
          </Route>

          {/* 404 handler */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthCheck>
      <Toaster />
    </BrowserRouter>
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

export default App
