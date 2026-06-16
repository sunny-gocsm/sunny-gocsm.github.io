import DashboardHeader from "@/components/dashboard/DashboardHeader";
import Briefing from "./health/Briefing";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader activeTab="overview" />
      <main className="max-w-[1400px] mx-auto px-6 py-8">
        <Briefing />
      </main>
    </div>
  );
};

export default Index;
