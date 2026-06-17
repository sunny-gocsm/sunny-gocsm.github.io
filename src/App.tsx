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
            <Route element={<AppLayout />}>
              <Route path="/" element={<Index />} />
              <Route path="/today" element={<Index />} />
              <Route path="/accounts" element={<AccountsPage />} />
              <Route path="/accounts/:id" element={<AccountDetailPage />} />
              <Route path="/playbooks" element={<PlaybooksPage />} />
              <Route path="/playbooks/:id" element={<PlaybookDetailPage />} />
              <Route path="/onboarding" element={<StubPage title="Onboarding" />} />
              <Route path="/money" element={<StubPage title="Money" />} />
              <Route path="/configure" element={<StubPage title="Configure" />} />
              <Route path="/activity" element={<Activity />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
