import * as React from "react";

/** GoCSM Card — neutral in-flow surface (resting elevation only). */
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Add hover elevation + pointer (for clickable cards). @default false */
  hover?: boolean;
  /** Apply default 20px padding. @default true */
  padded?: boolean;
  children?: React.ReactNode;
}

export function Card(props: CardProps): JSX.Element;
