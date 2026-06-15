import { CheckSquare, Square, ClipboardCheck } from "lucide-react";
import { useState } from "react";

interface Action {
  id: string;
  label: string;
}

interface RecommendedActionsCardProps {
  actions: Action[];
}

const RecommendedActionsCard = ({ actions }: RecommendedActionsCardProps) => {
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="rounded-xl bg-card shadow-card-lg overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-primary/60 via-primary to-primary/60" />
      <div className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
            <ClipboardCheck className="h-3.5 w-3.5 text-primary" />
          </div>
          <h4 className="text-sm font-semibold text-card-foreground">
            Recommended Actions
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {actions.map((action) => {
            const isDone = checked.has(action.id);
            return (
              <button
                key={action.id}
                onClick={() => toggle(action.id)}
                className={`flex items-start gap-2.5 rounded-lg border p-3.5 text-left transition-all duration-200 ${
                  isDone
                    ? "border-primary/30 bg-primary/5 shadow-sm"
                    : "border-border hover:border-primary/20 hover:bg-secondary/50 hover:shadow-sm"
                }`}
              >
                {isDone ? (
                  <CheckSquare className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                ) : (
                  <Square className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                )}
                <span
                  className={`text-xs leading-relaxed ${
                    isDone ? "text-primary line-through" : "text-card-foreground"
                  }`}
                >
                  {action.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RecommendedActionsCard;
