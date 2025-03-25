import React, { useRef, useEffect, useState } from 'react';
import SpeechBubble from './SpeechBubble';
import { createPortal } from 'react-dom';
import './onboarding.css';

interface FeatureSpotlightProps {
  selector: string;
  message: string;
  position?: 'top' | 'right' | 'bottom' | 'left';
  onClose?: () => void;
  onAction?: () => void;
  actionLabel?: string;
  maskClosable?: boolean;
  disableScroll?: boolean;
  highlightPadding?: number;
  showMascot?: boolean;
  mascotEmotion?: string;
  autoFocus?: boolean;
}

const FeatureSpotlight: React.FC<FeatureSpotlightProps> = ({
  selector,
  message,
  position = 'bottom',
  onClose,
  onAction,
  actionLabel,
  maskClosable = true,
  disableScroll = true,
  highlightPadding = 8,
  showMascot = true,
  mascotEmotion = 'pointing',
  autoFocus = true,
}) => {
  const [targetElement, setTargetElement] = useState<Element | null>(null);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [bubblePosition, setBubblePosition] = useState({ top: 0, left: 0 });
  const spotlightRef = useRef<HTMLDivElement>(null);
  const holeRef = useRef<HTMLDivElement>(null);

  // Find the target element based on selector and update positioning
  useEffect(() => {
    const element = document.querySelector(selector);
    if (element) {
      setTargetElement(element);
      
      // Calculate the position and size of the element
      const rect = element.getBoundingClientRect();
      setTargetRect(rect);
      
      // Calculate the position for the speech bubble
      calculateBubblePosition(rect);
      
      // Scroll to element if needed and autoFocus is enabled
      if (autoFocus) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      
      // Make target element focusable if it's not already
      if (element instanceof HTMLElement && !element.getAttribute('tabindex')) {
        element.setAttribute('tabindex', '-1');
        setTimeout(() => element.focus(), 500);
      }
    }
    
    // Cleanup function
    return () => {
      if (targetElement instanceof HTMLElement && !targetElement.getAttribute('data-original-tabindex')) {
        targetElement.removeAttribute('tabindex');
      }
    };
  }, [selector, autoFocus]);
  
  // Update spotlight position on window resize
  useEffect(() => {
    const handleResize = () => {
      if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        setTargetRect(rect);
        calculateBubblePosition(rect);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [targetElement]);
  
  // Disable document scrolling if needed
  useEffect(() => {
    if (disableScroll) {
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [disableScroll]);
  
  // Calculate the position for the speech bubble based on target rect and desired position
  const calculateBubblePosition = (rect: DOMRect) => {
    const bubbleWidth = 300; // Speech bubble width
    const bubbleHeight = 150; // Estimated speech bubble height
    const spacing = 20; // Space between the bubble and target
    
    let top = 0;
    let left = 0;
    
    switch (position) {
      case 'top':
        top = rect.top - bubbleHeight - spacing;
        left = rect.left + (rect.width / 2) - (bubbleWidth / 2);
        break;
      case 'right':
        top = rect.top + (rect.height / 2) - (bubbleHeight / 2);
        left = rect.right + spacing;
        break;
      case 'bottom':
        top = rect.bottom + spacing;
        left = rect.left + (rect.width / 2) - (bubbleWidth / 2);
        break;
      case 'left':
        top = rect.top + (rect.height / 2) - (bubbleHeight / 2);
        left = rect.left - bubbleWidth - spacing;
        break;
    }
    
    // Ensure the bubble stays within the viewport
    top = Math.max(10, top);
    left = Math.max(10, left);
    left = Math.min(left, window.innerWidth - bubbleWidth - 10);
    
    setBubblePosition({ top, left });
  };
  
  // Handle mask click
  const handleMaskClick = (e: React.MouseEvent) => {
    if (maskClosable && spotlightRef.current === e.target && onClose) {
      onClose();
    }
  };
  
  // If no target element found, don't render anything
  if (!targetRect) {
    return null;
  }
  
  // Render the spotlight with hole cutout and speech bubble
  return createPortal(
    <div 
      ref={spotlightRef}
      className="spotlight-container"
      onClick={handleMaskClick}
      style={{ pointerEvents: 'auto' }}
    >
      <div className="spotlight-overlay" />
      
      {/* Cutout hole for the highlighted element */}
      <div 
        ref={holeRef}
        className="spotlight-hole"
        style={{
          top: targetRect.top - highlightPadding,
          left: targetRect.left - highlightPadding,
          width: targetRect.width + (highlightPadding * 2),
          height: targetRect.height + (highlightPadding * 2),
        }}
      />
      
      {/* Speech bubble with description */}
      <div style={{ 
        position: 'absolute', 
        top: bubblePosition.top, 
        left: bubblePosition.left,
        zIndex: 50,
        width: 'fit-content',
        maxWidth: '300px',
      }}>
        <SpeechBubble
          message={message}
          position={position}
          onClose={onClose}
          onAction={onAction}
          actionLabel={actionLabel}
          showMascot={showMascot}
          mascotEmotion={mascotEmotion}
          showClose={true}
        />
      </div>
    </div>,
    document.body
  );
};

export default FeatureSpotlight;