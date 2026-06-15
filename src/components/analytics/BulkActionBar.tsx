import { Button } from "@/components/ui/button";
import { X, Star, MessageSquare, Workflow, UserCog } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CSM_OPTIONS } from "@/data/subAccountsData";

interface BulkActionBarProps {
  selectedCount: number;
  onClear: () => void;
  onTriggerWorkflow: () => void;
  onSetPriority: () => void;
  onRequestFeedback: () => void;
  onAssignCsm: (csm: string | null) => void;
}

const BulkActionBar = ({
  selectedCount,
  onClear,
  onTriggerWorkflow,
  onSetPriority,
  onRequestFeedback,
  onAssignCsm,
}: BulkActionBarProps) => {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 inset-x-0 z-50 flex justify-center animate-fade-in-up pointer-events-none">
      <div className="flex items-center gap-2 bg-blue-100 text-blue-900 rounded-full shadow-2xl pl-5 pr-2 py-2 pointer-events-auto">
        <span className="text-sm font-semibold tabular-nums whitespace-nowrap">
          {selectedCount} selected
        </span>
        <button
          onClick={onClear}
          className="h-5 w-5 rounded-full flex items-center justify-center hover:bg-blue-200 transition-colors"
        >
          <X className="h-3 w-3" />
        </button>

        <Separator orientation="vertical" className="h-5 bg-blue-300/50" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={onTriggerWorkflow}
              className="h-8 gap-1.5 rounded-full text-blue-800 hover:text-blue-900 hover:bg-blue-200/60 text-xs"
            >
              <Workflow className="h-3.5 w-3.5" />
              Workflow
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top"><p>Trigger Workflow</p></TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={onRequestFeedback}
              className="h-8 gap-1.5 rounded-full text-blue-800 hover:text-blue-900 hover:bg-blue-200/60 text-xs"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Feedback
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top"><p>Request Feedback</p></TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onSetPriority}
              className="h-8 w-8 rounded-full text-blue-800 hover:text-blue-900 hover:bg-blue-200/60"
            >
              <Star className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top"><p>Set as Priority</p></TooltipContent>
        </Tooltip>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 rounded-full text-blue-800 hover:text-blue-900 hover:bg-blue-200/60 text-xs"
            >
              <UserCog className="h-3.5 w-3.5" />
              Assign CSM
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-52 p-1.5" side="top" align="end">
            <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Assign CSM
            </div>
            <button
              onClick={() => onAssignCsm(null)}
              className="w-full text-left px-3 py-2 text-xs rounded-md hover:bg-secondary transition-colors text-muted-foreground"
            >
              Unassigned
            </button>
            {CSM_OPTIONS.map((name) => (
              <button
                key={name}
                onClick={() => onAssignCsm(name)}
                className="w-full text-left px-3 py-2 text-xs rounded-md hover:bg-secondary transition-colors text-foreground"
              >
                {name}
              </button>
            ))}
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

export default BulkActionBar;
