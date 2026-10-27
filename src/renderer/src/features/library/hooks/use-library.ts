import type { Library, ScanProgress } from "@shared/contracts/library";
import { useCallback, useEffect, useRef, useState } from "react";
import { forgetUnusedFaces } from "@/shared/font-faces/registry";

export type LibraryState =
  | { status: "loading"; progress: ScanProgress | null }
  | {
      status: "ready";
      library: Library;
      isScanning: boolean;
      progress: ScanProgress | null;
    }
  | { status: "error" };

/** The Library from main: loaded once, and again on Scan Again. */
export function useLibrary(): { state: LibraryState; scanAgain: () => void } {
  const [state, setState] = useState<LibraryState>({
    status: "loading",
    progress: null,
  });
  // Only the newest request's answer is shown, so a slow older one can't win.
  const latestRequest = useRef(0);

  const request = useCallback((rescan: boolean) => {
    latestRequest.current += 1;
    const requestNumber = latestRequest.current;
    setState((previous) =>
      previous.status === "ready"
        ? { ...previous, isScanning: true, progress: null }
        : { status: "loading", progress: null },
    );
    const call = rescan
      ? window.fontBook.library.scan()
      : window.fontBook.library.load();
    call.then(
      (library) => {
        if (requestNumber !== latestRequest.current) return;
        if (rescan) forgetUnusedFaces();
        setState({
          status: "ready",
          library,
          isScanning: false,
          progress: null,
        });
      },
      (error: unknown) => {
        console.error("Scan failed", error);
        if (requestNumber === latestRequest.current)
          setState({ status: "error" });
      },
    );
  }, []);

  useEffect(() => {
    request(false);
    return window.fontBook.library.onScanProgress((progress) => {
      setState((previous) =>
        previous.status === "error" ? previous : { ...previous, progress },
      );
    });
  }, [request]);

  const scanAgain = useCallback(() => request(true), [request]);
  return { state, scanAgain };
}
