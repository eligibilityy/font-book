import { Dialog } from "@base-ui/react/dialog";
import { useRef } from "react";
import bookIcon from "@/shared/ui/book-icon.svg";
import { dedication } from "../../words";
import styles from "./styles.module.css";

interface DedicationPageProps {
  open: boolean;
  /** The very first launch: the lines arrive slowly, one after another, once. */
  isFirstTime: boolean;
  version: string;
  onClose: () => void;
}

/**
 * About Book, and the dedication. It opens by itself once, the first time she
 * launches Book, and again from About Book in the menu.
 */
export function DedicationPage({
  open,
  isFirstTime,
  version,
  onClose,
}: DedicationPageProps): React.JSX.Element {
  const pageRef = useRef<HTMLDivElement | null>(null);
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop
          className={styles.backdrop}
          data-first-time={isFirstTime ? "" : undefined}
        />
        <Dialog.Popup
          ref={pageRef}
          className={styles.page}
          // Focus the page itself, so Close doesn't open wearing a focus ring;
          // Tab still reaches it, and Escape closes.
          initialFocus={pageRef}
          data-first-time={isFirstTime ? "" : undefined}
        >
          <p className={`${styles.line} ${styles.book}`}>
            <img className={styles.icon} src={bookIcon} alt="" />
            Book
          </p>
          <Dialog.Title className={`${styles.line} ${styles.to}`}>
            For {dedication.to}
          </Dialog.Title>
          <Dialog.Description className={`${styles.line} ${styles.message}`}>
            {dedication.message}
          </Dialog.Description>
          <div className={`${styles.line} ${styles.closing}`}>
            {dedication.signature && (
              // Drawn through a mask, so the signature takes the ink colour in
              // light and dark mode alike.
              <span
                className={styles.signature}
                role="img"
                aria-label="Signature"
                style={{ maskImage: `url("${dedication.signature}")` }}
              />
            )}
            <p className={styles.number}>{dedication.number}</p>
          </div>
          <footer className={styles.footer}>
            <span>Version {version}</span>
            <Dialog.Close className={styles.close}>Close</Dialog.Close>
          </footer>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
