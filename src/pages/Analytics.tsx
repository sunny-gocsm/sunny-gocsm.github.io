import { useState, useMemo, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import AnalyticsFilters from "@/components/analytics/AnalyticsFilters";
import ActionsFilterPopover from "@/components/analytics/ActionsFilterPopover";
import AccountRow from "@/components/analytics/AccountRow";
import BulkActionBar from "@/components/analytics/BulkActionBar";
import { subAccountsData, SubAccount, CSM_OPTIONS } from "@/data/subAccountsData";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Filter, Users, Rocket, TrendingUp, Crown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";

const STAGE_DEFINITIONS: Record<string, string> = {
  Onboarding: "Accounts aged 0–90 days. Early setup and activation phase.",
  Growth: "Accounts aged 90–180 days. Expanding usage and adoption.",
  Mature: "Accounts aged 180+ days. Established and fully adopted.",
};

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type SortKey = "name" | "signedUp" | "plan" | "stage" | "health" | "trend" | "revenue";
type SortDir = "asc" | "desc";

const PAGE_SIZES = [10, 25, 50];

const Analytics = () => {
  const [searchParams] = useSearchParams();
  const [accounts, setAccounts] = useState<SubAccount[]>(subAccountsData);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [accountStatusFilter, setAccountStatusFilter] = useState("all");
  const [tableTab, setTableTab] = useState<"all" | "tracked" | "disabled">("all");

  useEffect(() => {
    const health = searchParams.get("health");
    if (health && ["thriving", "healthy", "steady", "at-risk"].includes(health)) {
      setStatusFilter(health);
    }
  }, [searchParams]);
  const [stageFilter, setStageFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [csmFilter, setCsmFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const hasActiveFilters = statusFilter !== "all" || stageFilter !== "all" || riskFilter !== "all" || planFilter !== "all" || actionFilter !== "all" || accountStatusFilter !== "all" || csmFilter !== "all";

  const clearAll = () => {
    setStatusFilter("all");
    setAccountStatusFilter("all");
    setStageFilter("all");
    setRiskFilter("all");
    setPlanFilter("all");
    setActionFilter("all");
    setCsmFilter("all");
  };

  const filtered = useMemo(() => {
    let result = accounts.filter((a) => {
      // Tab-level filter
      if (tableTab === "tracked" && a.status !== "Enabled") return false;
      if (tableTab === "disabled" && a.status !== "Disabled") return false;
      if (search && !a.name.toLowerCase().includes(search.toLowerCase()) && !a.owner.toLowerCase().includes(search.toLowerCase())) return false;
      if (accountStatusFilter !== "all" && a.status !== accountStatusFilter) return false;
      if (statusFilter !== "all") {
        const s = a.healthScore;
        const healthBand = s >= 80 ? "thriving" : s >= 60 ? "healthy" : s >= 40 ? "steady" : "at-risk";
        if (healthBand !== statusFilter) return false;
      }
      if (stageFilter !== "all" && a.lifecycleStage !== stageFilter) return false;
      if (riskFilter !== "all" && a.riskLevel !== riskFilter) return false;
      if (planFilter !== "all") {
        if (planFilter === "Manual") {
          if (!a.isNonSaaS) return false;
        } else if (a.plan !== planFilter || a.isNonSaaS) return false;
      }
      if (csmFilter !== "all") {
        if (csmFilter === "unassigned") {
          if (a.assignedCsm) return false;
        } else if (a.assignedCsm !== csmFilter) return false;
      }
      if (actionFilter !== "all") {
        switch (actionFilter) {
          case "priority": if (!a.isPriority) return false; break;
          case "widget-on": if (!a.widgetEnabled) return false; break;
          case "widget-off": if (a.widgetEnabled) return false; break;
          case "feedback-available": {
            if (a.status === "Disabled") return false;
            if (a.lastFeedbackDate) {
              const diff = Date.now() - new Date(a.lastFeedbackDate).getTime();
              if (diff <= 7 * 24 * 60 * 60 * 1000) return false;
            }
            break;
          }
          case "disabled": if (a.status !== "Disabled") return false; break;
          case "enabled": if (a.status !== "Enabled") return false; break;
        }
      }
      return true;
    });

    // Default ordering: priority first, disabled last
    result = [...result].sort((a, b) => {
      // Priority accounts on top
      if (a.isPriority !== b.isPriority) return a.isPriority ? -1 : 1;
      // Disabled accounts at bottom
      const aDisabled = a.status === "Disabled";
      const bDisabled = b.status === "Disabled";
      if (aDisabled !== bDisabled) return aDisabled ? 1 : -1;
      return 0;
    });

    if (sortKey) {
      // Stable sort within priority/disabled groups
      result = [...result].sort((a, b) => {
        // Maintain priority-first, disabled-last grouping
        if (a.isPriority !== b.isPriority) return a.isPriority ? -1 : 1;
        const aDisabled = a.status === "Disabled";
        const bDisabled = b.status === "Disabled";
        if (aDisabled !== bDisabled) return aDisabled ? 1 : -1;

        let cmp = 0;
        switch (sortKey) {
          case "name": cmp = a.name.localeCompare(b.name); break;
          case "signedUp": cmp = new Date(a.clientSince).getTime() - new Date(b.clientSince).getTime(); break;
          case "plan": cmp = (a.isNonSaaS ? "Manual" : a.plan).localeCompare(b.isNonSaaS ? "Manual" : b.plan); break;
          case "stage": cmp = a.lifecycleStage.localeCompare(b.lifecycleStage); break;
          case "health": cmp = a.healthScore - b.healthScore; break;
          case "trend": cmp = a.healthDelta - b.healthDelta; break;
          case "revenue": cmp = a.revenue - b.revenue; break;
        }
        return sortDir === "asc" ? cmp : -cmp;
      });
    }

    return result;
  }, [accounts, search, statusFilter, stageFilter, riskFilter, planFilter, actionFilter, sortKey, sortDir, tableTab, accountStatusFilter, csmFilter]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleUpdate = (updated: SubAccount) => {
    setAccounts((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
  };

  const handleSetPriority = (id: string) => {
    setAccounts((prev) =>
      prev.map((a) => a.id === id ? { ...a, isPriority: !a.isPriority } : a)
    );
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(1);
  };

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === paginated.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginated.map((a) => a.id)));
    }
  }, [paginated, selectedIds.size]);

  const selectedAccounts = useMemo(() => accounts.filter((a) => selectedIds.has(a.id)), [accounts, selectedIds]);

  const bulkSetPriority = () => {
    setAccounts((prev) => prev.map((a) => selectedIds.has(a.id) ? { ...a, isPriority: true } : a));
    toast({ title: "Priority Set", description: `${selectedIds.size} account(s) marked as priority.` });
    setSelectedIds(new Set());
  };
  const bulkRequestFeedback = () => {
    const today = new Date().toISOString().split("T")[0];
    setAccounts((prev) => prev.map((a) => selectedIds.has(a.id) ? { ...a, lastFeedbackDate: today } : a));
    toast({ title: "Feedback Requested", description: `Feedback requested for ${selectedIds.size} account(s).` });
    setSelectedIds(new Set());
  };
  const bulkTriggerWorkflow = () => {
    toast({ title: "Workflow Triggered", description: `Workflow triggered for ${selectedIds.size} account(s).` });
    setSelectedIds(new Set());
  };
  const bulkAssignCsm = (csm: string | null) => {
    setAccounts((prev) => prev.map((a) => selectedIds.has(a.id) ? { ...a, assignedCsm: csm } : a));
    toast({ title: csm ? "CSM Assigned" : "CSM Unassigned", description: `${selectedIds.size} account(s) ${csm ? `assigned to ${csm}` : "unassigned"}.` });
    setSelectedIds(new Set());
  };

  const SortableHead = ({ label, sortKey: sk, currentKey, dir, onSort }: { label: string; sortKey: SortKey; currentKey: SortKey | null; dir: SortDir; onSort: (k: SortKey) => void }) => (
    <TableHead
      className="text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer select-none hover:text-foreground transition-colors"
      onClick={() => onSort(sk)}
    >
      <div className="flex items-center gap-1">
        {label}
        {currentKey === sk ? (
          dir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-40" />
        )}
      </div>
    </TableHead>
  );

  const csmScopedAccounts = useMemo(
    () => csmFilter === "all"
      ? accounts
      : csmFilter === "unassigned"
        ? accounts.filter((a) => !a.assignedCsm)
        : accounts.filter((a) => a.assignedCsm === csmFilter),
    [accounts, csmFilter]
  );

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader activeTab="analytics" />
      <main className="max-w-[1400px] mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-foreground">Sub-Account Analytics</h1>
          <p className="text-xs text-muted-foreground mt-1">A unified view of health and performance across all sub-accounts in your portfolio. Track health scores, MRR, and risk levels to quickly identify which accounts are thriving and which need attention.</p>
        </div>

        {/* Stats & Health Strip - 3 Grouped Cards */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1.4fr_1.8fr] gap-5 mb-6">
          {/* Card 1: Account Overview */}
           <div className="rounded-2xl bg-gradient-to-br from-blue-500/8 via-card to-indigo-500/8 border border-blue-200/30 shadow-sm p-3 space-y-2">
             <div className="flex items-center gap-2">
               <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Account Overview</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div
                onClick={() => { clearAll(); setPage(1); }}
                 className={`group flex flex-col items-center gap-0.5 rounded-xl border px-3 py-1.5 cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${
                   !hasActiveFilters ? "ring-2 ring-primary/30 border-primary/30 bg-primary/5 shadow-md" : "border-border/40 bg-card hover:bg-muted/30"
                 }`}
               >
                 <div className="h-6 w-6 rounded-md bg-muted/60 flex items-center justify-center shrink-0 group-hover:bg-muted transition-colors">
                   <Users className="h-3 w-3 text-muted-foreground" />
                 </div>
                 <p className="text-lg font-extrabold text-foreground leading-tight tracking-tight">{csmScopedAccounts.length}</p>
                <p className="text-[10px] font-medium text-muted-foreground whitespace-nowrap">Total Accounts</p>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    onClick={() => { setAccountStatusFilter(accountStatusFilter === "Enabled" ? "all" : "Enabled"); setPage(1); }}
                    className={`group flex flex-col items-center gap-0.5 rounded-xl border px-3 py-1.5 cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${
                      accountStatusFilter === "Enabled" ? "ring-2 ring-primary/30 border-primary/30 bg-primary/5 shadow-md" : "border-border/40 bg-card hover:bg-muted/30"
                    }`}
                  >
                    <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
                      <Users className="h-3 w-3 text-primary" />
                    </div>
                    <p className="text-lg font-extrabold text-foreground leading-tight tracking-tight">{csmScopedAccounts.filter(a => a.status === "Enabled").length}</p>
                    <p className="text-[10px] font-medium text-muted-foreground whitespace-nowrap">Tracked Accounts</p>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="text-xs max-w-[200px]">Accounts with health tracking enabled. Their health scores, trends, and insights are actively monitored.</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Card 2: Lifecycle Stages */}
           <div className="rounded-2xl bg-gradient-to-br from-emerald-500/8 via-card to-teal-500/8 border border-emerald-200/30 shadow-sm p-3 space-y-2">
             <div className="flex items-center gap-2">
               <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Lifecycle Stages</p>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {(() => {
                const active = csmScopedAccounts.filter(a => a.status === "Enabled");
                return [
                  { label: "Onboarding", filterKey: "Onboarding", icon: <Rocket className="h-3 w-3 text-blue-500" />, bg: "bg-blue-500/10", hoverBg: "hover:bg-blue-500/15", count: active.filter(a => a.lifecycleStage === "Onboarding").length, tooltip: STAGE_DEFINITIONS.Onboarding },
                  { label: "Growth", filterKey: "Growth", icon: <TrendingUp className="h-3 w-3 text-emerald-500" />, bg: "bg-emerald-500/10", hoverBg: "hover:bg-emerald-500/15", count: active.filter(a => a.lifecycleStage === "Growth").length, tooltip: STAGE_DEFINITIONS.Growth },
                  { label: "Mature", filterKey: "Mature", icon: <Crown className="h-3 w-3 text-violet-500" />, bg: "bg-violet-500/10", hoverBg: "hover:bg-violet-500/15", count: active.filter(a => a.lifecycleStage === "Mature").length, tooltip: STAGE_DEFINITIONS.Mature },
                ];
              })().map((s) => (
                <Tooltip key={s.label}>
                  <TooltipTrigger asChild>
                    <div
                      onClick={() => { setStageFilter(stageFilter === s.filterKey ? "all" : s.filterKey); setPage(1); }}
                       className={`group flex flex-col items-center gap-0.5 rounded-xl border px-2 py-1.5 cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 text-center ${
                         stageFilter === s.filterKey ? "ring-2 ring-primary/30 border-primary/30 bg-muted/30 shadow-md" : `border-border/40 bg-card ${s.hoverBg}`
                       }`}
                     >
                       <div className={`h-6 w-6 rounded-md ${s.bg} flex items-center justify-center shrink-0 transition-colors`}>
                         {s.icon}
                       </div>
                       <p className="text-base font-extrabold text-foreground leading-tight tracking-tight">{s.count}</p>
                      <p className="text-[10px] font-medium text-muted-foreground whitespace-nowrap">{s.label}</p>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom"><p className="text-xs">{s.tooltip}</p></TooltipContent>
                </Tooltip>
              ))}
            </div>
          </div>

          {/* Card 3: Health Distribution */}
           <div className="rounded-2xl bg-gradient-to-br from-violet-500/8 via-card to-rose-500/8 border border-violet-200/30 shadow-sm p-3 space-y-2">
             <div className="flex items-center gap-2">
               <div className="h-1.5 w-1.5 rounded-full bg-health-green" />
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Health Distribution</p>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {(() => {
                const enabled = csmScopedAccounts.filter(a => a.status === "Enabled");
                const thriving = enabled.filter(a => a.healthScore >= 80).length;
                const healthy = enabled.filter(a => a.healthScore >= 60 && a.healthScore < 80).length;
                const steady = enabled.filter(a => a.healthScore >= 40 && a.healthScore < 60).length;
                const atRisk = enabled.filter(a => a.healthScore < 40).length;
                const total = enabled.length;
                return [
                  { label: "Thriving", filterKey: "thriving", count: thriving, pct: total ? Math.round((thriving / total) * 100) : 0, color: "text-health-green", bg: "bg-health-green-bg", border: "border-health-green" },
                  { label: "Healthy", filterKey: "healthy", count: healthy, pct: total ? Math.round((healthy / total) * 100) : 0, color: "text-health-blue", bg: "bg-health-blue-bg", border: "border-health-blue" },
                  { label: "Steady", filterKey: "steady", count: steady, pct: total ? Math.round((steady / total) * 100) : 0, color: "text-health-yellow", bg: "bg-health-yellow-bg", border: "border-health-yellow" },
                  { label: "At Risk", filterKey: "at-risk", count: atRisk, pct: total ? Math.round((atRisk / total) * 100) : 0, color: "text-health-red", bg: "bg-health-red-bg", border: "border-health-red" },
                ];
              })().map((b) => (
                <div
                  key={b.label}
                  onClick={() => { setStatusFilter(statusFilter === b.filterKey ? "all" : b.filterKey); setPage(1); }}
                   className={`group flex flex-col items-center gap-0.5 rounded-xl ${b.bg} border-b-[3px] ${b.border} px-1.5 py-1.5 cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${
                     statusFilter === b.filterKey ? "ring-2 ring-primary/30 shadow-md scale-[1.02]" : "opacity-90 hover:opacity-100"
                   }`}
                 >
                   <p className={`text-base font-extrabold ${b.color} leading-tight tracking-tight`}>{b.count}</p>
                  <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">{b.label}</p>
                  <p className="text-[9px] text-muted-foreground/70">{b.pct}%</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Table Tabs */}
        <div className="flex items-center gap-1 mb-4">
          {([
            { key: "all" as const, label: "All Accounts", count: csmScopedAccounts.length },
            { key: "tracked" as const, label: "Tracked Accounts", count: csmScopedAccounts.filter(a => a.status === "Enabled").length },
            { key: "disabled" as const, label: "Disabled Accounts", count: csmScopedAccounts.filter(a => a.status === "Disabled").length },
          ]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setTableTab(tab.key); setPage(1); }}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                tableTab === tab.key
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              {tab.label}
              <span className={`ml-1.5 text-xs ${tableTab === tab.key ? "text-primary-foreground/70" : "text-muted-foreground/60"}`}>
                ({tab.count})
              </span>
            </button>
          ))}
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search accounts by name or owner..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 h-10 text-sm bg-card border-border/60 rounded-lg w-full"
          />
        </div>


            {/* Filters */}

            {/* Table */}
            <div className="bg-card rounded-xl border border-border/50 shadow-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border/40">
                    <TableHead className="w-10">
                      <Checkbox
                        checked={paginated.length > 0 && selectedIds.size === paginated.length}
                        onCheckedChange={toggleSelectAll}
                        className="border-border/60"
                      />
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Account</TableHead>
                    <SortableHead label="Signed Up" sortKey="signedUp" currentKey={sortKey} dir={sortDir} onSort={handleSort} />
                    <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="flex items-center gap-1 hover:text-foreground transition-colors">
                            Plan
                            <Filter className={`h-3 w-3 ${planFilter !== "all" ? "text-primary" : "opacity-40"}`} />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-36 p-1" align="start">
                          {["all", "Starter", "Plus", "Pro", "Premium", "Manual"].map((v) => (
                            <button
                              key={v}
                              onClick={() => { setPlanFilter(v); setPage(1); }}
                              className={`w-full text-left px-3 py-1.5 text-xs rounded-md transition-colors ${planFilter === v ? "bg-primary/10 text-primary font-medium" : "hover:bg-secondary text-foreground"}`}
                            >
                              {v === "all" ? "All Plans" : v}
                            </button>
                          ))}
                        </PopoverContent>
                      </Popover>
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="flex items-center gap-1 hover:text-foreground transition-colors">
                            Stage
                            <Filter className={`h-3 w-3 ${stageFilter !== "all" ? "text-primary" : "opacity-40"}`} />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-36 p-1" align="start">
                          {["all", "Onboarding", "Growth", "Mature"].map((v) => (
                            <button
                              key={v}
                              onClick={() => { setStageFilter(v); setPage(1); }}
                              className={`w-full text-left px-3 py-1.5 text-xs rounded-md transition-colors ${stageFilter === v ? "bg-primary/10 text-primary font-medium" : "hover:bg-secondary text-foreground"}`}
                            >
                              {v === "all" ? "All Stages" : v}
                            </button>
                          ))}
                        </PopoverContent>
                      </Popover>
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      <div className="flex items-center gap-1">
                        <Popover>
                          <PopoverTrigger asChild>
                            <button className="flex items-center gap-1 hover:text-foreground transition-colors">
                              Health
                              <Filter className={`h-3 w-3 ${statusFilter !== "all" ? "text-primary" : "opacity-40"}`} />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-36 p-1" align="start">
                            {["all", "thriving", "healthy", "steady", "at-risk"].map((v) => (
                              <button
                                key={v}
                                onClick={() => { setStatusFilter(v); setPage(1); }}
                                className={`w-full text-left px-3 py-1.5 text-xs rounded-md transition-colors ${statusFilter === v ? "bg-primary/10 text-primary font-medium" : "hover:bg-secondary text-foreground"}`}
                              >
                                {v === "all" ? "All Statuses" : v.charAt(0).toUpperCase() + v.slice(1).replace("-", " ")}
                              </button>
                            ))}
                          </PopoverContent>
                        </Popover>
                        <button
                          className="hover:text-foreground transition-colors"
                          onClick={() => handleSort("health")}
                        >
                          {sortKey === "health" ? (
                            sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                          ) : (
                            <ArrowUpDown className="h-3 w-3 opacity-40" />
                          )}
                        </button>
                      </div>
                    </TableHead>
                    <SortableHead label="Trend" sortKey="trend" currentKey={sortKey} dir={sortDir} onSort={handleSort} />
                    <SortableHead label="MRR" sortKey="revenue" currentKey={sortKey} dir={sortDir} onSort={handleSort} />
                    <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="flex items-center gap-1 hover:text-foreground transition-colors">
                            Assigned CSM
                            <Filter className={`h-3 w-3 ${csmFilter !== "all" ? "text-primary" : "opacity-40"}`} />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-44 p-1 max-h-72 overflow-y-auto" align="start">
                          {[
                            { v: "all", label: "All CSMs" },
                            { v: "unassigned", label: "Unassigned" },
                            ...CSM_OPTIONS.map((n) => ({ v: n, label: n })),
                          ].map((opt) => (
                            <button
                              key={opt.v}
                              onClick={() => { setCsmFilter(opt.v); setPage(1); }}
                              className={`w-full text-left px-3 py-1.5 text-xs rounded-md transition-colors ${csmFilter === opt.v ? "bg-primary/10 text-primary font-medium" : "hover:bg-secondary text-foreground"}`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </PopoverContent>
                      </Popover>
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      <ActionsFilterPopover
                        actionFilter={actionFilter}
                        onFilterChange={(v) => { setActionFilter(v); setPage(1); }}
                      />
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((account) => (
                    <AccountRow
                      key={account.id}
                      account={account}
                      onUpdate={handleUpdate}
                      onSetPriority={handleSetPriority}
                      isSelected={selectedIds.has(account.id)}
                      onToggleSelect={toggleSelect}
                    />
                  ))}
                  {paginated.length === 0 && (
                    <TableRow>
                      <td colSpan={10} className="text-center py-12 text-muted-foreground text-sm">
                        No accounts match your filters.
                      </td>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-border/40">
                <span className="text-xs text-muted-foreground">
                  {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}
                </span>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {Array.from({ length: Math.min(totalPages, 3) }, (_, i) => i + 1).map((p) => (
                    <Button
                      key={p}
                      variant={page === p ? "default" : "ghost"}
                      size="icon"
                      className="h-8 w-8 text-xs"
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </Button>
                  ))}
                  <Button variant="ghost" size="icon" className="h-8 w-8" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
                    <SelectTrigger className="w-[100px] h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAGE_SIZES.map((s) => (
                        <SelectItem key={s} value={String(s)}>{s} / page</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

        <BulkActionBar
          selectedCount={selectedIds.size}
          onClear={() => setSelectedIds(new Set())}
          onTriggerWorkflow={bulkTriggerWorkflow}
          onSetPriority={bulkSetPriority}
          onRequestFeedback={bulkRequestFeedback}
          onAssignCsm={bulkAssignCsm}
        />
      </main>
    </div>
  );
};

export default Analytics;
