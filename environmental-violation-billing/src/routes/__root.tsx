import { createRootRoute, Link, Outlet } from '@tanstack/react-router';
import { AppShell } from '@/components/AppShell';
import { EnviroBillProvider } from '@/hooks/useEnviroBillStore';

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFound,
});

function RootLayout() {
  return (
    <EnviroBillProvider>
      <AppShell>
        <Outlet />
      </AppShell>
    </EnviroBillProvider>
  );
}

function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-slate-100">
      <p className="text-lg">This page does not exist.</p>
      <Link to="/" className="text-sm underline underline-offset-4">
        Go to the dashboard
      </Link>
    </div>
  );
}
