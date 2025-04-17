import React from 'react';
import { Link, useLocation } from 'wouter';

export function Footer() {
  const currentYear = new Date().getFullYear();
  const [location] = useLocation();
  
  // Don't show footer on admin routes
  if (location.startsWith('/admin')) {
    return null;
  }
  
  return (
    <footer className="py-4 px-6 text-center text-sm border-t mt-auto relative z-10">
      <div className="container mx-auto flex flex-col items-center justify-center gap-2">
        <p className={location.includes('/auth') || location.includes('/register') || location.includes('/forgot-password') ? 'text-[#3d3a98]' : 'text-gray-600'}>
          Powered by <Link href="https://matchpro.ai" className={`font-semibold ${location.includes('/auth') || location.includes('/register') || location.includes('/forgot-password') ? 'text-[#3d3a98] hover:text-[#2d2a88]' : 'text-primary hover:underline'}`}>MatchPro</Link>
        </p>
        <p className={location.includes('/auth') || location.includes('/register') || location.includes('/forgot-password') ? 'text-[#3d3a98]' : 'text-gray-600'}>
          &copy; {currentYear} MatchPro. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

export default Footer;