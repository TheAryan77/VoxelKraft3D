"use client";
// Aceternity UI — Text Generate Effect, restyled: muted body text, words
// sharpen in one after another. Renders statically under reduced motion.
import { useEffect } from "react";
import { motion, stagger, useAnimate, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export const TextGenerateEffect = ({
  words,
  className,
  filter = true,
  duration = 0.5,
  wordStagger = 0.12,
  play = true,
}: {
  words: string;
  className?: string;
  filter?: boolean;
  duration?: number;
  wordStagger?: number;
  /** Starts the effect. Until then the text is invisible but keeps its space. */
  play?: boolean;
}) => {
  const [scope, animate] = useAnimate();
  const reduced = useReducedMotion();
  const wordsArray = words.split(" ");

  useEffect(() => {
    if (!play || reduced) return;
    animate(
      "span",
      { opacity: 1, filter: filter ? "blur(0px)" : "none" },
      { duration, delay: stagger(wordStagger) },
    );
  }, [play, reduced, animate, filter, duration, wordStagger]);

  return (
    <p ref={scope} className={cn("text-text-muted", className)}>
      {wordsArray.map((word, idx) => (
        <motion.span
          key={word + idx}
          className={reduced ? undefined : "opacity-0"}
          style={{ filter: filter && !reduced ? "blur(8px)" : "none" }}
        >
          {word}{" "}
        </motion.span>
      ))}
    </p>
  );
};
