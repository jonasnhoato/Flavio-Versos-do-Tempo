import { type ReactNode } from 'react';
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
import { Show, useAuth } from '@clerk/react';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
  Redirect,
} from 'wouter';

const queryClient = new QueryClient();

function PublicHome() {
  const { isSignedIn } = useAuth();
  return isSignedIn ? <Redirect to="/autor" /> : <Blog />;
}

function Router() {
  return (
    <Layout>
      <RoutedErrorBoundary>
        <Switch>
          <Route path="/" component={PublicHome} />
          <Route path="/autor"><Show when="signed-in"><Blog/></Show><Show when="signed-out"><Redirect to="/"/></Show></Route>
          <Route path="/sign-in/*?" component={AuthorSignIn} />
          <Route path="/sign-up/*?" component={AuthorSignUp} />
          <Route path="/poema/:id" component={PoemPage} />
          <Route path="/sobre" component={About} />
          <Route component={NotFound} />
        </Switch>
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
