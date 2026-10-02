import { useEffect, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Layout } from '@/components/layout';
import Blog from '@/pages/blog';
import PoemPage from '@/pages/poem';
import About from '@/pages/about';
import NotFound from '@/pages/not-found';
import { AuthProvider } from '@/components/auth-provider';
import { AuthorSignIn, AuthorSignUp } from '@/pages/author-sign-in';
import { useAuth } from '@clerk/react';
import {
  Route,
  Switch,
  useLocation,
  useRoute,
  Router as WouterRouter,
} from 'wouter';

const queryClient = new QueryClient();

function BlogHome() {
  const { isLoaded, isSignedIn } = useAuth();
  const [location, setLocation] = useLocation();
  useEffect(() => {
    if (isLoaded && isSignedIn && location === '/') setLocation('/autor', { replace: true });
    if (isLoaded && !isSignedIn && location === '/autor') setLocation('/', { replace: true });
  }, [isLoaded, isSignedIn, location, setLocation]);
  return <Blog />;
}

function Router() {
  const [location] = useLocation();
  const [reading, params] = useRoute<{ id: string }>('/poema/:id');
  const blogRoute = location === '/' || location === '/autor' || reading;
  return (
    <Layout>
      <RoutedErrorBoundary>
        {blogRoute ? <>
          <BlogHome />
          {reading && params && <PoemPage poemId={params.id} />}
        </> : <Switch>
          <Route path="/sign-in/*?" component={AuthorSignIn} />
          <Route path="/sign-up/*?" component={AuthorSignUp} />
          <Route path="/sobre" component={About} />
          <Route component={NotFound} />
        </Switch>}
      </RoutedErrorBoundary>
    </Layout>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <AuthProvider><Router /></AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
