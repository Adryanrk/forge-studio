"use client";

import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Stagger delay in seconds, useful for grids of cards. */
  delay?: number;
  /** Horizontal/vertical rise distance in px before settling. */
  distance?: number;
}

const baseVariants: Variants = {
  hidden: { opacity: 0, y: 28, filter: "blur(6px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)" },
};

/**
 * Fade + slight rise on scroll into view — the same reveal language as the
 * hero's per-letter blur-up, toned down for regular content sections.
 */
export function Reveal({ children, className, delay = 0, distance }: RevealProps) {
  const variants: Variants = distance
    ? {
        hidden: { opacity: 0, y: distance, filter: "blur(6px)" },
        visible: { opacity: 1, y: 0, filter: "blur(0px)" },
      }
    : baseVariants;

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-10% 0px -10% 0px" }}
      variants={variants}
      transition={{ duration: 0.8, delay, ease: [0.25, 1, 0.5, 1] }}
    >
      {children}
    </motion.div>
  );
}
