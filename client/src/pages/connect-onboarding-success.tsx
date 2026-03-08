import { useEffect, useState, useRef } from 'react';
import { useLocation } from 'wouter';
import { AnimatedBackground } from '@/components/ui/AnimatedBackground';
import { Button } from '@/components/ui/button';
import { CheckCircle, PartyPopper, Sparkles, ArrowRight, Shield, X } from 'lucide-react';

/**
 * Stripe Connect Onboarding Success Page
 *
 * Shown after a tournament organizer completes the Stripe Connect
 * onboarding flow. This is the return_url that Stripe redirects to.
 * The page celebrates the milestone and tells the user they can
 * close the tab or navigate back to the event Banking settings.
 */
export default function ConnectOnboardingSuccess() {
  const [, navigate] = useLocation();
  const [showContent, setShowContent] = useState(false);
  const [showCheckmark, setShowCheckmark] = useState(false);
  const [showTitle, setShowTitle] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showButtons, setShowButtons] = useState(false);
  const [confettiPieces, setConfettiPieces] = useState<ConfettiPiece[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Extract eventId from URL path: /admin/events/:eventId/settings
  const pathMatch = window.location.pathname.match(/\/admin\/events\/(\d+)\//);
  const eventId = pathMatch?.[1];

  // Staggered entrance animations
  useEffect(() => {
    const timers = [
      setTimeout(() => setShowContent(true), 200),
      setTimeout(() => setShowCheckmark(true), 600),
      setTimeout(() => setShowTitle(true), 1000),
      setTimeout(() => setShowDetails(true), 1500),
      setTimeout(() => setShowButtons(true), 2000),
      setTimeout(() => launchConfetti(), 800),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  // Confetti burst effect
  function launchConfetti() {
    const colors = [
      '#a855f7', '#6366f1', '#ec4899', '#06b6d4',
      '#f59e0b', '#10b981', '#f43f5e', '#8b5cf6',
      '#14b8a6', '#f97316', '#eab308', '#22d3ee',
    ];
    const pieces: ConfettiPiece[] = [];
    for (let i = 0; i < 80; i++) {
      pieces.push({
        id: i,
        x: 50 + (Math.random() - 0.5) * 10,
        y: 40,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        scale: Math.random() * 0.6 + 0.4,
        velocityX: (Math.random() - 0.5) * 120,
        velocityY: -(Math.random() * 60 + 30),
        shape: Math.random() > 0.5 ? 'circle' : 'rect',
        delay: Math.random() * 0.4,
      });
    }
    setConfettiPieces(pieces);
  }

  return (
    <div ref={containerRef} className="relative min-h-screen overflow-hidden flex items-center justify-center">
      {/* Synthwave background */}
      <AnimatedBackground type="neon" speed="medium" />

      {/* Confetti layer */}
      <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
        {confettiPieces.map((piece) => (
          <div
            key={piece.id}
            className="absolute animate-confetti-fall"
            style={{
              left: `${piece.x}%`,
              top: `${piece.y}%`,
              animationDelay: `${piece.delay}s`,
              '--vx': `${piece.velocityX}px`,
              '--vy': `${piece.velocityY}px`,
              '--rot': `${piece.rotation}deg`,
            } as React.CSSProperties}
          >
            {piece.shape === 'circle' ? (
              <div
                className="rounded-full"
                style={{
                  width: `${8 * piece.scale}px`,
                  height: `${8 * piece.scale}px`,
                  backgroundColor: piece.color,
                  boxShadow: `0 0 6px ${piece.color}80`,
                }}
              />
            ) : (
              <div
                style={{
                  width: `${10 * piece.scale}px`,
                  height: `${6 * piece.scale}px`,
                  backgroundColor: piece.color,
                  borderRadius: '1px',
                  boxShadow: `0 0 6px ${piece.color}80`,
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Main content card */}
      <div
        className={`relative z-20 w-full max-w-lg mx-4 transition-all duration-700 ease-out ${
          showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <div className="relative backdrop-blur-xl bg-black/40 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
          {/* Top glow accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500" />

          {/* Ambient glow behind card */}
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-80 h-40 bg-purple-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-60 h-30 bg-cyan-500/10 rounded-full blur-3xl" />

          <div className="relative p-8 md:p-10 text-center space-y-6">
            {/* Animated checkmark */}
            <div
              className={`transition-all duration-700 ease-out ${
                showCheckmark ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
              }`}
            >
              <div className="relative mx-auto w-24 h-24">
                {/* Pulsing ring */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-green-400/30 to-emerald-600/30 animate-ping" style={{ animationDuration: '2s' }} />
                {/* Spinning ring */}
                <div className="absolute inset-1 rounded-full border-2 border-transparent border-t-green-400 border-r-emerald-500 animate-spin" style={{ animationDuration: '3s' }} />
                {/* Inner glow */}
                <div className="absolute inset-2 rounded-full bg-gradient-to-br from-green-400/20 to-emerald-600/20 backdrop-blur-sm" />
                {/* Check icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <CheckCircle className="w-12 h-12 text-green-400 drop-shadow-[0_0_12px_rgba(74,222,128,0.6)]" />
                </div>
              </div>
            </div>

            {/* Title */}
            <div
              className={`transition-all duration-700 delay-100 ease-out ${
                showTitle ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <PartyPopper className="w-5 h-5 text-yellow-400 animate-bounce" />
                <span className="text-sm font-semibold uppercase tracking-widest text-purple-300">
                  Setup Complete
                </span>
                <PartyPopper className="w-5 h-5 text-yellow-400 animate-bounce" style={{ animationDelay: '0.3s' }} />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white via-purple-100 to-cyan-200 bg-clip-text text-transparent leading-tight">
                Banking Connected!
              </h1>
            </div>

            {/* Description */}
            <div
              className={`transition-all duration-700 delay-200 ease-out space-y-4 ${
                showDetails ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              <p className="text-gray-300 text-base leading-relaxed">
                Your Stripe account has been successfully linked. You're all set to receive tournament registration payouts.
              </p>

              {/* Feature badges */}
              <div className="flex flex-wrap justify-center gap-3 pt-1">
                <FeatureBadge icon={<Shield className="w-3.5 h-3.5" />} text="Secure Payouts" color="green" />
                <FeatureBadge icon={<Sparkles className="w-3.5 h-3.5" />} text="Instant Setup" color="purple" />
                <FeatureBadge icon={<CheckCircle className="w-3.5 h-3.5" />} text="Verified" color="cyan" />
              </div>

              {/* Info box */}
              <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-400 leading-relaxed">
                Registration payments will be deposited directly into your bank account. You can manage payouts and view transaction history from your event's Banking tab.
              </div>
            </div>

            {/* Action buttons */}
            <div
              className={`transition-all duration-700 delay-300 ease-out pt-2 space-y-3 ${
                showButtons ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              {eventId && (
                <Button
                  onClick={() => navigate(`/admin/events/${eventId}/edit`)}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold py-6 text-base rounded-xl shadow-lg shadow-purple-500/20 transition-all hover:shadow-purple-500/30 hover:scale-[1.02]"
                >
                  Go to Event Settings
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
              <Button
                variant="ghost"
                onClick={() => window.close()}
                className="w-full text-gray-400 hover:text-white hover:bg-white/5 py-5 rounded-xl"
              >
                <X className="w-4 h-4 mr-2" />
                Close This Tab
              </Button>
            </div>
          </div>
        </div>

        {/* Subtle bottom text */}
        <p className="text-center text-xs text-gray-500 mt-4">
          Powered by KickDeck & Stripe Connect
        </p>
      </div>

      {/* Global keyframe styles for confetti */}
      <style>{`
        @keyframes confetti-fall {
          0% {
            transform: translate(0, 0) rotate(0deg);
            opacity: 1;
          }
          15% {
            transform: translate(calc(var(--vx) * 0.4), calc(var(--vy) * 1.2)) rotate(calc(var(--rot) * 0.5));
            opacity: 1;
          }
          100% {
            transform: translate(var(--vx), 300px) rotate(var(--rot));
            opacity: 0;
          }
        }
        .animate-confetti-fall {
          animation: confetti-fall 2.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
      `}</style>
    </div>
  );
}

function FeatureBadge({ icon, text, color }: { icon: React.ReactNode; text: string; color: 'green' | 'purple' | 'cyan' }) {
  const colorClasses = {
    green: 'text-green-400 bg-green-400/10 border-green-400/20',
    purple: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
    cyan: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${colorClasses[color]}`}>
      {icon}
      {text}
    </span>
  );
}

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  color: string;
  rotation: number;
  scale: number;
  velocityX: number;
  velocityY: number;
  shape: 'circle' | 'rect';
  delay: number;
}
