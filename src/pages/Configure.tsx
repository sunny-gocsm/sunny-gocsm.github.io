import { useState, useCallback, useMemo } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { useTheme } from "next-themes";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Settings2,
  TrendingUp,
  MessageSquare,
  Activity,
  Sparkles,
  Clock,
  ChevronRight,
  GripVertical,
  Ban,
  RotateCcw,
  Save,
  CheckCircle2,
  Sun,
  Moon,
  Monitor } from
"lucide-react";

interface Pillar {
  id: string;
  label: string;
  description: string;
  weight: number;
  icon: React.ReactNode;
  color: string;
  borderColor: string;
}

interface Feature {
  id: string;
  name: string;
  tier: "high" | "medium" | "low" | "excluded";
  color: string;
}

interface LifecycleStage {
  id: string;
  label: string;
  icon: React.ReactNode;
  range: string;
  endDay: number | null;
  color: string;
  bgColor: string;
  borderColor: string;
}

const defaultPillars: Pillar[] = [
{
  id: "product_adoption",
  label: "Product Adoption",
  description: "Feature usage & stickiness metrics",
  weight: 40,
  icon: <Settings2 className="h-4 w-4" />,
  color: "text-amber-500",
  borderColor: "border-amber-400"
},
{
  id: "revenue_intelligence",
  label: "Revenue Intelligence",
  description: "MRR growth & expansion revenue",
  weight: 30,
  icon: <TrendingUp className="h-4 w-4" />,
  color: "text-primary",
  borderColor: "border-primary"
},
{
  id: "feedback_nps",
  label: "Feedback / NPS",
  description: "Customer sentiment & survey scores",
  weight: 20,
  icon: <MessageSquare className="h-4 w-4" />,
  color: "text-purple-500",
  borderColor: "border-purple-400"
},
{
  id: "login_activity",
  label: "Login Activity",
  description: "Session frequency & recency signals",
  weight: 10,
  icon: <Activity className="h-4 w-4" />,
  color: "text-emerald-500",
  borderColor: "border-emerald-400"
}];


const tierDotColor: Record<string, string> = {
  high: "bg-red-500",
  medium: "bg-amber-500",
  low: "bg-blue-400",
  excluded: "bg-muted-foreground/40",
};

const defaultFeatures: Feature[] = [
{ id: "contacts", name: "Contacts - Contacts Created", tier: "high", color: "" },
{ id: "workflows", name: "Workflows - Executions", tier: "high", color: "" },
{ id: "custom_menu_links", name: "Custom Menu Links - Menu Links Visited", tier: "high", color: "" },
{ id: "conversations", name: "Conversations - Messages Sent", tier: "high", color: "" },
{ id: "sms", name: "SMS - SMS Sent", tier: "high", color: "" },
{ id: "email", name: "Email - Email Sent", tier: "high", color: "" },
{ id: "phone", name: "Phone - Calls Made", tier: "high", color: "" },
{ id: "calendars", name: "Calendars - Appointment Bookings", tier: "medium", color: "" },
{ id: "payment", name: "Payments Products - Orders", tier: "medium", color: "" }];
const featureTooltips: Record<string, string> = {
  conversations: "Conversations include messages from these channels: website chat, live chat, Facebook, Instagram, WhatsApp, Google Business, campaign messages, and social media comments.",
};


const Configure = () => {
  const { theme, setTheme } = useTheme();
  const [pillars, setPillars] = useState<Pillar[]>(defaultPillars);
  const [autoBalance, setAutoBalance] = useState(true);
  const [features, setFeatures] = useState<Feature[]>(defaultFeatures);
  const [expandedPillar, setExpandedPillar] = useState<string | null>("product_adoption");

  const [stages, setStages] = useState<LifecycleStage[]>([
  {
    id: "onboarding",
    label: "Onboarding",
    icon: <Sparkles className="h-4 w-4" />,
    range: "Day 0 – 90",
    endDay: 90,
    color: "from-emerald-400 to-emerald-500",
    bgColor: "bg-emerald-50 dark:bg-emerald-500/10",
    borderColor: "border-emerald-300 dark:border-emerald-500/30"
  },
  {
    id: "growth",
    label: "Growth",
    icon: <TrendingUp className="h-4 w-4" />,
    range: "Day 90 – 180",
    endDay: 180,
    color: "from-blue-400 to-blue-500",
    bgColor: "bg-blue-50 dark:bg-blue-500/10",
    borderColor: "border-blue-300 dark:border-blue-500/30"
  },
  {
    id: "mature",
    label: "Mature",
    icon: <CheckCircle2 className="h-4 w-4" />,
    range: "Day 180+",
    endDay: null,
    color: "from-purple-400 to-purple-500",
    bgColor: "bg-purple-50 dark:bg-purple-500/10",
    borderColor: "border-purple-300 dark:border-purple-500/30"
  }]
  );

  const totalWeight = useMemo(() => pillars.reduce((s, p) => s + p.weight, 0), [pillars]);
  const isBalanced = totalWeight === 100;

  const handleWeightChange = useCallback(
    (id: string, newWeight: number) => {
      setPillars((prev) => {
        const idx = prev.findIndex((p) => p.id === id);
        if (idx === -1) return prev;
        const updated = [...prev];
        const oldWeight = updated[idx].weight;
        updated[idx] = { ...updated[idx], weight: newWeight };

        if (autoBalance) {
          const diff = newWeight - oldWeight;
          const others = updated.filter((_, i) => i !== idx);
          const othersTotal = others.reduce((s, p) => s + p.weight, 0);
          if (othersTotal > 0) {
            let remaining = -diff;
            others.forEach((p) => {
              const oi = updated.findIndex((u) => u.id === p.id);
              const share = Math.round(p.weight / othersTotal * remaining);
              const clamped = Math.max(0, Math.min(100, updated[oi].weight + share));
              updated[oi] = { ...updated[oi], weight: clamped };
            });
            // Fix rounding
            const newTotal = updated.reduce((s, p) => s + p.weight, 0);
            if (newTotal !== 100) {
              const lastOther = updated.findIndex((p) => p.id !== id && p.weight > 0);
              if (lastOther !== -1) {
                updated[lastOther] = {
                  ...updated[lastOther],
                  weight: updated[lastOther].weight + (100 - newTotal)
                };
              }
            }
          }
        }
        return updated;
      });
    },
    [autoBalance]
  );

  const handleStageEndChange = (id: string, value: string) => {
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 1) return;
    setStages((prev) => {
      const updated = [...prev];
      const idx = updated.findIndex((s) => s.id === id);
      if (idx === -1) return prev;
      updated[idx] = { ...updated[idx], endDay: num, range: `Day ${idx === 0 ? 0 : updated[idx - 1]?.endDay ?? 0} – ${num}` };
      // Update next stage range
      if (idx + 1 < updated.length) {
        const nextEnd = updated[idx + 1].endDay;
        updated[idx + 1] = {
          ...updated[idx + 1],
          range: nextEnd ? `Day ${num} – ${nextEnd}` : `Day ${num}+`
        };
      }
      return updated;
    });
  };

  const highFeatures = features.filter((f) => f.tier === "high");
  const mediumFeatures = features.filter((f) => f.tier === "medium");
  const lowFeatures = features.filter((f) => f.tier === "low");
  const excludedFeatures = features.filter((f) => f.tier === "excluded");

  const handleDragEnd = (result: DropResult) => {
    const { draggableId, destination } = result;
    if (!destination) return;
    const newTier = destination.droppableId as Feature["tier"];
    setFeatures((prev) =>
    prev.map((f) => f.id === draggableId ? { ...f, tier: newTier } : f)
    );
  };

  const onboardingEnd = stages[0]?.endDay ?? 90;
  const growthEnd = stages[1]?.endDay ?? 180;
  const maxDays = 365;
  const onboardingPct = onboardingEnd / maxDays * 100;
  const growthPct = (growthEnd - onboardingEnd) / maxDays * 100;
  const maturePct = 100 - onboardingPct - growthPct;

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader activeTab="configure" />
      <main className="max-w-[1400px] mx-auto px-6 py-8 pb-24 space-y-8">
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Health Score Configuration
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Define how client health scores are calculated across your portfolio.
          </p>
        </div>

        {/* Main grid: Pillars + Feature tiers */}
        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6 animate-fade-in-up" style={{ animationDelay: "0.05s", animationFillMode: "both" }}>
          {/* Left: Pillars */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Health Pillars
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Auto-balance</span>
                <Switch checked={autoBalance} onCheckedChange={setAutoBalance} />
              </div>
            </div>

            <div className="space-y-3">
              {pillars.map((pillar) =>
              <Card
                key={pillar.id}
                className={`p-4 border-l-4 cursor-pointer transition-all duration-200 ${pillar.borderColor} ${
                expandedPillar === pillar.id ? "shadow-md ring-1 ring-border" : ""}`
                }
                onClick={() =>
                setExpandedPillar(expandedPillar === pillar.id ? null : pillar.id)
                }>
                
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 ${pillar.color}`}>{pillar.icon}</div>
                      <div>
                        <div className="text-sm font-semibold text-foreground">
                          {pillar.label}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {pillar.description}
                        </div>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-foreground whitespace-nowrap">
                      {pillar.weight} %
                    </span>
                  </div>

                  <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                    <Slider
                    value={[pillar.weight]}
                    onValueChange={([v]) => handleWeightChange(pillar.id, v)}
                    max={100}
                    min={0}
                    step={5}
                    className="w-full" />
                  
                  </div>


                  {["login_activity", "feedback_nps", "product_adoption"].includes(pillar.id) && (() => {
                    const trackingSince = new Date("2026-03-07");
                    const now = new Date();
                    const daysPassed = Math.floor((now.getTime() - trackingSince.getTime()) / (1000 * 60 * 60 * 24));
                    if (daysPassed >= 14) return null;
                    const clampedDays = Math.max(0, daysPassed);
                    const progress = Math.round((clampedDays / 14) * 100);
                    const includedFrom = new Date(trackingSince);
                    includedFrom.setDate(includedFrom.getDate() + 14);

                    const colorMap: Record<string, { border: string; bg: string; text: string; darkText: string; darkBorder: string; darkBg: string; barFrom: string; barTo: string; darkBarFrom: string; darkBarTo: string; pillBg: string; pillText: string }> = {
                      login_activity: {
                        border: "border-emerald-200", bg: "bg-emerald-50/40", text: "text-emerald-700", darkText: "dark:text-emerald-400",
                        darkBorder: "dark:border-emerald-500/20", darkBg: "dark:bg-emerald-500/5",
                        barFrom: "from-emerald-400", barTo: "to-emerald-500", darkBarFrom: "dark:from-emerald-500", darkBarTo: "dark:to-emerald-400",
                        pillBg: "bg-emerald-100 dark:bg-emerald-900/30", pillText: "text-emerald-600 dark:text-emerald-400"
                      },
                      feedback_nps: {
                        border: "border-purple-200", bg: "bg-purple-50/40", text: "text-purple-700", darkText: "dark:text-purple-400",
                        darkBorder: "dark:border-purple-500/20", darkBg: "dark:bg-purple-500/5",
                        barFrom: "from-purple-400", barTo: "to-purple-500", darkBarFrom: "dark:from-purple-500", darkBarTo: "dark:to-purple-400",
                        pillBg: "bg-purple-100 dark:bg-purple-900/30", pillText: "text-purple-600 dark:text-purple-400"
                      },
                      product_adoption: {
                        border: "border-amber-200", bg: "bg-amber-50/40", text: "text-amber-700", darkText: "dark:text-amber-400",
                        darkBorder: "dark:border-amber-500/20", darkBg: "dark:bg-amber-500/5",
                        barFrom: "from-amber-400", barTo: "to-amber-500", darkBarFrom: "dark:from-amber-500", darkBarTo: "dark:to-amber-400",
                        pillBg: "bg-amber-100 dark:bg-amber-900/30", pillText: "text-amber-600 dark:text-amber-400"
                      }
                    };

                    const c = colorMap[pillar.id];

                    return (
                      <div className="mt-3 group relative" onClick={(e) => e.stopPropagation()}>
                        <div className={`rounded-full border ${c.border} ${c.darkBorder} ${c.bg} ${c.darkBg} px-3 py-1.5 cursor-default flex items-center gap-2.5`}>
                          <Clock className={`h-3.5 w-3.5 ${c.text} ${c.darkText} animate-pulse flex-shrink-0`} />
                          <span className={`text-[11px] font-semibold ${c.text} ${c.darkText} whitespace-nowrap`}>
                            {pillar.id === "product_adoption" ? "Learning Adoption Trends" : pillar.id === "login_activity" ? "Learning Login Trends" : pillar.id === "feedback_nps" ? "Collecting NPS Data" : "Learning your trends"}
                          </span>
                          <div className={`relative h-2 w-16 rounded-full ${c.pillBg} overflow-hidden flex-shrink-0`}>
                            <div
                              className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${c.barFrom} ${c.barTo} ${c.darkBarFrom} ${c.darkBarTo} transition-all duration-1000 ease-out`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className={`text-[10px] font-semibold ${c.pillText} whitespace-nowrap ml-auto`}>
                            {clampedDays}/14 days
                          </span>
                        </div>
                        <div className="absolute left-0 bottom-full mb-2 z-50 hidden group-hover:block w-72 rounded-xl border border-border/60 bg-popover p-4 shadow-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className={`h-3.5 w-3.5 ${c.text} ${c.darkText}`} />
                            <span className="text-xs font-semibold text-popover-foreground">Collecting Data</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">
                            {pillar.id === "product_adoption"
                              ? "Tracking workflow adoption, data will be included in the overall score once enough activity is recorded."
                              : pillar.id === "feedback_nps"
                              ? "We need a little more history to show accurate results."
                              : "We need a little more history to show accurate comparisons."}
                          </p>
                          <div className="mt-3 flex items-center gap-3 rounded-lg bg-muted/50 px-3 py-2">
                            <div className="flex flex-col">
                              <span className="text-[10px] text-muted-foreground">Tracking since</span>
                              <span className="text-[11px] font-semibold text-popover-foreground">{trackingSince.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                            </div>
                            <div className="h-6 w-px bg-border" />
                            <div className="flex flex-col">
                              <span className="text-[10px] text-muted-foreground">Included from</span>
                              <span className="text-[11px] font-semibold text-popover-foreground">{includedFrom.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </Card>
              )}
            </div>
          </div>

          <DragDropContext onDragEnd={handleDragEnd}>
            <Card className="p-6 border-2 border-dashed border-primary/30 bg-primary/[0.02]">
              <h3 className="text-lg font-semibold text-foreground">
                Product Adoption Features
              </h3>
              <p className="text-xs text-muted-foreground mt-1 mb-5">
                Drag features between tiers to adjust their scoring weight.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* High Priority */}
                <Droppable droppableId="high">
                  {(provided, snapshot) =>
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`rounded-xl border-2 border-red-300 dark:border-red-500/30 p-4 min-h-[120px] transition-colors ${
                    snapshot.isDraggingOver ? "bg-red-100/70 dark:bg-red-500/15" : "bg-red-50/50 dark:bg-red-500/5"}`
                    }>
                    
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-500/15 px-2 py-0.5 rounded-full">
                          High Priority
                        </span>
                      </div>
                      <div className="space-y-2">
                        {highFeatures.map((f, index) =>
                      <Draggable key={f.id} draggableId={f.id} index={index}>
                            {(provided, snapshot) =>
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`flex items-center gap-2 bg-card rounded-lg px-3 py-2 border border-border/60 transition-shadow ${
                          snapshot.isDragging ? "shadow-lg ring-2 ring-primary/30" : ""}`
                          }>
                          
                                <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 cursor-grab" />
                                <span className={`h-2 w-2 rounded-full ${tierDotColor[f.tier]}`} />
                                <span className="text-sm font-medium text-foreground">{f.name}</span>
                                {featureTooltips[f.id] && (
                                  <TooltipProvider delayDuration={200}>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Info className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help flex-shrink-0" />
                                      </TooltipTrigger>
                                      <TooltipContent side="top" className="max-w-[280px] p-3">
                                        <p className="text-xs">{featureTooltips[f.id]}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                              </div>
                        }
                          </Draggable>
                      )}
                        {provided.placeholder}
                      </div>
                    </div>
                  }
                </Droppable>

                {/* Medium Priority */}
                <Droppable droppableId="medium">
                  {(provided, snapshot) =>
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`rounded-xl border-2 border-amber-300 dark:border-amber-500/30 p-4 min-h-[120px] transition-colors ${
                    snapshot.isDraggingOver ? "bg-amber-100/70 dark:bg-amber-500/15" : "bg-amber-50/50 dark:bg-amber-500/5"}`
                    }>
                    
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/15 px-2 py-0.5 rounded-full">
                          Medium Priority
                        </span>
                        

                      
                      </div>
                      <div className="space-y-2">
                        {mediumFeatures.map((f, index) =>
                      <Draggable key={f.id} draggableId={f.id} index={index}>
                            {(provided, snapshot) =>
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`flex items-center gap-2 bg-card rounded-lg px-3 py-2 border border-border/60 transition-shadow ${
                          snapshot.isDragging ? "shadow-lg ring-2 ring-primary/30" : ""}`
                          }>
                          
                                <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 cursor-grab" />
                                <span className={`h-2 w-2 rounded-full ${tierDotColor[f.tier]}`} />
                                <span className="text-sm font-medium text-foreground">{f.name}</span>
                                {featureTooltips[f.id] && (
                                  <TooltipProvider delayDuration={200}>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Info className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help flex-shrink-0" />
                                      </TooltipTrigger>
                                      <TooltipContent side="top" className="max-w-[280px] p-3">
                                        <p className="text-xs">{featureTooltips[f.id]}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                              </div>
                        }
                          </Draggable>
                      )}
                        {provided.placeholder}
                      </div>
                    </div>
                  }
                </Droppable>

                {/* Low Priority */}
                <Droppable droppableId="low">
                  {(provided, snapshot) =>
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`rounded-xl border-2 border-blue-300 dark:border-blue-500/30 p-4 min-h-[120px] transition-colors ${
                    snapshot.isDraggingOver ? "bg-blue-100/70 dark:bg-blue-500/15" : "bg-blue-50/50 dark:bg-blue-500/5"}`
                    }>
                    
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-500/15 px-2 py-0.5 rounded-full">
                          Low Priority
                        </span>
                      </div>
                      <div className="space-y-2">
                        {lowFeatures.map((f, index) =>
                      <Draggable key={f.id} draggableId={f.id} index={index}>
                            {(provided, snapshot) =>
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`flex items-center gap-2 bg-card rounded-lg px-3 py-2 border border-border/60 transition-shadow ${
                          snapshot.isDragging ? "shadow-lg ring-2 ring-primary/30" : ""}`
                          }>
                          
                                <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 cursor-grab" />
                                <span className={`h-2 w-2 rounded-full ${tierDotColor[f.tier]}`} />
                                <span className="text-sm font-medium text-foreground">{f.name}</span>
                                {featureTooltips[f.id] && (
                                  <TooltipProvider delayDuration={200}>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Info className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help flex-shrink-0" />
                                      </TooltipTrigger>
                                      <TooltipContent side="top" className="max-w-[280px] p-3">
                                        <p className="text-xs">{featureTooltips[f.id]}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                              </div>
                        }
                          </Draggable>
                      )}
                        {provided.placeholder}
                      </div>
                    </div>
                  }
                </Droppable>
              </div>

              {/* Excluded */}
              <Droppable droppableId="excluded">
                {(provided, snapshot) =>
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`mt-5 rounded-xl border border-dashed border-border p-4 min-h-[60px] transition-colors ${
                  snapshot.isDraggingOver ? "bg-muted/60" : ""}`
                  }>
                  
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Ban className="h-4 w-4" />
                        <span className="text-xs font-medium">Excluded from scoring</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {excludedFeatures.length} features
                      </span>
                    </div>
                    {excludedFeatures.length === 0 && !snapshot.isDraggingOver &&
                  <p className="text-xs text-muted-foreground/60 italic mt-2">
                        Drop features here to exclude them
                      </p>
                  }
                    <div className="space-y-2 mt-2">
                      {excludedFeatures.map((f, index) =>
                    <Draggable key={f.id} draggableId={f.id} index={index}>
                          {(provided, snapshot) =>
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`flex items-center gap-2 bg-card rounded-lg px-3 py-2 border border-border/60 transition-shadow ${
                        snapshot.isDragging ? "shadow-lg ring-2 ring-primary/30" : ""}`
                        }>
                        
                              <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 cursor-grab" />
                              <span className={`h-2 w-2 rounded-full ${tierDotColor[f.tier]}`} />
                              <span className="text-sm font-medium text-foreground">{f.name}</span>
                              {featureTooltips[f.id] && (
                                <TooltipProvider delayDuration={200}>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Info className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help flex-shrink-0" />
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="max-w-[280px] p-3">
                                      <p className="text-xs">{featureTooltips[f.id]}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                      }
                        </Draggable>
                    )}
                      {provided.placeholder}
                    </div>
                  </div>
                }
              </Droppable>
            </Card>
          </DragDropContext>
        </div>

        {/* Lifecycle Stages */}
        <Card className="p-6 animate-fade-in-up" style={{ animationDelay: "0.15s", animationFillMode: "both" }}>
          <h3 className="text-lg font-semibold text-foreground">
            Account Lifecycle Stages
          </h3>
          <p className="text-xs text-muted-foreground mt-1 mb-5">
            Configure when accounts transition between lifecycle stages.
          </p>

          {/* Timeline slider bar */}
          <div className="relative mb-2 select-none">
            <div className="flex h-3 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all"
                style={{ width: `${onboardingPct}%` }} />
              
              <div
                className="bg-gradient-to-r from-blue-400 to-blue-500 transition-all"
                style={{ width: `${growthPct}%` }} />
              
              <div
                className="bg-gradient-to-r from-purple-400 to-purple-500 transition-all"
                style={{ width: `${maturePct}%` }} />
              
            </div>
            {/* Draggable thumb 1: onboarding → growth boundary */}
            <div
              className="absolute top-1/2 h-5 w-5 rounded-full bg-card border-2 border-emerald-500 shadow-md cursor-ew-resize hover:scale-110 active:scale-125 transition-transform z-10"
              style={{ left: `${onboardingPct}%`, transform: "translate(-50%, -50%)" }}
              onMouseDown={(e) => {
                e.preventDefault();
                const bar = e.currentTarget.parentElement!;
                const onMove = (ev: MouseEvent) => {
                  const rect = bar.getBoundingClientRect();
                  const pct = Math.max(5, Math.min((ev.clientX - rect.left) / rect.width * 100, growthEnd / maxDays * 100 - 5));
                  const newDay = Math.round(pct / 100 * maxDays);
                  if (newDay > 0 && newDay < growthEnd) {
                    handleStageEndChange("onboarding", String(newDay));
                  }
                };
                const onUp = () => {
                  window.removeEventListener("mousemove", onMove);
                  window.removeEventListener("mouseup", onUp);
                };
                window.addEventListener("mousemove", onMove);
                window.addEventListener("mouseup", onUp);
              }} />
            
            {/* Draggable thumb 2: growth → mature boundary */}
            <div
              className="absolute top-1/2 h-5 w-5 rounded-full bg-card border-2 border-blue-500 shadow-md cursor-ew-resize hover:scale-110 active:scale-125 transition-transform z-10"
              style={{ left: `${onboardingPct + growthPct}%`, transform: "translate(-50%, -50%)" }}
              onMouseDown={(e) => {
                e.preventDefault();
                const bar = e.currentTarget.parentElement!;
                const onMove = (ev: MouseEvent) => {
                  const rect = bar.getBoundingClientRect();
                  const pct = Math.max(onboardingEnd / maxDays * 100 + 5, Math.min((ev.clientX - rect.left) / rect.width * 100, 95));
                  const newDay = Math.round(pct / 100 * maxDays);
                  if (newDay > onboardingEnd && newDay < maxDays) {
                    handleStageEndChange("growth", String(newDay));
                  }
                };
                const onUp = () => {
                  window.removeEventListener("mousemove", onMove);
                  window.removeEventListener("mouseup", onUp);
                };
                window.addEventListener("mousemove", onMove);
                window.addEventListener("mouseup", onUp);
              }} />
            
          </div>
          <div className="flex justify-between text-[11px] text-muted-foreground mb-6">
            <span>0 days</span>
            <span>{onboardingEnd}d</span>
            <span>{growthEnd}d</span>
            <span>365+ days</span>
          </div>

          {/* Stage cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stages.map((stage) =>
            <Card
              key={stage.id}
              className={`p-4 border-2 ${stage.borderColor} ${stage.bgColor}`}>
              
                <div className="flex items-center gap-2 mb-2">
                  <span className={stage.id === "onboarding" ? "text-emerald-500" : stage.id === "growth" ? "text-blue-500" : "text-purple-500"}>
                    {stage.icon}
                  </span>
                  <span className="text-sm font-semibold text-foreground">{stage.label}</span>
                </div>
                <p className="text-xs text-muted-foreground mb-2">{stage.range}</p>
                {stage.endDay !== null ?
              <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Ends at day</span>
                    <Input
                  type="number"
                  value={stage.endDay}
                  onChange={(e) => handleStageEndChange(stage.id, e.target.value)}
                  className="h-8 w-16 text-sm text-center" />
                
                  </div> :

              <p className="text-xs text-muted-foreground italic">No upper limit</p>
              }
              </Card>
            )}
          </div>
        </Card>

        {/* Theme Settings */}
        <Card className="p-4 animate-fade-in-up" style={{ animationDelay: "0.2s", animationFillMode: "both" }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Appearance</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Choose a theme for the dashboard.</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {([
              { key: "light", label: "Light", icon: <Sun className="h-4 w-4" />, borderColor: "border-amber-300 dark:border-amber-500/50", bgColor: "bg-amber-50 dark:bg-amber-500/10", iconColor: "text-amber-500" },
              { key: "dark", label: "Dark", icon: <Moon className="h-4 w-4" />, borderColor: "border-indigo-400 dark:border-indigo-400/50", bgColor: "bg-indigo-50 dark:bg-indigo-500/10", iconColor: "text-indigo-500 dark:text-indigo-400" },
              { key: "system", label: "System", icon: <Monitor className="h-4 w-4" />, borderColor: "border-border", bgColor: "bg-muted/30", iconColor: "text-muted-foreground" },
            ] as const).map((opt) => (
              <button
                key={opt.key}
                onClick={() => setTheme(opt.key)}
                className={`relative flex items-center gap-2.5 rounded-lg border-2 px-3 py-2.5 transition-all duration-200 hover:shadow-sm ${
                  theme === opt.key
                    ? `${opt.borderColor} ${opt.bgColor} ring-1 ring-primary/20 shadow-sm`
                    : "border-border/50 bg-card hover:bg-muted/20"
                }`}
              >
                <div className={`h-7 w-7 rounded-full ${opt.bgColor} flex items-center justify-center shrink-0 ${opt.iconColor}`}>
                  {opt.icon}
                </div>
                <span className="text-sm font-medium text-foreground">{opt.label}</span>
                {theme === opt.key && (
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary ml-auto shrink-0" />
                )}
              </button>
            ))}
          </div>
        </Card>
      </main>

      {/* Sticky bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border px-6 py-3">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${
              isBalanced ?
              "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" :
              "bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-400"}`
              }>
              
              <CheckCircle2 className="h-3.5 w-3.5" />
              {isBalanced ? "Balanced" : "Unbalanced"} — {totalWeight}%
            </span>
            <span className="text-xs text-muted-foreground">Last saved: just now</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="gap-1.5">
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </Button>
            <Button size="sm" className="gap-1.5">
              <Save className="h-3.5 w-3.5" />
              Save Configuration
            </Button>
          </div>
        </div>
      </div>
    </div>);

};

export default Configure;