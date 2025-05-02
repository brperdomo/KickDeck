import React from 'react';
import { 
  Calendar, 
  Users, 
  Map, 
  Brain, 
  CreditCard, 
  ClipboardList, 
  Clock, 
  Shield 
} from 'lucide-react';

/**
 * Features section for the landing page
 * Showcases the key features of the MatchPro platform
 */
const LandingFeatures = () => {
  const features = [
    {
      icon: <Calendar className="h-8 w-8 text-primary" />,
      title: "Smart Scheduling",
      description: "AI-powered tournament scheduling optimizes field usage and minimizes conflicts."
    },
    {
      icon: <Users className="h-8 w-8 text-primary" />,
      title: "Team Management",
      description: "Comprehensive tools for managing teams, players, and registrations with ease."
    },
    {
      icon: <Map className="h-8 w-8 text-primary" />,
      title: "Facility Management",
      description: "Track and manage fields, complexes, and resources efficiently."
    },
    {
      icon: <Brain className="h-8 w-8 text-primary" />,
      title: "AI-Driven Insights",
      description: "Get intelligent recommendations and data-driven insights for better decisions."
    },
    {
      icon: <CreditCard className="h-8 w-8 text-primary" />,
      title: "Payment Processing",
      description: "Secure, integrated payment processing for registrations and fees."
    },
    {
      icon: <ClipboardList className="h-8 w-8 text-primary" />,
      title: "Custom Forms",
      description: "Create tailored registration forms and collect exactly the data you need."
    },
    {
      icon: <Clock className="h-8 w-8 text-primary" />,
      title: "Time-Saving Automation",
      description: "Automate repetitive tasks to focus on what matters most."
    },
    {
      icon: <Shield className="h-8 w-8 text-primary" />,
      title: "Secure & Reliable",
      description: "Enterprise-grade security to protect sensitive player and payment information."
    }
  ];

  return (
    <section className="w-full py-12 md:py-24 lg:py-32" id="features">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm text-primary">
              Features
            </div>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
              Powerful Tools for Tournament Management
            </h2>
            <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
              MatchPro.ai combines cutting-edge technology with intuitive design to streamline every aspect of soccer tournament management.
            </p>
          </div>
        </div>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="flex flex-col items-center space-y-2 rounded-lg border p-4 shadow-sm transition-all hover:shadow-md"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full border bg-background">
                {feature.icon}
              </div>
              <h3 className="text-lg font-bold">{feature.title}</h3>
              <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LandingFeatures;