import React from 'react';
import ReactMarkdown from 'react-markdown';
import { XCircle } from 'lucide-react';
import MascotCharacter, { MascotEmotion } from './MascotCharacter';
import './onboarding.css';

interface SpeechBubbleProps {
  message: string;
  position?: 'top' | 'right' | 'bottom' | 'left';
  actionLabel?: string;
  onAction?: () => void;
  onClose?: () => void;
  showClose?: boolean;
  showMascot?: boolean;
  mascotEmotion?: MascotEmotion;
  width?: string | number;
  maxHeight?: string | number;
}

const SpeechBubble: React.FC<SpeechBubbleProps> = ({
  message,
  position = 'top',
  actionLabel,
  onAction,
  onClose,
  showClose = true,
  showMascot = true,
  mascotEmotion = 'excited',
  width = 300,
  maxHeight = 'none',
}) => {
  // Style for the bubble wrapper
  const bubbleStyle: React.CSSProperties = {
    position: 'relative',
    width: typeof width === 'number' ? `${width}px` : width,
    maxHeight: maxHeight,
    overflow: maxHeight !== 'none' ? 'auto' : 'visible',
  };
  
  // Style for the speech bubble with appropriate arrow
  const speechBubbleStyle: React.CSSProperties = {
    backgroundColor: 'white',
    color: '#333',
    padding: '16px',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    position: 'relative',
    zIndex: 2,
  };
  
  // Add arrow based on position
  const arrowStyle: React.CSSProperties = {
    position: 'absolute',
    width: '20px',
    height: '20px',
    backgroundColor: 'white',
    transform: 'rotate(45deg)',
    zIndex: 1,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  };
  
  // Calculate arrow position based on bubble position
  switch (position) {
    case 'top':
      arrowStyle.bottom = '-10px';
      arrowStyle.left = '50%';
      arrowStyle.marginLeft = '-10px';
      break;
    case 'right':
      arrowStyle.left = '-10px';
      arrowStyle.top = '50%';
      arrowStyle.marginTop = '-10px';
      break;
    case 'bottom':
      arrowStyle.top = '-10px';
      arrowStyle.left = '50%';
      arrowStyle.marginLeft = '-10px';
      break;
    case 'left':
      arrowStyle.right = '-10px';
      arrowStyle.top = '50%';
      arrowStyle.marginTop = '-10px';
      break;
  }
  
  return (
    <div style={bubbleStyle} className="fade-in">
      <div style={speechBubbleStyle}>
        {/* Close button */}
        {showClose && onClose && (
          <button 
            onClick={onClose}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-800 transition-colors"
            aria-label="Close"
          >
            <XCircle size={18} />
          </button>
        )}
        
        {/* Content */}
        <div className="flex gap-4">
          {/* Mascot character */}
          {showMascot && (
            <div className="flex-shrink-0">
              <MascotCharacter emotion={mascotEmotion} size="sm" />
            </div>
          )}
          
          {/* Message content with markdown support */}
          <div className="flex-grow">
            <div className="prose prose-sm max-w-none mb-4">
              <ReactMarkdown>
                {message}
              </ReactMarkdown>
            </div>
            
            {/* Action button */}
            {actionLabel && onAction && (
              <button
                onClick={onAction}
                className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md text-sm font-medium transition-colors"
                aria-label={actionLabel}
              >
                {actionLabel}
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Arrow */}
      <div style={arrowStyle} />
      
      {/* Optional styled content */}
      <style>
        {`
          .prose h1, .prose h2, .prose h3, .prose h4 {
            margin-top: 0.5em;
            margin-bottom: 0.5em;
          }
          .prose p {
            margin-top: 0.5em;
            margin-bottom: 0.5em;
          }
          .prose ul, .prose ol {
            margin-top: 0.5em;
            margin-bottom: 0.5em;
            padding-left: 1.5em;
          }
        `}
      </style>
    </div>
  );
};

export default SpeechBubble;