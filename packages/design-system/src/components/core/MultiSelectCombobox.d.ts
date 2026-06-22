import * as React from "react";

export interface MultiSelectComboboxProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, "onChange"> {
  options?: string[];
  selected?: string[];
  onChange?: (next: string[]) => void;
  placeholder?: string;
  searchable?: boolean;
  maxVisibleChips?: number;
  className?: string;
}

export declare function MultiSelectCombobox(props: MultiSelectComboboxProps): React.JSX.Element;
