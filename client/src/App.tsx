import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider, useAuth } from "@/hooks/use-auth";

import LoginPage from "@/pages/auth/login";
import DashboardPage from "@/pages/dashboard";
import ClientsPage from "@/pages/clients";
import ClientDetailPage from "@/pages/clients/client-detail";
import ClientReportPage from "@/pages/clients/report";
import TasksPage from "@/pages/tasks";
import NotFound from "@/pages/not-found";
import Layout from "@/components/layout/layout";

function PrivateRoute({ component: Component, ...rest }: any) {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;

  if (!user) {
    return <Redirect to="/login" />;
  }

  return (
    <Layout>
      <Component />
    </Layout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      
      <Route path="/">
        <PrivateRoute component={DashboardPage} />
      </Route>
      
      <Route path="/clients">
        <PrivateRoute component={ClientsPage} />
      </Route>

      <Route path="/clients/:id/report">
        {(params) => (
             <ClientReportPage id={params.id} />
        )}
      </Route>

      <Route path="/clients/:id">
        {(params) => (
          <Layout>
            <ClientDetailPage id={params.id} />
          </Layout>
        )}
      </Route>

      <Route path="/tasks">
        <PrivateRoute component={TasksPage} />
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
