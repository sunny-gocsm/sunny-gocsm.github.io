import { Mail, Phone, Clock, Users, Activity, Star, Building2, CalendarDays } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface AccountInfoProps {
  accountName: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  planType: string;
  status: "Active" | "Suspended" | "Cancelled";
  lifecycle: "Onboarding" | "Growth" | "Mature";
  daysActive: number;
  totalUsers: number;
  healthScore: number;
  lastUpdated: string;
  clientSince?: string;
  onLifecycleChange?: (stage: "Onboarding" | "Growth" | "Mature") => void;
}

const statusStyles: Record<string, string> = {
  Active: "bg-health-green-bg text-health-green border border-health-green/20",
  Suspended: "bg-health-yellow-bg text-health-yellow border border-health-yellow/20",
  Cancelled: "bg-health-red-bg text-health-red border border-health-red/20",
};

const lifecycleStyles: Record<string, string> = {
  Onboarding: "bg-primary/10 text-primary border border-primary/20",
  Growth: "bg-health-green-bg text-health-green border border-health-green/20",
  Mature: "bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-500/20",
};

const AccountInfoCard = ({
  accountName,
  ownerName,
  ownerEmail,
  ownerPhone,
  planType,
  status,
  lifecycle,
  daysActive,
  totalUsers,
  healthScore,
  lastUpdated,
  clientSince,
  onLifecycleChange,
}: AccountInfoProps) => {
  const initials = ownerName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <div className="rounded-xl bg-card shadow-card-lg overflow-hidden">
      {/* Colored header strip */}
      <div className="h-2 bg-gradient-to-r from-primary via-primary/70 to-accent/50" />

      <div className="p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Building2 className="h-3.5 w-3.5 text-primary" />
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            Account Info
          </p>
        </div>

        <div>
          <h2 className="text-lg font-bold text-card-foreground">{accountName}</h2>
        </div>

        {/* Owner */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 text-sm font-semibold text-primary-foreground shadow-sm">
            {initials}
          </div>
          <span className="text-sm font-medium text-card-foreground">{ownerName}</span>
        </div>

        {/* Contact */}
        <div className="space-y-1.5 bg-secondary/50 rounded-lg p-3">
          <a
            href={`tel:${ownerPhone}`}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <Phone className="h-3.5 w-3.5" />
            {ownerPhone}
          </a>
          <a
            href={`mailto:${ownerEmail}`}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <Mail className="h-3.5 w-3.5" />
            {ownerEmail}
          </a>
        </div>

        {/* Plan */}
        <p className="text-sm font-medium text-card-foreground">{planType}</p>

        {/* Signed Up */}
        {clientSince && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5" />
            <span>Signed up <span className="font-medium text-card-foreground">{new Date(clientSince).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span></span>
          </div>
        )}

        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${statusStyles[status]}`}
          >
            {status}
          </span>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${lifecycleStyles[lifecycle]}`}
          >
            <Star className="h-3 w-3" />
            {lifecycle}
          </span>
        </div>

        {/* Lifecycle Stage Selector */}
        <div className="rounded-lg border border-border/60 bg-secondary/30 p-3 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Lifecycle Stage
          </p>
          <Select value={lifecycle} onValueChange={(v) => onLifecycleChange?.(v as "Onboarding" | "Growth" | "Mature")}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Onboarding">Onboarding</SelectItem>
              <SelectItem value="Growth">Growth</SelectItem>
              <SelectItem value="Mature">Mature</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-secondary">
              <Clock className="h-3 w-3" />
            </div>
            {daysActive} days active
          </div>
          <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-secondary">
              <Users className="h-3 w-3" />
            </div>
            {totalUsers} Team Members
          </div>
          <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-health-yellow-bg">
              <Activity className="h-3 w-3 text-health-yellow" />
            </div>
            Health Score: <span className="font-semibold text-card-foreground">{healthScore}</span>
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground/60 pt-1">
          Last updated {lastUpdated}
        </p>
      </div>
    </div>
  );
};

export default AccountInfoCard;