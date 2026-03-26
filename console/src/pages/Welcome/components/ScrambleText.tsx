import { useEffect, useRef } from "react";

interface ScrambleTextProps {
  text: string;
  className?: string;
  trigger?: boolean;
  onComplete?: () => void;
}

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*<>[]{}|";

export default function ScrambleText({
  text,
  className = "",
  trigger = true,
  onComplete
}: ScrambleTextProps) {
  const textRef = useRef<HTMLSpanElement>(null);
  const intervalRef = useRef<number>();

  useEffect(() => {
    if (!trigger || !textRef.current) return;

    const element = textRef.current;
    let iteration = 0;
    const targetText = text;
    const steps = targetText.length;
    const duration = 600;
    const intervalTime = duration / steps;

    clearInterval(intervalRef.current);

    intervalRef.current = window.setInterval(() => {
      element.innerText = targetText.split("").map((letter, index) => {
        if (index < iteration) return targetText[index];
        if (targetText[index] === " ") return " ";
        return CHARS[Math.floor(Math.random() * CHARS.length)];
      }).join("");

      if (iteration >= targetText.length) {
        clearInterval(intervalRef.current);
        element.innerText = targetText;
        onComplete?.();
      }

      iteration += 1 / 2;
    }, intervalTime);

    return () => {
      clearInterval(intervalRef.current);
    };
  }, [text, trigger, onComplete]);

  return <span ref={textRef} className={className}>{text}</span>;
}
