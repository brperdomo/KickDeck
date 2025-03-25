import React, { useState } from 'react';
import MascotCharacter, { MascotEmotion } from './MascotCharacter';
import SpeechBubble from './SpeechBubble';
import './onboarding.css';

interface FloatingMascotButtonProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  mascotEmotion?: MascotEmotion;
  offset?: { x: number; y: number };
  size?: 'sm' | 'md' | 'lg';
  pulseEffect?: boolean;
  showOnLoad?: boolean;
  openDelay?: number;
  bubblePosition?: 'top' | 'right' | 'bottom' | 'left';
}

const FloatingMascotButton: React.FC<FloatingMascotButtonProps> = ({
  position = 'bottom-right',
  message = "Need help? Click me for assistance!",
  actionLabel,
  onAction,
  mascotEmotion = 'happy',
  offset = { x: 20, y: 20 },
  size = 'md',
  pulseEffect = false,
  showOnLoad = false,
  openDelay = 1000,
  bubblePosition = 'top',
}) => {
  const [showBubble, setShowBubble] = useState(showOnLoad);
  
  // Calculate position styles
  const getPositionStyles = () => {
    const styles: React.CSSProperties = {};
    
    if (position.includes('bottom')) {
      styles.bottom = offset.y;
    } else {
      styles.top = offset.y;
    }
    
    if (position.includes('right')) {
      styles.right = offset.x;
    } else {
      styles.left = offset.x;
    }
    
    return styles;
  };
  
  // Toggle the speech bubble
  const toggleBubble = () => {
    setShowBubble(!showBubble);
  };
  
  // Handle the action button click
  const handleAction = () => {
    if (onAction) {
      onAction();
    }
    setShowBubble(false);
  };
  
  // Show the speech bubble after a delay if showOnLoad is true
  React.useEffect(() => {
    if (showOnLoad) {
      const timer = setTimeout(() => {
        setShowBubble(true);
      }, openDelay);
      
      return () => clearTimeout(timer);
    }
  }, [showOnLoad, openDelay]);
  
  // Determine appropriate emotion for the mascot
  const getDisplayEmotion = (): MascotEmotion => {
    if (showBubble) {
      return mascotEmotion === 'happy' || mascotEmotion === 'neutral' ? 'excited' : mascotEmotion;
    }
    return mascotEmotion;
  };
  
  return (
    <div
      className={`floating-mascot-button ${pulseEffect ? 'pulse' : ''}`}
      style={getPositionStyles()}
    >
      {/* Speech bubble when shown */}
      {showBubble && (
        <div className="absolute" style={{ 
          [bubblePosition === 'right' ? 'right' : 'left']: bubblePosition === 'right' ? '-320px' : '0',
          [bubblePosition === 'bottom' ? 'bottom' : 'top']: bubblePosition === 'bottom' ? '100%' : bubblePosition === 'top' ? 'auto' : '50%',
          transform: bubblePosition === 'bottom' ? 'translateY(10px)' : bubblePosition === 'top' ? 'translateY(-100%)' : 'translateY(-50%)',
        }}>
          <SpeechBubble
            message={message}
            position={bubblePosition}
            actionLabel={actionLabel}
            onClose={toggleBubble}
            onAction={handleAction}
            mascotEmotion={mascotEmotion}
            showMascot={false}
          />
        </div>
      )}
      
      {/* Mascot character button */}
      <div 
        className="cursor-pointer z-50" 
        onClick={toggleBubble}
        aria-label="Help mascot"
      >
        <MascotCharacter
          emotion={getDisplayEmotion()}
          size={size}
          className={pulseEffect ? 'pulse' : ''}
        />
      </div>
    </div>
  );
};

export default FloatingMascotButton;