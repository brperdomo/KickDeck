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