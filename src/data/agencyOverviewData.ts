import { subAccountsData } from "./subAccountsData";

export const agencyHealthData = {
  score: 82,
  scoreDelta: -4,
  scorePeriod: "vs last month",
  status: "Thriving" as const,
  avgSubAccountScore: 74,
  healthyPercent: 60,
  atRiskPercent: 25,
  criticalPercent: 5,
  stablePercent: 10,
};

export const kpiData = [
  { label: "Total Sub-Accounts", value: "36", change: "+3", positive: true },
  { label: "Tracked Accounts", value: "32", change: "+2", positive: true },
  { label: "Disabled Accounts", value: "4", change: "-1", positive: true },
  { label: "Total MRR", value: "$218,100", change: "+4%", positive: true },
  { label: "MRR at Risk", value: "$24,450", change: "+12%", positive: false },
  { label: "At Risk Accounts", value: "2", change: "+1", positive: false },
];

export const revenueData = {
  totalMRR: 218100,
  mrrGrowth: 8, 
  revenueAtRisk: 24450,
  churnedRevenue: 8200,
  trend: [
    { day: "Feb 1", revenue: 158000 },
    { day: "Feb 5", revenue: 159200 },
    { day: "Feb 9", revenue: 161000 },
    { day: "Feb 13", revenue: 162500 },
    { day: "Feb 17", revenue: 164800 },
    { day: "Feb 21", revenue: 168000 },
    { day: "Feb 25", revenue: 171500 },
    { day: "Mar 1", revenue: 173200 },
  ],
};

const enabledAccounts = subAccountsData.filter(a => a.status === "Enabled");
const totalEnabled = enabledAccounts.length;
const thrivingCount = enabledAccounts.filter(a => a.healthScore >= 80).length;
const healthyCount = enabledAccounts.filter(a => a.healthScore >= 60 && a.healthScore < 80).length;
const steadyCount = enabledAccounts.filter(a => a.healthScore >= 40 && a.healthScore < 60).length;
const atRiskCount = enabledAccounts.filter(a => a.healthScore < 40).length;

export const healthDistribution = [
  { name: "Thriving", count: thrivingCount, percent: totalEnabled ? Math.round((thrivingCount / totalEnabled) * 100) : 0, color: "hsl(var(--health-green))" },
  { name: "Healthy", count: healthyCount, percent: totalEnabled ? Math.round((healthyCount / totalEnabled) * 100) : 0, color: "hsl(var(--health-blue))" },
  { name: "Steady", count: steadyCount, percent: totalEnabled ? Math.round((steadyCount / totalEnabled) * 100) : 0, color: "hsl(var(--health-yellow))" },
  { name: "At Risk", count: atRiskCount, percent: totalEnabled ? Math.round((atRiskCount / totalEnabled) * 100) : 0, color: "hsl(var(--health-red))" },
];

export const paymentFailures = [
  { name: "FirstPlace Fitness", plan: "Starter", amount: 6800, status: "Failed" as const },
  { name: "BrightWater Pools", plan: "Manual", amount: 9500, status: "Past Due" as const },
  { name: "FlexGym", plan: "Pro", amount: 8500, status: "Retry Scheduled" as const },
];

export const accountAlerts = [
  { name: "SwiftRealty", type: "Downgrade" as const, detail: "Pro → Starter", amount: -2900 },
  { name: "Coastal Designs", type: "Add-on Canceled" as const, detail: "SMS Pack removed", amount: -450 },
  { name: "UrbanBrew Coffee", type: "Add-on Canceled" as const, detail: "White-label removed", amount: -1200 },
];

export const attentionAccounts = [
  { id: "2", name: "FirstPlace Fitness", score: 38, trend: -8, mrr: 6800, risk: "High" as const, reason: "Declining engagement" },
  { id: "3", name: "SwiftRealty", score: 43, trend: -12, mrr: 4100, risk: "High" as const, reason: "No login 14+ days" },
  { id: "7", name: "BrightWater Pools", score: 47, trend: -5, mrr: 9500, risk: "High" as const, reason: "Payment failure" },
  { id: "8", name: "FlexGym", score: 52, trend: -3, mrr: 8500, risk: "High" as const, reason: "Feature adoption low" },
  { id: "10", name: "Coastal Designs", score: 71, trend: 2, mrr: 3200, risk: "Medium" as const, reason: "Pending feedback" },
];

export const topPerformingAccounts = [
  { id: "1", name: "Pinnacle Marketing", score: 95, trend: 4, mrr: 12500, highlight: "100% feature adoption" },
  { id: "4", name: "Summit Legal Group", score: 92, trend: 6, mrr: 9800, highlight: "NPS 9.5 · 0 tickets" },
  { id: "5", name: "GreenLeaf Landscaping", score: 89, trend: 3, mrr: 7200, highlight: "Upgraded last month" },
  { id: "6", name: "Metro Dental Care", score: 87, trend: 8, mrr: 8400, highlight: "Daily active users ↑32%" },
  { id: "9", name: "Harbor Insurance", score: 85, trend: 2, mrr: 11000, highlight: "Renewed for 12 months" },
];

export const agencyActions = [
  { title: "Re-engage 3 dormant accounts", description: "SwiftRealty, FlexGym, and Coastal Designs haven't logged in for 14+ days. Send a personalized check-in or schedule a call.", impact: "High" as const, category: "Engagement" },
  { title: "Resolve payment failures", description: "3 accounts have failed payments totaling $24,800. Retry billing or reach out to update payment methods.", impact: "High" as const, category: "Revenue" },
  { title: "Promote add-on adoption", description: "18 accounts are on base plans. Targeted upsell campaigns for SMS, white-label, or reporting add-ons could increase ARPU.", impact: "Medium" as const, category: "Growth" },
  { title: "Collect NPS from 8 accounts", description: "8 accounts have no recent NPS feedback. Send a quick survey to identify satisfaction gaps early.", impact: "Medium" as const, category: "Sentiment" },
  { title: "Review downgrade reasons", description: "SwiftRealty downgraded from Pro to Starter. Schedule a call to understand pain points and offer tailored solutions.", impact: "High" as const, category: "Retention" },
];

export const healthTrend = [
  { day: "Dec 1", score: 78 },
  { day: "Dec 10", score: 76 },
  { day: "Dec 20", score: 74 },
  { day: "Jan 1", score: 75 },
  { day: "Jan 10", score: 77 },
  { day: "Jan 20", score: 79 },
  { day: "Feb 1", score: 80 },
  { day: "Feb 10", score: 83 },
  { day: "Feb 15", score: 81 },
  { day: "Feb 20", score: 84 },
  { day: "Feb 25", score: 82 },
  { day: "Mar 1", score: 82 },
];