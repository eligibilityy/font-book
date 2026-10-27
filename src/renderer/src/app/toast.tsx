import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./styles.module.css";

/**
 * One short message at the bottom of the window, such as a save that failed.
 * It goes away after four seconds, or stays while the pointer is on it.
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
      {message && (
        <div
          className={styles.toast}
          onPointerEnter={() => setIsHovered(true)}
          onPointerLeave={() => setIsHovered(false)}
        >
          {message}
        </div>
      )}
    </div>
  );
  return { toast, showToast };
}
