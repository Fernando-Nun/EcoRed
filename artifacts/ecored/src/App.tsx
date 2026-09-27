import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AppShell } from '@/components/app-shell';
import AdminReviewPage from '@/pages/admin-review';
import DashboardPage from '@/pages/dashboard';
import DonationsPage from '@/pages/donations';
import LoginPage from '@/pages/login';
import NewDonationPage from '@/pages/new-donation';
import NotFound from '@/pages/not-found';
import OrganizationsPage from '@/pages/organizations';
import RegisterPage from '@/pages/register';
import { getGetCurrentUserQueryKey, setAuthTokenGetter, useGetCurrentUser } from '@workspace/api-client-react';
import { Link, Redirect, Route, Switch, Router as WouterRouter, useLocation } from 'wouter';

const queryClient = new QueryClient();
setAuthTokenGetter(() => sessionStorage.getItem('ecored-token'));

function AccessDenied() {
  return <div className="surface mx-auto max-w-lg p-10 text-center"><p className="eyebrow">Acceso restringido</p><h1 className="page-title mt-3">Esta vista no está disponible para tu cuenta.</h1><Link href="/" className="mt-6 inline-flex min-h-9 items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground" data-testid="link-back-dashboard">Volver al resumen</Link></div>;
}

function RoutedErrorBoundary({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function Router() {
  const [location] = useLocation();
  const hasToken = Boolean(sessionStorage.getItem('ecored-token'));
  const currentUser = useGetCurrentUser({
    query: { enabled: hasToken, queryKey: getGetCurrentUserQueryKey() },
  });

  if (!hasToken && location !== '/login' && location !== '/register') return <Redirect to="/login" />;
  if (hasToken && (location === '/login' || location === '/register') && currentUser.data) return <Redirect to="/" />;
  if (hasToken && currentUser.isLoading && !currentUser.data) return <div className="flex min-h-[100dvh] items-center justify-center bg-background"><div className="w-64 space-y-3"><div className="h-3 animate-pulse rounded bg-muted" /><div className="h-3 animate-pulse rounded bg-muted" /><p className="text-center text-sm text-muted-foreground">Abriendo EcoRed…</p></div></div>;
  if (hasToken && currentUser.isError) {
    sessionStorage.removeItem('ecored-token');
    return <Redirect to="/login" />;
  }
  const user = currentUser.data;
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/login" component={LoginPage} />
        <Route path="/register" component={RegisterPage} />
        <Route path="/">
          {user ? <AppShell user={user}><DashboardPage user={user} /></AppShell> : <Redirect to="/login" />}
        </Route>
        <Route path="/donations">
          {user ? <AppShell user={user}><DonationsPage user={user} /></AppShell> : <Redirect to="/login" />}
        </Route>
        <Route path="/donations/new">
          {user?.role === 'donor' ? <AppShell user={user}><NewDonationPage /></AppShell> : <AccessDenied />}
        </Route>
        <Route path="/organizations">
          {user ? <AppShell user={user}><OrganizationsPage /></AppShell> : <Redirect to="/login" />}
        </Route>
        <Route path="/admin/review">
          {user?.role === 'admin' ? <AppShell user={user}><AdminReviewPage /></AppShell> : <AccessDenied />}
        </Route>
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;