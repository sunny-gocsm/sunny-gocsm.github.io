import React from "react";
import { Icon } from "../util/Icon.jsx";
import { PillarBar } from "../health/PillarBar.jsx";
import { WhyCard } from "../insight/WhyCard.jsx";

const PILLAR_DEF = { login: "How often the owner logs in", pas: "How much of the product they use", revenue: "Billing & payment health", feedback: "What they tell you" };
/** MethodologyExplainer — the on-demand "How is health scored?" surface: the model in plain language
 *  + this account's live factors. Reasoning, not formula; weights are agency-configurable. */
export function MethodologyExplainer({ lede, routes = true, pillars = null, factors = [], tune, ...rest }) {
  return (
    <div {...rest}>
      <div className="panel panel-pad">
        {lede ? <div className="model-lede">{lede}</div> : null}
        {routes ? (
          <div className="routes">
            <div className="route-chip score"><span className="rc-ico"><Icon name="compass" /></span><div className="rc-t">The score routes attention</div><div className="rc-d">It decides who you look at first.</div></div>
            <div className="route-chip signal"><span className="rc-ico"><Icon name="zap" /></span><div className="rc-t">Signals direct action</div><div className="rc-d">They tell you what to actually do.</div></div>
          </div>
        ) : null}
        <div className="pillars">
          {["login", "pas", "revenue", "feedback"].map((k) => (
            <div key={k} className={["pillar", k].join(" ")}>
              <div className="p-top"><span className="p-dot" /><span className="p-name">{k}</span></div>
              <div className="p-plain">{PILLAR_DEF[k]}</div>
            </div>
          ))}
        </div>
        {pillars ? <PillarBar weights={pillars} /> : null}
      </div>
      {factors.length ? (
        <div className="panel panel-pad">
          <WhyCard kind="risk" title="This account's factors" drivers={factors.map((f) => ({ title: f.text, desc: f.pillar, severity: f.dir === "down" ? "high" : "pos" }))} />
        </div>
      ) : null}
      {tune ? <div className="panel panel-pad">{tune}</div> : null}
    </div>
  );
}
