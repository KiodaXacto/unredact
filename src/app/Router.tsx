// src/app/Router.tsx
// React Router v6 route configuration with lazy-loaded feature pages.

import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { App } from './App';
import { DailyGameRoute } from './routes/DailyGameRoute';

// Lazy-loaded routes — loaded only when navigated to
const ArchivePage = lazy(() =>
  import('@features/archive/ArchivePage').then((m) => ({ default: m.ArchivePage }))
);

const UnlimitedPage = lazy(() =>
  import('@features/unlimited/UnlimitedPage').then((m) => ({ default: m.UnlimitedPage }))
);

// Loading fallback for lazy routes
const RouteLoader = () => (
  <div className="flex min-h-[60vh] items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-accent)] border-t-transparent" />
  </div>
);

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <DailyGameRoute />,
      },
      {
        path: 'archive',
        element: (
          <Suspense fallback={<RouteLoader />}>
            <ArchivePage />
          </Suspense>
        ),
      },
      {
        path: 'archive/:date',
        element: (
          <Suspense fallback={<RouteLoader />}>
            <ArchivePage />
          </Suspense>
        ),
      },
      {
        path: 'unlimited',
        element: (
          <Suspense fallback={<RouteLoader />}>
            <UnlimitedPage />
          </Suspense>
        ),
      },
    ],
  },
]);

export const Router = () => <RouterProvider router={router} />;
