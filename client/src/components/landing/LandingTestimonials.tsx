import React from 'react';
import { 
  Star,
  Quote 
} from 'lucide-react';

/**
 * Testimonials section for the landing page
 * Shows customer quotes and reviews
 */
const LandingTestimonials = () => {
  const testimonials = [
    {
      quote: "MatchPro.ai transformed how we manage our youth soccer league. The AI scheduling alone saved us countless hours of work.",
      author: "Sarah Johnson",
      title: "Tournament Director",
      organization: "Youth Soccer Association"
    },
    {
      quote: "The team registration process is seamless, and our coaches love the intuitive interface. It's been a game-changer for our club.",
      author: "Michael Rodriguez",
      title: "Club President",
      organization: "Metro FC"
    },
    {
      quote: "We've reduced administrative work by 70% since implementing MatchPro. Their customer support team is also incredibly responsive.",
      author: "David Chen",
      title: "League Administrator",
      organization: "Regional Soccer League"
    }
  ];

  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-slate-50" id="testimonials">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm text-primary">
              Testimonials
            </div>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
              Trusted by Soccer Organizations
            </h2>
            <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
              See what tournament directors, club presidents, and league administrators are saying about MatchPro.ai.
            </p>
          </div>
        </div>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <div 
              key={index} 
              className="flex flex-col justify-between space-y-4 rounded-lg border p-6 shadow-sm"
            >
              <div className="space-y-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>
                <div className="relative pl-6">
                  <Quote className="absolute left-0 top-0 h-4 w-4 text-primary/60" />
                  <p className="text-muted-foreground">
                    "{testimonial.quote}"
                  </p>
                </div>
              </div>
              <div>
                <div className="font-semibold">{testimonial.author}</div>
                <div className="text-sm text-muted-foreground">
                  {testimonial.title}, {testimonial.organization}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LandingTestimonials;