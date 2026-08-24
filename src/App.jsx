import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
// Add page imports here
import LuxLayout from '@/components/luxury/LuxLayout';
import LuxuryHome from '@/pages/LuxuryHome';
import Listings from '@/pages/Listings';
import PropertyDetail from '@/pages/PropertyDetail';
import Calculators from '@/pages/Calculators';
import MapSearch from '@/pages/MapSearch';
import SavedProperties from '@/pages/SavedProperties';
import Bidding from '@/pages/Bidding';
import InvestorSignup from '@/pages/InvestorSignup';
import InvestorDashboard from '@/pages/InvestorDashboard';
import InvestorPipeline from '@/pages/InvestorPipeline';
import Alerts from '@/pages/Alerts';
import SellerDashboard from '@/pages/SellerDashboard';
import SellerPostProperty from '@/pages/SellerPostProperty';
import NegotiationAssistant from '@/pages/NegotiationAssistant';
import AdminSources from '@/pages/AdminSources';
import AdminOutreach from '@/pages/AdminOutreach';
import NegotiationChat from '@/pages/NegotiationChat';
import SmartContractDetail from '@/pages/SmartContractDetail';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Navigate } from 'react-router-dom';
import ErrorBoundary from '@/components/ErrorBoundary';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-black/10 border-t-black rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route element={<LuxLayout />}>
        <Route path="/" element={<LuxuryHome />} />
        <Route path="/listings" element={<Listings />} />
        <Route path="/properties/:id" element={<PropertyDetail />} />
        <Route path="/properties/:id/bid" element={<Bidding />} />
        <Route path="/calculators" element={<Calculators />} />
        <Route path="/map" element={<MapSearch />} />
        <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
          <Route path="/investor/signup" element={<InvestorSignup />} />
          <Route path="/investor/dashboard" element={<InvestorDashboard />} />
          <Route path="/investor/pipeline" element={<InvestorPipeline />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/saved" element={<SavedProperties />} />
          <Route path="/seller/dashboard" element={<SellerDashboard />} />
          <Route path="/seller/post-property" element={<SellerPostProperty />} />
          <Route path="/seller/negotiation/:propertyId" element={<NegotiationChat />} />
          <Route path="/negotiation/:propertyId" element={<NegotiationChat />} />
          <Route path="/contracts/:id" element={<SmartContractDetail />} />
          <Route path="/admin/sources" element={<AdminSources />} />
          <Route path="/admin/outreach" element={<AdminOutreach />} />
        </Route>
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <ErrorBoundary>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <ScrollToTop />
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App