import { AlertDialog } from "@base-ui/react/alert-dialog";
import type { StoredData } from "@shared/contracts/storage";
import { useState } from "react";
import controls from "@/shared/ui/controls.module.css";

/**
 * Tells her once, at launch, if her Collections file couldn't be read and was
 * set aside. Her Font files are never touched.
 */
export function StoredFileNotice({
  stored,
}: {
  stored: StoredData;
}): React.JSX.Element | null {
  const state = stored.collections.state;
  const [open, setOpen] = useState(state.status === "set-aside");
  if (state.status !== "set-aside") return null;

  return (
    <AlertDialog.Root open={open} onOpenChange={setOpen}>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className={controls.backdrop} />
        <AlertDialog.Popup className={controls.dialog}>
          <AlertDialog.Title className={controls.dialogTitle}>
            Your Collections file couldn't be read.
          </AlertDialog.Title>
          <AlertDialog.Description className={controls.dialogDescription}>
            Book set it aside as {state.setAsideName} and started fresh. Your
            Font files are untouched.
          </AlertDialog.Description>
          <div className={controls.dialogActions}>
            <AlertDialog.Close className={controls.primaryButton}>
              OK
            </AlertDialog.Close>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
