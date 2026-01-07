import { Outlet, useParams } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { Footer } from './Footer'

export function Layout() {
  const { projectId } = useParams<{ projectId: string }>()

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header projectId={projectId} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar projectId={projectId} />
        <main className="flex-1 overflow-auto p-6" role="main" aria-label="Main content">
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  )
}
