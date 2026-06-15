import { useState } from "react";
import { ChevronRight, ChevronDown, ChevronUp, Activity, DollarSign, LogIn, MessageSquare, SlidersHorizontal } from "lucide-react";

const pillars = [
  {
    icon: Activity,
    number: 1,
    title: "Product Adoption",
    subtitle: "Activation & Usage",
    description: "Product Adoption measures the extent to which a user is actively using the product and realizing its intended value.",
    detail: "In GoCSM, Product Adoption checks: Did they set things up? Are they using the features? Is their activity growing over time?",
    color: "text-health-green",
    bg: "bg-health-green-bg",
    ring: "ring-health-green/20",
  },
  {
    icon: DollarSign,
    number: 2,
    title: "Revenue Intelligence",
    subtitle: "Financial Health",
    description: "Revenue Intelligence measures a customer's financial reliability and subscription stability.",
    detail: "In GoCSM, Revenue Intelligence checks: Are they paying their bills on time? Are they upgrading or downgrading their plan? Is their spending staying steady or growing?",
    color: "text-primary",
    bg: "bg-primary/10",
    ring: "ring-primary/15",
  },
  {
    icon: LogIn,
    number: 3,
    title: "Login Activity",
    subtitle: "Engagement Momentum",
    description: "Login Activity measures how consistently and frequently users access the product over time.",
    detail: "In GoCSM, Login Activity checks: Are users logging in regularly? Are they spending time inside the product? Is their activity increasing or decreasing compared to before?",
    color: "text-health-orange",
    bg: "bg-health-orange-bg",
    ring: "ring-health-orange/20",
  },
  {
    icon: MessageSquare,
    number: 4,
    title: "Feedback / NPS",
    subtitle: "Customer Sentiment",
    description: "Feedback / NPS measures a customer's current satisfaction and overall sentiment toward the product.",
    detail: "It is based on recent user ratings, with greater weight given to key decision-makers, ensuring the score accurately reflects the strength of the business relationship.",
    color: "text-health-yellow",
    bg: "bg-health-yellow-bg",
    ring: "ring-health-yellow/20",
  },
];

const HealthMethodologyCard = () => {
  const [minimized, setMinimized] = useState(false);

  return (
    <div className="rounded-2xl bg-card border border-border/40 shadow-card-lg relative overflow-hidden">
      {/* Subtle background decoration */}
      {!minimized && (
        <div className="absolute top-0 right-0 w-72 h-72 bg-primary/[0.02] rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      )}

      <button
        onClick={() => setMinimized(!minimized)}
        className="absolute top-4 right-4 p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200 z-10"
      >
        {minimized ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
      </button>

      {minimized ? (
        <div className="px-8 py-4">
          <h2 className="text-sm font-bold text-card-foreground tracking-tight">
            How We Calculate Health
          </h2>
        </div>
      ) : (
        <div className="p-8">
          <div className="text-center mb-8 relative">
            <h2 className="text-lg font-bold text-card-foreground tracking-tight mb-1">
              How We Calculate Health
            </h2>
            <p className="text-sm text-gradient-primary font-semibold">
              4 Pillars That Power Your 0–100 Health Score
            </p>
            <p className="text-xs text-muted-foreground mt-2 max-w-xl mx-auto leading-relaxed">
              Each pillar is scored independently from 0–100, then combined using custom weights you control.
            </p>
          </div>

          {/* Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-0 relative">
            {pillars.map((pillar, i) => {
              const Icon = pillar.icon;
              return (
                <div key={pillar.title} className="flex items-start">
                  <div className="flex-1 flex flex-col items-center text-center px-3 group">
                    <div className={`h-14 w-14 rounded-2xl ${pillar.bg} ring-1 ${pillar.ring} flex items-center justify-center mb-3 transition-transform duration-300 group-hover:scale-110`}>
                      <Icon className={`h-7 w-7 ${pillar.color}`} />
                    </div>
                    <p className="text-sm font-semibold text-card-foreground tracking-tight">
                      {pillar.number}. {pillar.title}
                    </p>
                    <p className="text-[11px] text-muted-foreground mb-2">({pillar.subtitle})</p>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-1.5">
                      {pillar.description}
                    </p>
                    <p className="text-[11px] text-muted-foreground/60 italic leading-relaxed">
                      {pillar.detail}
                    </p>
                  </div>
                  {i < pillars.length - 1 && (
                    <div className="hidden lg:flex items-center pt-6">
                      <ChevronRight className="h-4 w-4 text-muted-foreground/30 flex-shrink-0" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="mt-8 pt-5 border-t border-border/30 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Pillar weights are fully customizable — adjust them in your Configure Settings.</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthMethodologyCard;
