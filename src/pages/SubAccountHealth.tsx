import { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import AccountInfoCard from "@/components/dashboard/AccountInfoCard";
import HealthScoreTrendCard from "@/components/dashboard/HealthScoreTrendCard";
import HealthDriversCard from "@/components/dashboard/HealthDriversCard";
import RiskOpportunityCards from "@/components/dashboard/RiskOpportunityCards";
import RecommendedActionsCard from "@/components/dashboard/RecommendedActionsCard";
import { subAccountsData } from "@/data/subAccountsData";

const generateTrendData = (currentScore: number) => {
  const variance = () => Math.floor(Math.random() * 8) - 3;
  return [
    { label: "7M", score: Math.max(0, Math.min(100, currentScore + variance())) },
    { label: "6M", score: Math.max(0, Math.min(100, currentScore + variance())) },
    { label: "5M", score: Math.max(0, Math.min(100, currentScore + variance())) },
    { label: "4M", score: Math.max(0, Math.min(100, currentScore + variance())) },
    { label: "3M", score: Math.max(0, Math.min(100, currentScore + variance())) },
    { label: "2M", score: Math.max(0, Math.min(100, currentScore + variance())) },
    { label: "1M", score: Math.max(0, Math.min(100, currentScore + variance())) },
    { label: "Today", score: currentScore },
  ];
};

const getDrivers = (score: number) => {
  const revenuePositive = score >= 80;
  const adoptionPositive = score >= 60;
  const loginPositive = score >= 50;
  const sentimentPositive = score >= 60;

  return [
    {
      name: "Product Adoption",
      impact: (adoptionPositive ? "positive" : "negative") as "positive" | "negative",
      summary: adoptionPositive ? "Strong usage of automations." : "Low feature adoption.",
      detail: adoptionPositive
        ? "This account actively uses workflows, email campaigns, and pipeline automations. Feature adoption is well above average for their plan tier."
        : "This account is underutilizing available features. Workflow and automation adoption is below average for their plan tier.",
    },
    {
      name: "Revenue Behavior",
      impact: (revenuePositive ? "positive" : "negative") as "positive" | "negative",
      summary: revenuePositive ? "Stable revenue trajectory." : "Revenue showing signs of decline.",
      detail: revenuePositive
        ? "Revenue has been stable or growing. No recent downgrades or cancellations detected."
        : "Revenue signals show potential cost cutting. Add-on cancellations or downgrade signals have been detected over the past 60 days.",
    },
    {
      name: "Login Activity",
      impact: (loginPositive ? "positive" : "negative") as "positive" | "negative",
      summary: loginPositive ? "Consistent access." : "Declining login frequency.",
      detail: loginPositive
        ? "Team members log in regularly with no significant change in frequency over the past 90 days."
        : "Login frequency has dropped significantly. The team may be disengaging from the platform.",
    },
    {
      name: "Customer Sentiment",
      impact: (sentimentPositive ? "positive" : "negative") as "positive" | "negative",
      summary: sentimentPositive ? "High satisfaction scores." : "Low or missing feedback.",
      detail: sentimentPositive
        ? "The most recent NPS response was positive. No negative feedback has been submitted in the past quarter."
        : "NPS scores are below target or feedback is missing. Proactive outreach is recommended.",
    },
  ];
};

const getRiskData = (score: number) => {
  if (score >= 80) return null;
  return {
    title: score < 50 ? "High Churn Risk" : "Potential Revenue Decline",
    items: score < 50
      ? [
          { label: "Engagement dropping", description: "Login activity and feature usage are declining significantly." },
          { label: "Revenue at risk", description: "Recent cancellations or downgrades signal potential churn." },
        ]
      : [
          { label: "Revenue showing signs of decline", description: "Add-on cancellations or downgrade signals detected." },
          { label: "Attention needed", description: "Proactive engagement recommended to prevent further decline." },
        ],
  };
};

const getOpportunityData = (score: number) => {
  if (score < 40) return null;
  return {
    title: score >= 80 ? "Expansion Opportunity" : "Growth Signal Detected",
    items: score >= 80
      ? [
          { label: "Strong product adoption", description: "Feature usage is well above average — ideal candidate for upsell." },
          { label: "High customer satisfaction", description: "NPS and sentiment are consistently positive." },
          { label: "Consistent engagement", description: "Team members log in regularly with stable frequency." },
        ]
      : [
          { label: "Improving engagement", description: "Login patterns show positive momentum." },
          { label: "Adoption potential", description: "There is room to grow feature usage on the current plan." },
        ],
  };
};

const getActions = (score: number) => {
  if (score >= 80) return [
    { id: "1", label: "Explore upsell opportunities for premium features." },
    { id: "2", label: "Schedule a success review to reinforce value." },
    { id: "3", label: "Request a referral or case study." },
  ];
  if (score >= 60) return [
    { id: "1", label: "Check in with account owner about recent changes." },
    { id: "2", label: "Review revenue details for downgrade reasons." },
    { id: "3", label: "Schedule a quarterly business review." },
  ];
  return [
    { id: "1", label: "Urgently re-engage this account with a call." },
    { id: "2", label: "Investigate root cause of declining health." },
    { id: "3", label: "Offer incentives or tailored support to prevent churn." },
  ];
};

const planLabel = (plan: string, isNonSaaS: boolean) => {
  if (isNonSaaS) return "Manual Plan";
  return `${plan} Plan`;
};

const SubAccountHealth = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const account = useMemo(() => subAccountsData.find((a) => a.id === id), [id]);

  const [lifecycle, setLifecycle] = useState<"Onboarding" | "Growth" | "Mature">(account?.lifecycleStage ?? "Growth");

  const trendData = useMemo(() => generateTrendData(account?.healthScore ?? 50), [account?.id]);

  if (!account) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader activeTab="analytics" />
        <main className="max-w-[1200px] mx-auto px-6 py-8">
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground mb-6" onClick={() => navigate("/analytics")}>
            <ArrowLeft className="h-4 w-4" /> Back to Sub-Accounts
          </Button>
          <p className="text-muted-foreground">Account not found.</p>
        </main>
      </div>
    );
  }

  const score = account.healthScore;
  const drivers = getDrivers(score);
  const riskData = getRiskData(score);
  const opportunityData = getOpportunityData(score);
  const recommendedActions = getActions(score);

  const handleLifecycleChange = (stage: "Onboarding" | "Growth" | "Mature") => {
    setLifecycle(stage);
    toast({ title: "Lifecycle updated", description: `Stage set to ${stage}.` });
  };

  const daysActive = account.lifecycleStage === "Onboarding" ? Math.floor(Math.random() * 80) + 5
    : account.lifecycleStage === "Growth" ? Math.floor(Math.random() * 90) + 91
    : Math.floor(Math.random() * 200) + 181;

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader activeTab="analytics" />

      <main className="max-w-[1200px] mx-auto px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground hover:text-foreground"
            onClick={() => navigate("/analytics")}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Sub-Accounts
          </Button>
        </div>

        <h1 className="text-xl font-bold text-foreground mb-6">
          Sub-Account Health Overview
        </h1>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="w-full lg:w-[300px] flex-shrink-0">
            <AccountInfoCard
              accountName={account.name}
              ownerName={account.owner}
              ownerEmail={`${account.owner.toLowerCase().replace(/\s+/g, ".")}@company.com`}
              ownerPhone="+1 (555) 000-0000"
              planType={planLabel(account.plan, account.isNonSaaS)}
              status={account.status === "Enabled" ? "Active" : "Suspended"}
              lifecycle={lifecycle}
              daysActive={daysActive}
              totalUsers={Math.floor(Math.random() * 10) + 1}
              healthScore={score}
              lastUpdated={account.updatedAgo}
              clientSince={account.clientSince}
              onLifecycleChange={handleLifecycleChange}
            />
          </div>

          <div className="flex-1 space-y-6">
            <HealthScoreTrendCard
              score={score}
              explanation={
                score >= 80 ? "This account is thriving with strong engagement."
                  : score >= 60 ? "Healthy, but some areas need attention."
                  : score >= 40 ? "Steady — proactive engagement is recommended."
                  : "At risk — immediate intervention required."
              }
              trendData={trendData}
              changePoints={Math.abs(account.healthDelta)}
              direction={account.healthDelta >= 0 ? "up" : "down"}
              hasSufficientData={true}
            />
            <HealthDriversCard drivers={drivers} />
            <RiskOpportunityCards risk={riskData} opportunity={opportunityData} />
            <RecommendedActionsCard actions={recommendedActions} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default SubAccountHealth;
