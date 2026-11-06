import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-app-bg px-6 text-center">
      <div>
        <p className="app-mono text-xs font-semibold uppercase tracking-widest text-app-3">
          404
        </p>
        <h1 className="mt-3 text-2xl font-bold text-app-text">Not found</h1>
        <a
          href="/"
          className="mt-6 inline-block rounded-lg bg-app-accent px-4 py-2 text-sm font-semibold text-app-on-accent"
        >
          Back
        </a>
      </div>
    </main>
  )
}

export function getRouter() {
  return createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
    defaultNotFoundComponent: NotFound,
  })
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
