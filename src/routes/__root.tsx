import { Outlet, createRootRoute } from '@tanstack/react-router'
import { TooltipProvider } from '@/components/ui/tooltip'

export const Route = createRootRoute({
  component: () => (
    <TooltipProvider>
      <main className="min-h-screen">
        <Outlet />
      </main>
    </TooltipProvider>
  ),
})
