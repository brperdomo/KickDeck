import React from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

/**
 * Pricing section for the landing page
 * Shows available pricing plans and features
 */
const LandingPricing = () => {
  const plans = [
    {
      name: "Basic",
      price: "$99",
      period: "per month",
      description: "Ideal for small clubs and organizations",
      features: [
        "Up to 20 teams",
        "Basic scheduling tools",
        "Team registration",
        "Email notifications",
        "Standard support",
        "1 admin user"
      ],
      cta: "Get Started",
      isPopular: false,
      variant: "outline"
    },
    {
      name: "Pro",
      price: "$249",
      period: "per month",
      description: "Perfect for growing leagues and tournaments",
      features: [
        "Up to 100 teams",
        "AI-powered scheduling",
        "Custom registration forms",
        "Payment processing",
        "Priority support",
        "5 admin users"
      ],
      cta: "Get Started",
      isPopular: true,
      variant: "default"
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "pricing",
      description: "For large organizations with complex needs",
      features: [
        "Unlimited teams",
        "Advanced AI scheduling",
        "Custom integrations",
        "Data analytics",
        "24/7 premium support",
        "Unlimited admin users"
      ],
      cta: "Contact Sales",
      isPopular: false,
      variant: "outline"
    }
  ];

  return (
    <section className="w-full py-12 md:py-24 lg:py-32" id="pricing">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm text-primary">
              Pricing
            </div>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
              Choose the Right Plan for Your Organization
            </h2>
            <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
              Affordable solutions for organizations of all sizes. All plans include core MatchPro.ai features.
            </p>
          </div>
        </div>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 lg:grid-cols-3">
          {plans.map((plan, index) => (
            <div 
              key={index} 
              className={`flex flex-col rounded-lg border ${plan.isPopular ? 'border-primary shadow-lg' : ''} p-6 space-y-6`}
            >
              {plan.isPopular && (
                <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary w-fit">
                  Most Popular
                </div>
              )}
              <div>
                <h3 className="text-2xl font-bold">{plan.name}</h3>
                <div className="mt-2 flex items-baseline">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="ml-1 text-sm text-gray-500">/{plan.period}</span>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  {plan.description}
                </p>
              </div>
              <ul className="space-y-2 text-sm">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center">
                    <Check className="mr-2 h-4 w-4 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-auto pt-4">
                <Link href={plan.name === "Enterprise" ? "/#contact" : "/register"}>
                  <Button 
                    className="w-full" 
                    variant={plan.isPopular ? "default" : "outline"}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-gray-500">
            All plans include a 14-day free trial. No credit card required to start.
            Need a custom solution? <Link href="/#contact" className="text-primary hover:underline">Contact our sales team</Link>.
          </p>
        </div>
      </div>
    </section>
  );
};

export default LandingPricing;