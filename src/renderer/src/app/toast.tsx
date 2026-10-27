import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { DURATION, EASE_OUT } from "@/shared/motion";
import styles from "./styles.module.css";

/**
 * One short message at the bottom of the window, such as a save that failed.
 * It goes away after four seconds, or stays while the pointer is on it. It
 * rises from the bottom edge (Motion row "Toast after Export"); a second
 * message replaces the first in place instead of stacking.
 */
export function useToast(): {
  toast: React.ReactNode;
  showToast: (message: string) => void;
} {
  const [message, setMessage] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const counter = useRef(0);
  const [shownAt, setShownAt] = useState(0);

  const showToast = useCallback((next: string) => {
    counter.current += 1;
    setShownAt(counter.current);
    setMessage(next);
  }, []);

  useEffect(() => {
    if (message === null || isHovered || shownAt === 0) return;
    const timer = setTimeout(() => setMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [message, isHovered, shownAt]);

  const toast = (
    <div className={styles.toastRegion} role="status" aria-live="polite">
      <AnimatePresence>
        {message && (
          <motion.div
            key="toast"
            className={styles.toast}
            initial={{ y: "100%", opacity: 0 }}
            animate={{
              y: 0,
              opacity: 1,
              transition: { duration: DURATION.slow, ease: EASE_OUT },
            }}
            exit={{
              y: "100%",
              opacity: 0,
              transition: { duration: DURATION.base, ease: EASE_OUT },
            }}
            onPointerEnter={() => setIsHovered(true)}
            onPointerLeave={() => setIsHovered(false)}
          >
            {message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
  return { toast, showToast };
}
