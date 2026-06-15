import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SubAccount, CSM_OPTIONS } from "@/data/subAccountsData";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TableCell, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import HealthScoreBadge from "./HealthScoreBadge";
import { TrendingUp, TrendingDown, Minus, MessageSquare, Star } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";

interface AccountRowProps {
  account: SubAccount;
  onUpdate: (updated: SubAccount) => void;
  onSetPriority: (id: string) => void;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
}

const AccountRow = ({ account, onUpdate, onSetPriority, isSelected, onToggleSelect }: AccountRowProps) => {
  const navigate = useNavigate();
  const [confirmDialog, setConfirmDialog] = useState<"primary" | "feedback" | null>(null);
  const isDisabled = account.status === "Disabled";

  const lifecycleColors: Record<string, string> = {
    Onboarding: "bg-blue-50 text-blue-600 border-blue-100",
    Growth: "bg-emerald-50 text-emerald-600 border-emerald-100",
    Mature: "bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-100 dark:border-violet-500/20",
  };

  const riskColors: Record<string, string> = {
    Low: "bg-emerald-50 text-emerald-600 border-emerald-100",
    Medium: "bg-amber-50 text-amber-600 border-amber-100",
    High: "bg-rose-50 text-rose-600 border-rose-100",
  };

  const canRequestFeedback = () => {
    if (!account.lastFeedbackDate) return true;
    const lastDate = new Date(account.lastFeedbackDate);
    const diff = Date.now() - lastDate.getTime();
    return diff > 7 * 24 * 60 * 60 * 1000;
  };

  const handleToggleWidget = () => {
    if (isDisabled) return;
    const updated = { ...account, widgetEnabled: !account.widgetEnabled };
    onUpdate(updated);
    toast({
      title: updated.widgetEnabled ? "Widget Enabled" : "Widget Disabled",
      description: `GoCSM widget ${updated.widgetEnabled ? "enabled" : "disabled"} for ${account.name}.`,
    });
  };

  const handleConfirmPriority = () => {
    onSetPriority(account.id);
    setConfirmDialog(null);
    toast({ title: account.isPriority ? "Priority Status Removed" : "Priority Account Set", description: `${account.name} ${account.isPriority ? "is no longer a priority account" : "is now a priority account"}.` });
  };

  const handleConfirmDisable = () => {
    onUpdate({ ...account, status: "Disabled", widgetEnabled: false });
    setConfirmDialog(null);
    toast({ title: "Account Tracking Disabled", description: `Tracking has been disabled for ${account.name}.` });
  };

  const handleEnable = () => {
    onUpdate({ ...account, status: "Enabled" });
    toast({ title: "Account Tracking Enabled", description: `Tracking has been re-enabled for ${account.name}.` });
  };

  const handleConfirmFeedback = () => {
    onUpdate({ ...account, lastFeedbackDate: new Date().toISOString().split("T")[0] });
    setConfirmDialog(null);
    toast({ title: "Feedback Requested", description: `Feedback request sent to ${account.owner}.` });
  };

  return (
    <>
      <TableRow className={cn("group transition-colors", isDisabled && "opacity-50 bg-muted/30", isSelected && "bg-primary/5")}>
        <TableCell className="w-10">
          <Checkbox
            className="border-border/60"
            checked={isSelected}
            onCheckedChange={() => onToggleSelect(account.id)}
          />
        </TableCell>

        {/* Account */}
        <TableCell>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold flex-shrink-0">
              {account.avatar}
            </div>
            <div className="flex flex-col">
              <button
                onClick={() => navigate(`/sub-accounts/${account.id}/health-overview`)}
                className="text-sm font-medium text-foreground hover:text-primary hover:underline underline-offset-2 transition-colors text-left"
              >
                {account.name}
              </button>
              <div className="flex items-center gap-1.5 mt-0.5">
                {account.isPriority && (
                  <Badge className="text-[10px] px-1.5 py-0 h-4 bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">
                    Priority
                  </Badge>
                )}
                {account.isNonSaaS && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-muted/50 text-muted-foreground border-border/40">
                    Non-SaaS
                  </Badge>
                )}
                {isDisabled && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-destructive/10 text-destructive border-destructive/20">
                    Disabled
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </TableCell>

        {/* Signed Up */}
        <TableCell>
          <span className="text-sm text-foreground">
            {new Date(account.clientSince).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </span>
        </TableCell>

        {/* Plan */}
        <TableCell>
          <span className="text-sm text-foreground font-medium">{account.isNonSaaS ? "Manual" : account.plan}</span>
        </TableCell>

        {/* Lifecycle */}
        <TableCell>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex cursor-help">
                <Badge variant="outline" className={cn("text-xs font-medium border", lifecycleColors[account.lifecycleStage])}>
                  {account.lifecycleStage}
                </Badge>
              </span>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="text-xs">
                {account.lifecycleStage === "Onboarding" && "0–90 days. Early setup and activation phase."}
                {account.lifecycleStage === "Growth" && "90–180 days. Expanding usage and adoption."}
                {account.lifecycleStage === "Mature" && "180+ days. Established and fully adopted."}
              </p>
            </TooltipContent>
          </Tooltip>
        </TableCell>

        {/* Health Score */}
        <TableCell>
          {isDisabled ? (
            <span className="text-xs text-muted-foreground">—</span>
          ) : (
            <HealthScoreBadge score={account.healthScore} delta={account.healthDelta} />
          )}
        </TableCell>

        {/* Trend */}
        <TableCell>
          {isDisabled ? (
            <span className="text-xs text-muted-foreground">—</span>
          ) : (
            <div className="flex items-center gap-1.5">
              {account.healthDelta > 0 ? (
                <TrendingUp className="h-3.5 w-3.5 text-health-green" />
              ) : account.healthDelta < 0 ? (
                <TrendingDown className="h-3.5 w-3.5 text-health-red" />
              ) : (
                <Minus className="h-3.5 w-3.5 text-health-yellow" />
              )}
              <span className={cn("text-xs font-medium", account.healthDelta > 0 ? "text-health-green" : account.healthDelta < 0 ? "text-health-red" : "text-health-yellow")}>
                {account.healthDelta > 0 ? "+" : ""}{account.healthDelta}%
              </span>
            </div>
          )}
        </TableCell>

        {/* Revenue */}
        <TableCell>
          <span className="text-sm font-semibold text-foreground">
            ${account.revenue.toLocaleString()}
          </span>
        </TableCell>

        {/* Assigned CSM */}
        <TableCell>
          <Select
            value={account.assignedCsm ?? "unassigned"}
            onValueChange={(v) => onUpdate({ ...account, assignedCsm: v === "unassigned" ? null : v })}
            disabled={isDisabled}
          >
            <SelectTrigger className="h-8 w-[150px] text-xs">
              <SelectValue placeholder="Unassigned" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned" className="text-xs text-muted-foreground">Unassigned</SelectItem>
              {CSM_OPTIONS.map((name) => (
                <SelectItem key={name} value={name} className="text-xs">{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </TableCell>


        {/* Actions */}
        <TableCell>
          <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
            {!isDisabled && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => setConfirmDialog("primary")}>
                    <Star className={cn("h-3.5 w-3.5", account.isPriority ? "fill-yellow-500 text-yellow-500" : "text-yellow-500")} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top"><p>{account.isPriority ? "Remove Priority" : "Set as Priority"}</p></TooltipContent>
              </Tooltip>
            )}

            {!isDisabled && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" disabled={!canRequestFeedback()} onClick={() => setConfirmDialog("feedback")}>
                    <MessageSquare className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top"><p>Request Feedback</p></TooltipContent>
              </Tooltip>
            )}
          </div>
        </TableCell>
      </TableRow>

      {/* Confirmation Dialogs */}
      <AlertDialog open={confirmDialog === "primary"} onOpenChange={() => setConfirmDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{account.isPriority ? "Remove Priority Status?" : "Set as Priority Account?"}</AlertDialogTitle>
            <AlertDialogDescription>
              This will {account.isPriority ? "remove priority status from" : "mark"} <strong>{account.name}</strong> {account.isPriority ? "." : "as a priority account."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmPriority}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmDialog === "feedback"} onOpenChange={() => setConfirmDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Request Feedback?</AlertDialogTitle>
            <AlertDialogDescription>
              Send a feedback request to <strong>{account.owner}</strong> for {account.name}.
              {account.lastFeedbackDate && (
                <span className="block mt-1 text-muted-foreground">
                  Last requested: {account.lastFeedbackDate}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmFeedback}>Send Request</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AccountRow;
