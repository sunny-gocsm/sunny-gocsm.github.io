import React from "react";

/** MyQueue — a team member's Brief: the same SignalCard, member-scoped, each row carrying its SLA.
 *  Page content (place inside your app shell). `queue` is the SignalCard list (a node). */
export function MyQueue({ member, scope, queue, filter = "mine", onFilter, approvals, empty = "Nothing in your queue today.", ...rest }) {
  return (
    <div className="page" {...rest}>
      <div className="mq-head">
        <div className="mq-greet">
          <div className="g">{member ? member + "'s queue" : "My queue"}</div>
          {scope != null ? <div>{scope} accounts assigned to you</div> : null}
        </div>
        <div>
          <span className={["seg", filter === "mine" && "sel"].filter(Boolean).join(" ")} onClick={() => onFilter && onFilter("mine")}>My accounts</span>
          <span className={["seg", filter === "all" && "sel"].filter(Boolean).join(" ")} onClick={() => onFilter && onFilter("all")}>All</span>
        </div>
      </div>
      {approvals ? <div>{approvals}</div> : null}
      <div className="queue">{queue || <div className="queue-empty">{empty}</div>}</div>
    </div>
  );
}
