import React from 'react';
import {
  createRouter,
  createRoute,
  createRootRoute,
  RouterProvider,
  Outlet,
} from '@tanstack/react-router';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile } from './hooks/useQueries';
import LoginScreen from './components/LoginScreen';
import ProfileSetup from './components/ProfileSetup';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import LogFlight from './pages/LogFlight';
import FlightRecords from './pages/FlightRecords';
import ManageStudents from './pages/ManageStudents';
import ManageInstructors from './pages/ManageInstructors';
import ManageAircraft from './pages/ManageAircraft';
import ManageExercises from './pages/ManageExercises';
import NotFound from './pages/NotFound';
import { Loader2 } from 'lucide-react';
import { Toaster } from '@/components/ui/sonner';

// ─── Root layout with auth guard ─────────────────────────────────────────────

function RootComponent() {
  const { identity, isInitializing } = useInternetIdentity();
  const isAuthenticated = !!identity;

  const { data: userProfile, isLoading: profileLoading, isFetched: profileFetched } =
    useGetCallerUserProfile();

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <img
            src="/assets/generated/flight-log-logo.dim_256x256.png"
            alt="Flight Log"
            className="w-16 h-16 object-contain opacity-80"
          />
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  const showProfileSetup = isAuthenticated && !profileLoading && profileFetched && userProfile === null;

  return (
    <>
      <ProfileSetup open={showProfileSetup} />
      <Outlet />
    </>
  );
}

// ─── Footer component ─────────────────────────────────────────────────────────

function AppFooter() {
  const appId = encodeURIComponent(
    typeof window !== 'undefined' ? window.location.hostname : 'flight-log-manager'
  );
  return (
    <footer className="border-t border-border bg-card/30 py-3 px-6 text-center">
      <p className="text-xs text-muted-foreground">
        © {new Date().getFullYear()} Flight Log Manager &nbsp;·&nbsp; Built with{' '}
        <span className="text-red-400">♥</span> using{' '}
        <a
          href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${appId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          caffeine.ai
        </a>
      </p>
    </footer>
  );
}

// ─── Layout wrapper with footer ──────────────────────────────────────────────

function AuthenticatedLayout() {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1">
        <Layout />
      </div>
      <AppFooter />
    </div>
  );
}

// ─── Routes ──────────────────────────────────────────────────────────────────

const rootRoute = createRootRoute({
  component: RootComponent,
  notFoundComponent: NotFound,
});

const authenticatedRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'authenticated',
  component: AuthenticatedLayout,
});

const dashboardRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/',
  component: Dashboard,
});

const logFlightRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/log-flight',
  component: LogFlight,
});

const flightRecordsRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/flight-records',
  component: FlightRecords,
});

const manageStudentsRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/manage/students',
  component: ManageStudents,
});

const manageInstructorsRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/manage/instructors',
  component: ManageInstructors,
});

const manageAircraftRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/manage/aircraft',
  component: ManageAircraft,
});

const manageExercisesRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/manage/exercises',
  component: ManageExercises,
});

const routeTree = rootRoute.addChildren([
  authenticatedRoute.addChildren([
    dashboardRoute,
    logFlightRoute,
    flightRecordsRoute,
    manageStudentsRoute,
    manageInstructorsRoute,
    manageAircraftRoute,
    manageExercisesRoute,
  ]),
]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

// ─── App ─────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster richColors position="top-right" />
    </>
  );
}
