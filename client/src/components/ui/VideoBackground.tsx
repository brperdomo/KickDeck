import { cn } from "@/lib/utils";

interface VideoBackgroundProps {
  className?: string;
}

export function VideoBackground({ className }: VideoBackgroundProps) {
  return (
    <div className={cn("fixed inset-0 -z-10 overflow-hidden", className)}>
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover"
      >
        <source src="/videos/soccer1.mp4" type="video/mp4" />
        <source src="/videos/soccer2.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-black/30" /> {/* Darker overlay for better text readability */}
    </div>
  );
}