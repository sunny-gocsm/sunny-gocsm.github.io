import DashboardHeader from "@/components/dashboard/DashboardHeader";
import AgencyHealthHero from "@/components/overview/AgencyHealthHero";
import HealthTrendCard from "@/components/overview/HealthTrendCard";
import PortfolioOverviewCards from "@/components/overview/PortfolioOverviewCards";
import AttentionAccountsTable from "@/components/overview/AttentionAccountsTable";
import TopPerformingAccounts from "@/components/overview/TopPerformingAccounts";


import { Building2, Activity, AlertTriangle, Users, DollarSign, Heart, UserCheck, Star } from "lucide-react";

import {
  agencyHealthData,
  healthTrend,
  attentionAccounts,
  topPerformingAccounts,
} from "@/data/agencyOverviewData";
import { subAccountsData, CSM_OPTIONS } from "@/data/subAccountsData";
import { useMemo, useState } from "react";
import OverviewFilterPopover, { OverviewFilters } from "@/components/overview/OverviewFilterPopover";

const Index = () => {
  const [filters, setFilters] = useState<OverviewFilters>({ plan: "all", signedUp: "all", csm: "all" });
  const csmFilter = filters.csm;

  const scopedAccounts = useMemo(() => {
    return subAccountsData.filter((a) => {
      if (filters.plan !== "all" && a.plan !== filters.plan) return false;
      if (filters.csm === "unassigned" && a.assignedCsm) return false;
      if (filters.csm !== "all" && filters.csm !== "unassigned" && a.assignedCsm !== filters.csm) return false;
      return true;
    });
  }, [filters]);

  const scopedIds = useMemo(() => new Set(scopedAccounts.map((a) => a.id)), [scopedAccounts]);

  const healthDistribution = useMemo(() => {
    const enabled = scopedAccounts.filter((a) => a.status === "Enabled");
    const total = enabled.length;
    const buckets = [
      { name: "Thriving", count: enabled.filter((a) => a.healthScore >= 80).length, color: "hsl(var(--health-green))" },
      { name: "Healthy", count: enabled.filter((a) => a.healthScore >= 60 && a.healthScore < 80).length, color: "hsl(var(--health-blue))" },
      { name: "Steady", count: enabled.filter((a) => a.healthScore >= 40 && a.healthScore < 60).length, color: "hsl(var(--health-yellow))" },
      { name: "At Risk", count: enabled.filter((a) => a.healthScore < 40).length, color: "hsl(var(--health-red))" },
    ];
    return buckets.map((b) => ({ ...b, percent: total ? Math.round((b.count / total) * 100) : 0 }));
  }, [scopedAccounts]);

  const heroScore = useMemo(() => {
    const enabled = scopedAccounts.filter((a) => a.status === "Enabled");
    if (csmFilter === "all") return agencyHealthData.score;
    if (!enabled.length) return 0;
    return Math.round(enabled.reduce((s, a) => s + a.healthScore, 0) / enabled.length);
  }, [scopedAccounts, csmFilter]);

  const { portfolioMetrics, priorityMetrics } = useMemo(() => {
    const enabled = scopedAccounts.filter((a) => a.status === "Enabled");
    const disabled = scopedAccounts.filter((a) => a.status === "Disabled");
    const totalRevenue = enabled.reduce((s, a) => s + a.revenue, 0);
    const revenueAtRisk = enabled.filter((a) => a.healthScore < 40).reduce((s, a) => s + a.revenue, 0);
    const activeUsers = Math.round(enabled.length * 14.6);

    const priority = enabled.filter((a) => a.isPriority);
    const priorityCount = priority.length;
    const priorityAvgHealth = priorityCount
      ? Math.round(priority.reduce((s, a) => s + a.healthScore, 0) / priorityCount)
      : 0;
    const priorityMRR = priority.reduce((s, a) => s + a.revenue, 0);
    const priorityUsers = Math.round(priorityCount * 18.2);

    return {
      portfolioMetrics: [
        { label: "Total Active Accounts", value: String(scopedAccounts.length), delta: "+3", positive: true, icon: Building2, iconClass: "text-primary" },
        { label: "Tracked Accounts", value: String(enabled.length), delta: "+2", positive: true, icon: Activity, iconClass: "text-health-blue" },
        { label: "Churned Accounts", value: String(disabled.length), delta: "+1", positive: false, icon: AlertTriangle, iconClass: "text-health-red" },
        { label: "Active Users", value: String(activeUsers), delta: "+8%", positive: true, icon: Users, iconClass: "text-health-green" },
        { label: "Total Revenue", value: `$${totalRevenue.toLocaleString()}`, delta: "+4%", positive: true, icon: DollarSign, iconClass: "text-health-green" },
        { label: "Revenue at Risk", value: `$${revenueAtRisk.toLocaleString()}`, delta: "+12%", positive: false, icon: AlertTriangle, iconClass: "text-health-red" },
      ],
      priorityMetrics: [
        { label: "Accounts", value: String(priorityCount), delta: "+1", positive: true, icon: Star, iconClass: "text-amber-500" },
        { label: "Avg Health", value: String(priorityAvgHealth), delta: "+2", positive: true, icon: Heart, iconClass: "text-health-green" },
        { label: "Users", value: String(priorityUsers), delta: "+5%", positive: true, icon: UserCheck, iconClass: "text-health-blue" },
        { label: "MRR", value: `$${priorityMRR.toLocaleString()}`, delta: "+6%", positive: true, icon: DollarSign, iconClass: "text-health-green" },
      ],
    };
  }, [scopedAccounts]);

  const filteredAttention = useMemo(
    () => attentionAccounts.filter((a) => scopedIds.has(a.id)),
    [scopedIds]
  );

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader activeTab="overview" />
      <main className="max-w-[1400px] mx-auto px-6 py-8">
        <div />
      </main>
    </div>
  );
};

export default Index;
