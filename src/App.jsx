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
import Bidding from '@/pages/Bidding';
import InvestorSignup from '@/pages/InvestorSignup';
import InvestorDashboard from '@/pages/InvestorDashboard';
import InvestorPipeline from '@/pages/InvestorPipeline';
import Alerts from '@/pages/Alerts';
import SellerDashboard from '@/pages/SellerDashboard';
import SellerPostProperty from '@/pages/SellerPostProperty';
import NegotiationAssistant from '@/pages/NegotiationAssistant';
import AdminDashboard from '@/pages/AdminDashboard';
import AdminSources from '@/pages/AdminSources';
import AdminOutreach from '@/pages/AdminOutreach';
import AdminTestLab from '@/pages/AdminTestLab';
import AdminArchitecture from '@/pages/AdminArchitecture';
import AdminSearchConsole from '@/pages/AdminSearchConsole';
import SystemDNA from '@/pages/SystemDNA';
import SmartContractMarketing from '@/pages/SmartContractMarketing';
import DealCalculator from '@/pages/DealCalculator';
import AgentDashboard from '@/pages/AgentDashboard';
import LegalCompliance from '@/pages/LegalCompliance';
import IndustryIntelligence from '@/pages/IndustryIntelligence';
import AdminAnalytics from '@/pages/AdminAnalytics';
import InvestorLeaderboard from '@/pages/InvestorLeaderboard';
import AdminProbateDashboard from '@/pages/AdminProbateDashboard';
import AdminStrategy from '@/pages/AdminStrategy';
import AdminTricksOfTrade from '@/pages/AdminTricksOfTrade';
import AdminSourcesDirectory from '@/pages/AdminSourcesDirectory';
import AdminDistressEducation from '@/pages/AdminDistressEducation';
import AdminDistressTracker from '@/pages/AdminDistressTracker';
import ShadowCommandCenter from '@/pages/ShadowCommandCenter';
import EdenSkyeProfile from '@/pages/EdenSkyeProfile';
import EdenSkyeChat from '@/pages/EdenSkyeChat';
import EmailTemplateGallery from '@/pages/EmailTemplateGallery';
import AdminApiKeys from '@/pages/AdminApiKeys';
import AdminApiGenerator from '@/pages/AdminApiGenerator';
import AdminNumbers from '@/pages/AdminNumbers';
import AdminEdenVoice from '@/pages/AdminEdenVoice';
import AdminCalendar from '@/pages/AdminCalendar';
import AdminPreflight from '@/pages/AdminPreflight';
import FloridaSourceDirectory from '@/pages/FloridaSourceDirectory';
import AdminEnrichmentUpgrades from '@/pages/AdminEnrichmentUpgrades';
import AdminXtremeVision from '@/pages/AdminXtremeVision';
import PortalRouter from '@/pages/PortalRouter';
import V2Layout from '@/components/v2/V2Layout';
import V2Home from '@/pages/v2/V2Home';
import V2AppShell from '@/components/v2/V2AppShell';
import V2AppHome from '@/pages/v2/V2AppHome';
import V2InvestorApp from '@/pages/v2/V2InvestorApp';
import V2AgentApp from '@/pages/v2/V2AgentApp';
import V2SellerApp from '@/pages/v2/V2SellerApp';
import V2BrokerApp from '@/pages/v2/V2BrokerApp';
import V2SwarmDashboard from '@/pages/v2/V2SwarmDashboard';
import V2Listings from '@/pages/v2/V2Listings';
import V2PropertyDetail from '@/pages/v2/V2PropertyDetail';
import About from '@/pages/About';
import Contact from '@/pages/Contact';
import TheProcess from '@/pages/TheProcess';
import LaunchElite from '@/pages/LaunchElite';
import Pricing from '@/pages/Pricing';
import Blog from '@/pages/Blog';
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
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route path="/admin" element={<AdminDashboard />} />
      </Route>
      <Route element={<LuxLayout />}>
        <Route path="/listings" element={<Listings />} />
        <Route path="/properties/:id" element={<PropertyDetail />} />
        <Route path="/properties/:id/bid" element={<Bidding />} />
        <Route path="/calculators" element={<Calculators />} />
        <Route path="/about" element={<About />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/launch" element={<LaunchElite />} />
        <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
          <Route path="/investor/signup" element={<InvestorSignup />} />
          <Route path="/investor/dashboard" element={<InvestorDashboard />} />
          <Route path="/investor/pipeline" element={<InvestorPipeline />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/seller/dashboard" element={<SellerDashboard />} />
          <Route path="/seller/post-property" element={<SellerPostProperty />} />
          <Route path="/seller/negotiation/:propertyId" element={<NegotiationChat />} />
          <Route path="/negotiation/:propertyId" element={<NegotiationChat />} />
          <Route path="/contracts/:id" element={<SmartContractDetail />} />
          <Route path="/portal" element={<PortalRouter />} />
          <Route path="/admin/sources" element={<AdminSources />} />
          <Route path="/admin/outreach" element={<AdminOutreach />} />
          <Route path="/admin/test-lab" element={<AdminTestLab />} />
          <Route path="/admin/architecture" element={<AdminArchitecture />} />
          <Route path="/admin/search-console" element={<AdminSearchConsole />} />
          <Route path="/system-dna" element={<SystemDNA />} />
        <Route path="/deal-calculator" element={<DealCalculator />} />
        <Route path="/agent/dashboard" element={<AgentDashboard />} />
        <Route path="/legal-compliance" element={<LegalCompliance />} />
        <Route path="/industry-intelligence" element={<IndustryIntelligence />} />
        <Route path="/admin/analytics" element={<AdminAnalytics />} />
        <Route path="/investor/leaderboard" element={<InvestorLeaderboard />} />
        <Route path="/admin/probate" element={<AdminProbateDashboard />} />
        <Route path="/admin/strategy" element={<AdminStrategy />} />
        <Route path="/admin/tricks" element={<AdminTricksOfTrade />} />
        <Route path="/admin/sources-directory" element={<AdminSourcesDirectory />} />
        <Route path="/admin/distress-education" element={<AdminDistressEducation />} />
        <Route path="/admin/distress-tracker" element={<AdminDistressTracker />} />
        <Route path="/admin/shadow" element={<ShadowCommandCenter />} />
        <Route path="/admin/email-gallery" element={<EmailTemplateGallery />} />
        <Route path="/admin/api-keys" element={<AdminApiKeys />} />
        <Route path="/admin/api-generator" element={<AdminApiGenerator />} />
        <Route path="/admin/numbers" element={<AdminNumbers />} />
        <Route path="/admin/eden-voice" element={<AdminEdenVoice />} />
        <Route path="/admin/calendar" element={<AdminCalendar />} />
        <Route path="/admin/preflight" element={<AdminPreflight />} />
        <Route path="/admin/florida-sources" element={<FloridaSourceDirectory />} />
        <Route path="/admin/enrichment-upgrades" element={<AdminEnrichmentUpgrades />} />
        <Route path="/admin/xtreme-vision" element={<AdminXtremeVision />} />
        </Route>
        <Route path="/eden-skye" element={<EdenSkyeProfile />} />
        <Route path="/eden-skye/chat" element={<EdenSkyeChat />} />
      </Route>
      {/* V2 — Zillow/Redfin-clean redesign (now the home page) */}
      <Route element={<V2Layout />}>
        <Route path="/" element={<V2Home />} />
        <Route path="/v2" element={<V2Home />} />
        <Route path="/v2/listings" element={<V2Listings />} />
        <Route path="/v2/properties/:id" element={<V2PropertyDetail />} />
        <Route path="/smart-contracts" element={<SmartContractMarketing />} />
        <Route path="/process" element={<TheProcess />} />
        <Route path="/pricing" element={<Pricing />} />
      </Route>
      {/* V2 PWA — persona dashboards with bottom nav */}
      <Route element={<V2AppShell />}>
        <Route path="/v2/app" element={<V2AppHome />} />
        <Route path="/v2/app/investor" element={<V2InvestorApp />} />
        <Route path="/v2/app/agent" element={<V2AgentApp />} />
        <Route path="/v2/app/seller" element={<V2SellerApp />} />
        <Route path="/v2/app/broker" element={<V2BrokerApp />} />
        <Route path="/v2/swarm" element={<V2SwarmDashboard />} />
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