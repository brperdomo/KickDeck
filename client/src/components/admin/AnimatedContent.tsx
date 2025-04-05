import { motion } from "framer-motion";
import React from "react";

interface AnimatedContentProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export function AnimatedContent({ 
  children, 
  delay = 0.2, 
  className = "flex-1 overflow-auto"
}: AnimatedContentProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: 0.4,
        ease: "easeOut",
        delay
      }}
    >
      {children}
    </motion.div>
  );
}