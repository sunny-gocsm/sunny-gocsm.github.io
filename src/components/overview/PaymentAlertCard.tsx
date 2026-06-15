import { AlertTriangle, ArrowDownRight, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface PaymentFailure {
  name: string;
  plan: string;
  amount: number;
  status: "Failed" | "Past Due" | "Retry Scheduled";
}

interface AccountAlert {
  name: string;
  type: "Downgrade" | "Add-on Canceled";
  detail: string;
  amount: number;
}

interface PaymentAlertCardProps {
  failures: PaymentFailure[];
  alerts: AccountAlert[];
}

const statusStyle: Record<string, string> = {
  Failed: "bg-health-red-bg text-health-red border-health-red/20",
  "Past Due": "bg-health-orange-bg text-health-orange border-health-orange/20",
  "Retry Scheduled": "bg-health-yellow-bg text-health-yellow border-health-yellow/20",
};

const alertTypeStyle: Record<string, string> = {
  Downgrade: "bg-health-orange-bg text-health-orange border-health-orange/20",
  "Add-on Canceled": "bg-health-yellow-bg text-health-yellow border-health-yellow/20",
};

const PaymentAlertCard = ({ failures, alerts }: PaymentAlertCardProps) => {
  if (failures.length === 0 && alerts.length === 0) return null;

  const totalAtRisk = failures.reduce((s, f) => s + f.amount, 0);
  const totalLost = alerts.reduce((s, a) => s + Math.abs(a.amount), 0);
  const totalIssues = failures.length + alerts.length;

  return (
    <div className="rounded-xl bg-health-red-bg border border-health-red/15 shadow-card p-6 relative overflow-hidden">
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-health-red" />

      <div className="flex items-start gap-3 mb-5">
        <div className="h-8 w-8 rounded-lg bg-health-red/10 flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="h-4 w-4 text-health-red" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-card-foreground">Revenue Alerts</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {totalIssues} issues detected — ${(totalAtRisk + totalLost).toLocaleString()} in revenue impact.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Failures */}
        {failures.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <XCircle className="h-3.5 w-3.5 text-health-red" />
              <h4 className="text-xs font-semibold text-card-foreground">
                Payment Failures ({failures.length})
              </h4>
              <span className="text-xs text-health-red font-medium ml-auto">
                ${totalAtRisk.toLocaleString()} at risk
              </span>
            </div>
            <div className="space-y-2">
              {failures.map((f) => (
                <div key={f.name} className="flex items-center justify-between bg-card/60 rounded-lg px-3 py-2.5">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-card-foreground">{f.name}</span>
                    <span className="text-xs text-muted-foreground">{f.plan}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-card-foreground">${f.amount.toLocaleString()}</span>
                    <Badge variant="outline" className={statusStyle[f.status]}>
                      {f.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Downgrades & Cancellations */}
        {alerts.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ArrowDownRight className="h-3.5 w-3.5 text-health-orange" />
              <h4 className="text-xs font-semibold text-card-foreground">
                Downgrades & Cancellations ({alerts.length})
              </h4>
              <span className="text-xs text-health-orange font-medium ml-auto">
                -${totalLost.toLocaleString()}/mo
              </span>
            </div>
            <div className="space-y-2">
              {alerts.map((a) => (
                <div key={a.name + a.detail} className="flex items-center justify-between bg-card/60 rounded-lg px-3 py-2.5">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-card-foreground">{a.name}</span>
                    <span className="text-xs text-muted-foreground">{a.detail}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-health-orange">-${Math.abs(a.amount).toLocaleString()}</span>
                    <Badge variant="outline" className={alertTypeStyle[a.type]}>
                      {a.type}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-5 pt-4 border-t border-health-red/10">
        <span className="text-[10px] text-muted-foreground">Last billing sync: 5 minutes ago</span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="text-xs">Send Payment Reminder</Button>
          <Button size="sm" className="text-xs">View Affected Accounts</Button>
        </div>
      </div>
    </div>
  );
};

export default PaymentAlertCard;
