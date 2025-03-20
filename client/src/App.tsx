import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Loader2 } from "lucide-react";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import Register from "@/pages/register";
import ForgotPassword from "@/pages/forgot-password";
import AdminDashboard from "@/pages/admin-dashboard";
import CreateEvent from "@/pages/create-event";
import CouponManagement from "@/pages/coupon-management";
import AccountingCodeManagement from "@/pages/accounting-code-management";
import UserDashboard from "@/pages/user-dashboard";
import HouseholdPage from "@/pages/household";
import ChatPage from "@/pages/chat";
import EditEvent from "@/pages/edit-event";
import EventApplicationForm from "@/pages/event-application-form";
import EmailTemplatesPage from "@/pages/email-templates";
import { useAuth } from "@/hooks/use-auth";
import EventRegistration from "./pages/event-registration";
import { FeeManagement } from "@/components/events/FeeManagement";
import { AuthProvider } from "@/hooks/use-auth";


// Protected Route Component
function ProtectedRoute({ component: Component, adminOnly = false }: { component: React.ComponentType, adminOnly?: boolean }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    window.location.href = '/auth';
    return null;
  }

  if (adminOnly && !user.isAdmin) {
    return <NotFound />;
  }

  return <Component />;
}

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Public routes that don't require authentication
  if (!user) {
    return (
      <Switch>
        <Route path="/auth" component={AuthPage} />
        <Route path="/register" component={Register} />
        <Route path="/forgot-password" component={ForgotPassword} />
        <Route path="/register/event/:eventId" component={EventRegistration} />
        {/* Redirect all other routes to auth page */}
        <Route>
          <AuthPage />
        </Route>
      </Switch>
    );
  }

  // Protected routes for authenticated users
  return (
    <Switch>
      <ProtectedRoute path="/admin/events/create" component={CreateEvent} adminOnly />
      <ProtectedRoute path="/admin/events/:id/edit" component={EditEvent} adminOnly />
      <ProtectedRoute path="/admin/events/:id/application-form" component={EventApplicationForm} adminOnly />
      <ProtectedRoute path="/admin/events/:eventId/fees" component={({eventId}) => <FeeManagement eventId={eventId} />} adminOnly />
      <ProtectedRoute path="/admin/events/:id" component={EditEvent} adminOnly />
      <ProtectedRoute path="/admin/events/:id/coupons" component={CouponManagement} adminOnly />
      <ProtectedRoute path="/admin/accounting-codes" component={AccountingCodeManagement} adminOnly />
      <ProtectedRoute path="/admin/email-templates" component={EmailTemplatesPage} adminOnly />
      <ProtectedRoute path="/admin/events" component={AdminDashboard} adminOnly />
      <ProtectedRoute path="/admin" component={AdminDashboard} adminOnly />
      <ProtectedRoute path="/household" component={HouseholdPage} />
      <ProtectedRoute path="/chat" component={ChatPage} />
      <ProtectedRoute path="/register/event/:eventId" component={EventRegistration} />
      <ProtectedRoute path="/" component={UserDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;