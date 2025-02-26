
import { useMemo } from 'react';

interface ProgressIndicatorProps {
  tabs: string[];
  completedTabs: string[];
}

export function ProgressIndicator({ tabs, completedTabs }: ProgressIndicatorProps) {
  const progress = useMemo(() => {
    return (completedTabs.length / tabs.length) * 100;
  }, [tabs.length, completedTabs.length]);

  return (
    <div className="w-full mb-6">
      <div className="flex justify-between mb-2">
        <span className="text-sm font-medium">Progress</span>
        <span className="text-sm font-medium">{Math.round(progress)}%</span>
      </div>
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-[#43A047] transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
import { cn } from "@/lib/utils";

interface ProgressIndicatorProps {
  steps: string[];
  currentStep: string;
  completedSteps: string[];
}

export function ProgressIndicator({ steps, currentStep, completedSteps }: ProgressIndicatorProps) {
  return (
    <div className="flex justify-between mb-6">
      {steps.map((step, index) => (
        <div key={step} className="flex items-center">
          <div
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center",
              completedSteps.includes(step) ? "bg-[#43A047] text-white" : "bg-gray-300",
              currentStep === step && "ring-2 ring-[#43A047]"
            )}
          >
            {index + 1}
          </div>
          {index < steps.length - 1 && (
            <div className={cn(
              "w-16 h-px",
              completedSteps.includes(step) ? "bg-[#43A047]" : "bg-gray-300"
            )} />
          )}
        </div>
      ))}
    </div>
  );
}
