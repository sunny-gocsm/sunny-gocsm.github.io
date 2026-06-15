import { useState } from "react";
import { Crown, Calendar, UserCircle, Filter, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type OverviewFilters = {
  plan: string; // "all" or plan name
  signedUp: string; // "all" | "7d" | "30d" | "90d" | "1y"
  csm: string; // "all" | "unassigned" | csm name
};

type Props = {
  value: OverviewFilters;
  onChange: (next: OverviewFilters) => void;
  plans: string[];
  csms: string[];
};

const TABS = [
  { id: "plan", label: "Plans", icon: Crown },
  { id: "signedUp", label: "Signed-up", icon: Calendar },
  { id: "csm", label: "CSM", icon: UserCircle },
] as const;

type TabId = (typeof TABS)[number]["id"];

const SIGNED_UP_OPTIONS = [
  { value: "all", label: "All Time" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "1y", label: "Last year" },
];

const OverviewFilterPopover = ({ value, onChange, plans, csms }: Props) => {
  const [activeTab, setActiveTab] = useState<TabId>("plan");
  const [open, setOpen] = useState(false);

  const activeCount =
    (value.plan !== "all" ? 1 : 0) +
    (value.signedUp !== "all" ? 1 : 0) +
    (value.csm !== "all" ? 1 : 0);

  const renderOptions = () => {
    if (activeTab === "plan") {
      const opts = [{ value: "all", label: "All Plans" }, ...plans.map((p) => ({ value: p, label: p }))];
      return opts.map((o) => (
        <FilterOption
          key={o.value}
          label={o.label}
          selected={value.plan === o.value}
          onClick={() => onChange({ ...value, plan: o.value })}
        />
      ));
    }
    if (activeTab === "signedUp") {
      return SIGNED_UP_OPTIONS.map((o) => (
        <FilterOption
          key={o.value}
          label={o.label}
          selected={value.signedUp === o.value}
          onClick={() => onChange({ ...value, signedUp: o.value })}
        />
      ));
    }
    const opts = [
      { value: "all", label: "All CSMs" },
      { value: "unassigned", label: "Unassigned" },
      ...csms.map((c) => ({ value: c, label: c })),
    ];
    return opts.map((o) => (
      <FilterOption
        key={o.value}
        label={o.label}
        selected={value.csm === o.value}
        onClick={() => onChange({ ...value, csm: o.value })}
      />
    ));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 gap-2 text-xs">
          <Filter className="h-3.5 w-3.5" />
          Filters
          {activeCount > 0 && (
            <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
              {activeCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[300px] p-0 overflow-hidden">
        <div className="grid grid-cols-3 border-b bg-muted/30">
          {TABS.map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={cn(
                  "flex items-center justify-center gap-1.5 px-2 py-2.5 text-xs font-medium transition-colors relative",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {t.label}
                {isActive && (
                  <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>
        <div className="max-h-[280px] overflow-y-auto p-2 space-y-1">{renderOptions()}</div>
      </PopoverContent>
    </Popover>
  );
};

const FilterOption = ({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={cn(
      "w-full flex items-center justify-between rounded-md px-3 py-2 text-xs text-left transition-colors",
      selected
        ? "bg-primary text-primary-foreground font-medium"
        : "hover:bg-muted text-foreground"
    )}
  >
    <span className="truncate">{label}</span>
    {selected && <Check className="h-3.5 w-3.5 shrink-0" />}
  </button>
);

export default OverviewFilterPopover;
