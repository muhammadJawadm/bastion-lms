import { Toaster } from "@/components/ui/sonner";
import { HelmetProvider } from "react-helmet-async";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import { useEffect } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import About from "./pages/About";
import Services from "./pages/Services";
import Training from "./pages/Training";
import Consultation from "./pages/Consultation";
import Contact from "./pages/Contact";
import OshaLanding from "./pages/OshaLanding";
import Blog, { ArticleDetail } from "./pages/Blog";
import LMSInfo from "./pages/LMSInfo";

// LMS Pages
import { LMSProvider } from "./pages/lms/LMSContext";
import LMSHome from "./pages/lms/LMSHome";
import LMSLogin from "./pages/lms/LMSLogin";
import LMSDashboard from "./pages/lms/LMSDashboard";
import LMSCourses from "./pages/lms/LMSCourses";
import LMSBuilder from "./pages/lms/LMSBuilder";
import LMSCoursePlayer from "./pages/lms/LMSCoursePlayer";
import LMSEmployees from "./pages/lms/LMSEmployees";
import LMSAnalytics from "./pages/lms/LMSAnalytics";
import LMSReports from "./pages/lms/LMSReports";
import LMSAssignments from "./pages/lms/LMSAssignments";
import LMSClients from "./pages/lms/LMSClients";
import LMSSettings from "./pages/lms/LMSSettings";
import LMSMyTraining from "./pages/lms/LMSMyTraining";
import LMSAbout from "./pages/lms/LMSAbout";
import LMSDemoEmployee from "./pages/lms/demo/LMSDemoEmployee";
import LMSDemoAdmin from "./pages/lms/demo/LMSDemoAdmin";
import LMSMagicVerify from "./pages/lms/LMSMagicVerify";
import LMSAdminCompanies from "./pages/lms/admin/LMSAdminCompanies";
import LMSAdminQuestions from "./pages/lms/admin/LMSAdminQuestions";
import LMSAdminConversations from "./pages/lms/admin/LMSAdminConversations";
import LMSAdminAnalytics from "./pages/lms/admin/LMSAdminAnalytics";
import LMSBilling from "./pages/lms/LMSBilling";
import LMSCourseBuilder from "./pages/lms/LMSCourseBuilder";
import LMSCourseLibrary from "./pages/lms/LMSCourseLibrary";
import LMSForms from "./pages/lms/LMSForms";
import LMSFormBuilder from "./pages/lms/LMSFormBuilder";

function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    // If there's a hash in the URL, let the browser handle scrolling to the anchor.
    // Otherwise, scroll to the top of the page on every route change.
    if (!window.location.hash) {
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [location]);
  return null;
}

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <>
    <ScrollToTop />
    <Switch>
      {/* Main site routes */}
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/services" component={Services} />
      <Route path="/training" component={Training} />
      <Route path="/consultation" component={Consultation} />
      <Route path="/contact" component={Contact} />
      <Route path="/osha-training-san-diego" component={OshaLanding} />
      <Route path="/blog" component={Blog} />
      <Route path="/blog/:slug">{(params) => <ArticleDetail slug={params.slug ?? ""} />}</Route>
      <Route path="/lms-platform" component={LMSInfo} />

      {/* LMS routes */}
      <Route path="/lms" component={LMSHome} />
      <Route path="/lms/login" component={LMSLogin} />
      <Route path="/lms/dashboard" component={LMSDashboard} />
      <Route path="/lms/courses" component={LMSCourses} />
      <Route path="/lms/course-library" component={LMSCourseLibrary} />
      <Route path="/lms/forms" component={LMSForms} />
      <Route path="/lms/forms/builder/:id" component={LMSFormBuilder} />
      <Route path="/lms/course-builder" component={LMSCourseBuilder} />
      <Route path="/lms/builder" component={LMSBuilder} />
      <Route path="/lms/builder/:courseId" component={LMSBuilder} />
      <Route path="/lms/course-player" component={LMSCoursePlayer} />
      <Route path="/lms/courses/:id" component={LMSCoursePlayer} />
      <Route path="/lms/employees" component={LMSEmployees} />
      <Route path="/lms/analytics" component={LMSAnalytics} />
      <Route path="/lms/reports" component={LMSReports} />
      <Route path="/lms/assignments" component={LMSAssignments} />
      <Route path="/lms/clients" component={LMSClients} />
      <Route path="/lms/settings" component={LMSSettings} />
      <Route path="/lms/billing" component={LMSBilling} />
      <Route path="/lms/my-training" component={LMSMyTraining} />
      <Route path="/lms/about" component={LMSAbout} />
      <Route path="/lms/demo/employee" component={LMSDemoEmployee} />
      <Route path="/lms/demo/admin" component={LMSDemoAdmin} />
      <Route path="/lms/magic" component={LMSMagicVerify} />

      {/* Platform Admin routes */}
      <Route path="/lms/admin/companies" component={LMSAdminCompanies} />
      <Route path="/lms/admin/questions" component={LMSAdminQuestions} />
      <Route path="/lms/admin/conversations" component={LMSAdminConversations} />
      <Route path="/lms/admin/analytics" component={LMSAdminAnalytics} />

      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
    </>
  );
}

function App() {
  return (
    <HelmetProvider>
      <ErrorBoundary>
        <ThemeProvider defaultTheme="light">
          <TooltipProvider>
            <LMSProvider>
              <Toaster />
              <Router />
            </LMSProvider>
          </TooltipProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </HelmetProvider>
  );
}

export default App;
