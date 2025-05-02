import React from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';

/**
 * Hero section component for the landing page
 * This is the main section that visitors see first
 */
const LandingHero = () => {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32 xl:py-40 bg-slate-50">
      <div className="container px-4 md:px-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
          <div className="flex flex-col justify-center space-y-4">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                Simplify Soccer Tournament Management
              </h1>
              <p className="max-w-[600px] text-gray-500 md:text-xl dark:text-gray-400">
                MatchPro.ai combines AI-powered automation with intuitive tools to help you manage tournaments, teams, 
                and facilities with unmatched efficiency.
              </p>
            </div>
            <div className="flex flex-col gap-2 min-[400px]:flex-row">
              <Link href="/register">
                <Button size="lg" className="gap-1">
                  Get Started <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="#features">
                <Button size="lg" variant="outline">
                  Learn More
                </Button>
              </Link>
            </div>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span>Modern Interface</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span>AI-Powered</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span>24/7 Support</span>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <div className="relative w-full h-[420px] overflow-hidden rounded-xl border bg-gradient-to-b from-primary/20 to-primary/10 p-4 shadow-xl">
              <div className="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-sm">
                <div className="relative h-72 w-72">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg
                      className="h-full w-full text-primary/40"
                      viewBox="0 0 200 200"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fill="currentColor"
                        d="M44.3,-76.5C59.1,-70.2,74,-61.5,83.3,-47.8C92.6,-34.2,96.2,-17.1,94.8,-1C93.3,15.1,86.9,30.1,77.7,43.2C68.5,56.2,56.5,67.2,42.6,74.7C28.7,82.2,14.3,86.2,-0.6,87.2C-15.5,88.2,-31,86.3,-43.1,78.7C-55.1,71.1,-63.8,57.9,-71.6,44.3C-79.4,30.7,-86.4,16.3,-88.2,0.9C-90,-14.5,-86.6,-29,-79.1,-40.7C-71.5,-52.4,-59.8,-61.3,-46.6,-68.5C-33.4,-75.7,-16.7,-81.1,-0.2,-80.7C16.2,-80.3,29.5,-82.9,44.3,-76.5Z"
                        transform="translate(100 100)"
                      />
                    </svg>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <img
                      src="/public/logo.png"
                      alt="MatchPro.ai"
                      className="h-[40%] w-auto object-contain relative z-10"
                      onError={(e) => {
                        // Fallback to a blue hexagon if image doesn't load
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  </div>
                </div>
              </div>
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-lg bg-white/90 p-4 shadow-lg backdrop-blur-sm">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Get Started Today</p>
                  <p className="text-xs text-gray-500">Setup in minutes, not days</p>
                </div>
                <Link href="/register">
                  <Button size="sm">Try Now</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingHero;