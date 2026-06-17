import * as React from "react";
export interface IconProps extends React.SVGAttributes<SVGElement> {
  name: string;
  size?: number | string;
  className?: string;
  style?: React.CSSProperties;
}
export declare function Icon(props: IconProps): JSX.Element;
export default Icon;
