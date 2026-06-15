import { CheckCircle2, AlertCircle, MinusCircle } from "lucide-react";
import AiBrandingBadge from "@/components/AiBrandingBadge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type Impact = "positive" | "neutral" | "negative";

interface Driver {
  name: string;
  impact: Impact;
  summary: string;
  detail: string;
}

interface HealthDriversCardProps {
  drivers: Driver[];
}

const impactConfig: Record<Impact, { icon: typeof CheckCircle2; className: string; bgClass: string }> = {
  positive: { icon: CheckCircle2, className: "text-health-green", bgClass: "bg-health-green-bg" },
  neutral: { icon: MinusCircle, className: "text-muted-foreground", bgClass: "bg-secondary" },
  negative: { icon: AlertCircle, className: "text-health-red", bgClass: "bg-health-red-bg" },
};

const HealthDriversCard = ({ drivers }: HealthDriversCardProps) => {
  return (
    <div className="rounded-xl bg-card shadow-card-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-sm font-semibold text-card-foreground">
          What's Impacting Health?
        </h3>
        <AiBrandingBadge size="sm" />
      </div>

      <Accordion type="multiple" className="space-y-1">
        {drivers.map((driver) => {
          const { icon: Icon, className, bgClass } = impactConfig[driver.impact];

          return (
            <AccordionItem
              key={driver.name}
              value={driver.name}
              className="border-b border-border last:border-0"
            >
              <AccordionTrigger className="py-3.5 hover:no-underline group">
                <div className="flex items-center gap-3 text-left">
                  <div className={`flex h-6 w-6 items-center justify-center rounded-md ${bgClass}`}>
                    <Icon className={`h-3.5 w-3.5 flex-shrink-0 ${className}`} />
                  </div>
                  <span className="text-sm font-medium text-card-foreground">
                    {driver.name}
                  </span>
                  <span className="text-xs text-muted-foreground hidden sm:inline">
                    — {driver.summary}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-3 pl-9">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {driver.detail}
                </p>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
};

export default HealthDriversCard;
