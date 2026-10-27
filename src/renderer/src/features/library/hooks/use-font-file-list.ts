import type { FontFileList } from "@shared/contracts/library";
import { useCallback, useEffect, useRef, useState } from "react";

export type FontFileListState =
  | { status: "loading" }
  | { status: "ready"; list: FontFileList; isScanning: boolean }
  | { status: "error" };

/**
 * Asks main for the Font files in every Font folder, and again whenever she
 * chooses Scan Again (from the menu, Mod+R, or a button).
 */
export function useFontFileList(): {
  state: FontFileListState;
  scanAgain: () => void;
} {
  const [state, setState] = useState<FontFileListState>({ status: "loading" });
  // Each Scan gets a number. Only the newest Scan's answer is shown, so a slow
  // older Scan can't overwrite a newer one.
  const latestScan = useRef(0);

  const scanAgain = useCallback(() => {
    latestScan.current += 1;
    const scan = latestScan.current;
    // Keep showing the last result while rescanning, so the list doesn't blink.
    setState((previous) =>
      previous.status === "ready"
        ? { ...previous, isScanning: true }
        : { status: "loading" },
    );
    window.fontBook.library.listFontFiles().then(
      (list) => {
        if (scan === latestScan.current) {
          setState({ status: "ready", list, isScanning: false });
        }
      },
      (error: unknown) => {
        console.error("Scan failed", error);
        if (scan === latestScan.current) setState({ status: "error" });
      },
    );
  }, []);

  useEffect(() => {
    scanAgain();
    return window.fontBook.library.onScanRequested(scanAgain);
  }, [scanAgain]);

  return { state, scanAgain };
}
