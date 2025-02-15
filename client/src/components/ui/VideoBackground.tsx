import { cn } from "@/lib/utils";

interface VideoBackgroundProps {
  className?: string;
}

export function VideoBackground({ className }: VideoBackgroundProps) {
  return (
    <div className={cn("fixed inset-0", className)}>
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute top-0 left-0 min-w-full min-h-full w-auto h-auto object-cover"
      >
        <source src="/videos/soccer1.mp4" type="video/mp4" />
        <source src="/videos/soccer2.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-black/10" />
    </div>
  );
}