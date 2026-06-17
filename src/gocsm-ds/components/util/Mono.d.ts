import * as React from "react";
export interface MonoProps extends React.HTMLAttributes<HTMLSpanElement> {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}
export declare function Mono(props: MonoProps): JSX.Element;
export default Mono;
