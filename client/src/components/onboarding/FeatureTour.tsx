import React, { useState, useEffect } from 'react';
import FeatureSpotlight from './FeatureSpotlight';
import { MascotEmotion } from './MascotCharacter';
import './onboarding.css';

interface TourStep {
  selector: string;
  message: string;
  position?: 'top' | 'right' | 'bottom' | 'left';
  mascotEmotion?: MascotEmotion;
  showMascot?: boolean;
}

interface FeatureTourProps {
  steps: TourStep[];
  initialStep?: number;
  onComplete?: () => void;
  onSkip?: () => void;
  nextLabel?: string;
  prevLabel?: string;
  skipLabel?: string;
  showControls?: boolean;
  autoStart?: boolean;
  autoScroll?: boolean;
  openDelay?: number;
}

const FeatureTour: React.FC<FeatureTourProps> = ({
  steps,
  initialStep = 0,
  onComplete,
  onSkip,
  nextLabel = 'Next',
  prevLabel = 'Previous',
  skipLabel = 'Skip Tour',
  showControls = true,
  autoStart = true,
  autoScroll = true,
  openDelay = 300,
}) => {
  const [currentStep, setCurrentStep] = useState<number | null>(autoStart ? null : -1);
  const [isOpen, setIsOpen] = useState(false);
  
  // Initialize the tour after a small delay
  useEffect(() => {
    if (autoStart && steps.length > 0) {
      const timer = setTimeout(() => {
        setCurrentStep(initialStep);
        setIsOpen(true);
      }, openDelay);
      
      return () => clearTimeout(timer);
    }
  }, [autoStart, initialStep, openDelay, steps.length]);
  
  // Handle next step
  const handleNext = () => {
    if (currentStep !== null && currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Last step - complete the tour
      handleComplete();
    }
  };
  
  // Handle previous step
  const handlePrevious = () => {
    if (currentStep !== null && currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  // Handle skip tour
  const handleSkip = () => {
    setIsOpen(false);
    setCurrentStep(null);
    if (onSkip) onSkip();
  };
  
  // Handle tour completion
  const handleComplete = () => {
    setIsOpen(false);
    setCurrentStep(null);
    if (onComplete) onComplete();
  };
  
  // Render nothing if tour is not active or no steps are provided
  if (currentStep === null || currentStep === -1 || steps.length === 0) {
    return null;
  }
  
  // Get current step data
  const currentStepData = steps[currentStep];
  
  return (
    <>
      <FeatureSpotlight
        selector={currentStepData.selector}
        message={currentStepData.message}
        position={currentStepData.position || 'bottom'}
        mascotEmotion={currentStepData.mascotEmotion || 'pointing'}
        showMascot={currentStepData.showMascot !== undefined ? currentStepData.showMascot : true}
        onClose={handleSkip}
        onAction={handleNext}
        actionLabel={currentStep < steps.length - 1 ? nextLabel : 'Finish'}
        autoFocus={autoScroll}
      />
      
      {/* Tour controls for navigation and skipping */}
      {showControls && (
        <div className="tour-controls">
          <div className="flex justify-between fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white p-2 rounded-lg shadow-md z-50">
            {/* Step indicators */}
            <div className="flex items-center space-x-1 px-2">
              {steps.map((_, index) => (
                <div 
                  key={index}
                  className={`w-2 h-2 rounded-full ${index === currentStep ? 'bg-primary' : 'bg-gray-300'}`}
                  aria-label={`Step ${index + 1}`}
                />
              ))}
            </div>
            
            {/* Navigation buttons */}
            <div className="flex items-center space-x-2">
              {currentStep > 0 && (
                <button 
                  onClick={handlePrevious} 
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  {prevLabel}
                </button>
              )}
              
              <button 
                onClick={handleSkip}
                className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700"
              >
                {skipLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FeatureTour;