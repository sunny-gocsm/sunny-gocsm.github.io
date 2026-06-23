import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import AppLayout from "./components/AppLayout";
import Index from "./pages/Index";
import Activity from "./pages/health/Activity";
import StubPage from "./pages/stubs/StubPage";
import AccountsPage from "./pages/AccountsPage";
import AccountDetailPage from "./pages/AccountDetailPage";
import PlaybooksPage from "./pages/PlaybooksPage";
import PlaybookDetailPage from "./pages/PlaybookDetailPage";
import MoneyPage from "./pages/MoneyPage";
import OutcomesPage from "./pages/OutcomesPage";
import OnboardingPage from "./pages/OnboardingPage";
import InsightsPage from "./pages/InsightsPage";
import ConfigurePage from "./pages/ConfigurePage";
import SetupPage from "./pages/SetupPage";
import AttentionLab from "./pages/AttentionLab";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/setup" element={<SetupPage />} />
            <Route element={<AppLayout />}>
              {/* HighLevel custom-menu-link embeds — the same pages, rendered with NO left
                  nav (AppLayout drops the rail in embed mode). Three standalone URLs:
                  /embed/attention · /embed/playbooks · /embed/outcomes */}
              <Route path="/embed/attention" element={<Index />} />
              <Route path="/embed/playbooks" element={<PlaybooksPage />} />
              <Route path="/embed/outcomes" element={<OutcomesPage />} />
              <Route path="/" element={<Index />} />
              <Route path="/today" element={<Index />} />
              <Route path="/accounts" element={<AccountsPage />} />
              <Route path="/accounts/:id" element={<AccountDetailPage />} />
              <Route path="/playbooks" element={<PlaybooksPage />} />
              <Route path="/playbooks/:id" element={<PlaybookDetailPage />} />
              <Route path="/onboarding" element={<OnboardingPage />} />
              <Route path="/money" element={<MoneyPage />} />
              <Route path="/outcomes" element={<OutcomesPage />} />
              <Route path="/insights" element={<InsightsPage />} />
              <Route path="/insights/:view" element={<InsightsPage />} />
              <Route path="/configure" element={<ConfigurePage />} />
              <Route path="/activity" element={<Activity />} />
              <Route path="/attention-lab" element={<AttentionLab />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
