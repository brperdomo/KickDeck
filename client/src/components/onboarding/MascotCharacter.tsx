import React from 'react';
import './onboarding.css';

// Define available emotions for the mascot
export type MascotEmotion = 'excited' | 'thinking' | 'waving' | 'pointing' | 'surprised';

interface MascotCharacterProps {
  emotion?: MascotEmotion;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// SVG mascot character component with different emotional states
const MascotCharacter: React.FC<MascotCharacterProps> = ({
  emotion = 'excited',
  size = 'md',
  className = '',
}) => {
  // Determine size dimensions based on prop
  const getSizeStyle = () => {
    switch (size) {
      case 'sm':
        return { width: '60px', height: '60px' };
      case 'lg':
        return { width: '160px', height: '160px' };
      case 'md':
      default:
        return { width: '120px', height: '120px' };
    }
  };
  
  // Determine emotion-specific classes or animations
  const getEmotionClass = () => {
    switch (emotion) {
      case 'excited':
        return 'animate-bounce-mascot';
      case 'waving':
        return 'animate-wave';
      case 'thinking':
      case 'pointing':
      case 'surprised':
      default:
        return '';
    }
  };
  
  // Render the appropriate SVG based on the selected emotion
  const renderMascot = () => {
    switch (emotion) {
      case 'excited':
        return (
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            {/* Soccer ball mascot excited */}
            <circle cx="100" cy="100" r="80" fill="white" stroke="black" strokeWidth="3" />
            <path d="M100,20 L120,40 L140,30 L130,60 L150,80 L120,80 L100,100 L80,80 L50,80 L70,60 L60,30 L80,40 Z" fill="black" />
            <circle cx="70" cy="80" r="10" fill="white" />
            <circle cx="130" cy="80" r="10" fill="white" />
            <circle cx="70" cy="80" r="5" fill="black" />
            <circle cx="130" cy="80" r="5" fill="black" />
            <path d="M70,120 Q100,150 130,120" fill="none" stroke="black" strokeWidth="3" />
          </svg>
        );
      case 'thinking':
        return (
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            {/* Soccer ball mascot thinking */}
            <circle cx="100" cy="100" r="80" fill="white" stroke="black" strokeWidth="3" />
            <path d="M100,20 L120,40 L140,30 L130,60 L150,80 L120,80 L100,100 L80,80 L50,80 L70,60 L60,30 L80,40 Z" fill="black" />
            <circle cx="70" cy="80" r="10" fill="white" />
            <circle cx="130" cy="80" r="10" fill="white" />
            <circle cx="70" cy="80" r="5" fill="black" />
            <circle cx="130" cy="80" r="5" fill="black" transform="rotate(20 130 80)" />
            <path d="M80,120 Q100,125 120,120" fill="none" stroke="black" strokeWidth="3" />
            <circle cx="150" cy="60" r="15" fill="white" stroke="black" strokeWidth="2" />
            <circle cx="160" cy="40" r="10" fill="white" stroke="black" strokeWidth="2" />
          </svg>
        );
      case 'waving':
        return (
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            {/* Soccer ball mascot waving */}
            <circle cx="100" cy="100" r="80" fill="white" stroke="black" strokeWidth="3" />
            <path d="M100,20 L120,40 L140,30 L130,60 L150,80 L120,80 L100,100 L80,80 L50,80 L70,60 L60,30 L80,40 Z" fill="black" />
            <circle cx="70" cy="80" r="10" fill="white" />
            <circle cx="130" cy="80" r="10" fill="white" />
            <circle cx="70" cy="80" r="5" fill="black" />
            <circle cx="130" cy="80" r="5" fill="black" />
            <path d="M70,120 Q100,140 130,120" fill="none" stroke="black" strokeWidth="3" />
            <path d="M150,50 Q170,40 180,50 Q190,60 180,70 Q170,80 160,70 Q150,60 150,50 Z" fill="white" stroke="black" strokeWidth="2" />
          </svg>
        );
      case 'pointing':
        return (
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            {/* Soccer ball mascot pointing */}
            <circle cx="100" cy="100" r="80" fill="white" stroke="black" strokeWidth="3" />
            <path d="M100,20 L120,40 L140,30 L130,60 L150,80 L120,80 L100,100 L80,80 L50,80 L70,60 L60,30 L80,40 Z" fill="black" />
            <circle cx="70" cy="80" r="10" fill="white" />
            <circle cx="130" cy="80" r="10" fill="white" />
            <circle cx="70" cy="80" r="5" fill="black" />
            <circle cx="130" cy="80" r="5" fill="black" />
            <path d="M80,120 Q100,130 120,120" fill="none" stroke="black" strokeWidth="3" />
            <path d="M160,100 L180,60" fill="none" stroke="black" strokeWidth="3" />
            <circle cx="180" cy="55" r="5" fill="white" stroke="black" strokeWidth="2" />
          </svg>
        );
      case 'surprised':
        return (
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            {/* Soccer ball mascot surprised */}
            <circle cx="100" cy="100" r="80" fill="white" stroke="black" strokeWidth="3" />
            <path d="M100,20 L120,40 L140,30 L130,60 L150,80 L120,80 L100,100 L80,80 L50,80 L70,60 L60,30 L80,40 Z" fill="black" />
            <circle cx="70" cy="80" r="12" fill="white" />
            <circle cx="130" cy="80" r="12" fill="white" />
            <circle cx="70" cy="80" r="5" fill="black" />
            <circle cx="130" cy="80" r="5" fill="black" />
            <circle cx="100" cy="120" r="15" fill="none" stroke="black" strokeWidth="3" />
          </svg>
        );
      default:
        return (
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            {/* Default soccer ball mascot */}
            <circle cx="100" cy="100" r="80" fill="white" stroke="black" strokeWidth="3" />
            <path d="M100,20 L120,40 L140,30 L130,60 L150,80 L120,80 L100,100 L80,80 L50,80 L70,60 L60,30 L80,40 Z" fill="black" />
            <circle cx="70" cy="80" r="10" fill="white" />
            <circle cx="130" cy="80" r="10" fill="white" />
            <circle cx="70" cy="80" r="5" fill="black" />
            <circle cx="130" cy="80" r="5" fill="black" />
            <path d="M70,120 Q100,140 130,120" fill="none" stroke="black" strokeWidth="3" />
          </svg>
        );
    }
  };
  
  // Combining size, emotion class, and any additional classes
  const combinedClasses = `mascot-character ${getEmotionClass()} ${className}`;
  
  return (
    <div 
      className={combinedClasses} 
      style={getSizeStyle()}
      aria-label={`Mascot with ${emotion} emotion`}
    >
      {renderMascot()}
    </div>
  );
};

export default MascotCharacter;