"use client";
import * as React from "react";

type Announce = (message: string) => void;
const AnnounceContext = React.createContext<Announce>(() => {});

/**
 * One polite live region for the whole app, so a screen-reader user hears what just happened
 * ("Saved: Left Knee, pain, 6 of 10") without focus being moved to tell them.
 */
export function AnnouncerProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = React.useState("");
  const timer = React.useRef<number | undefined>(undefined);

  const announce = React.useCallback<Announce>((next) => {
    // Clear first so an identical message (two saves in a row) is still announced. Wait until the closing
    // bottom sheet has unmounted: while an aria-modal dialog is still in the DOM, some screen readers
    // (VoiceOver in particular) ignore live-region updates outside it. The exit takes ~180ms.
    setMessage("");
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setMessage(next), 350);
  }, []);

  React.useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <AnnounceContext.Provider value={announce}>
      {children}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only" data-testid="announcer">
        {message}
      </div>
    </AnnounceContext.Provider>
  );
}

export const useAnnounce = () => React.useContext(AnnounceContext);

/** "Left Knee, pain, 6 of 10" — the spoken summary of one entry. */
export function describeEntry(region: string, type: string, intensity?: number): string {
  return intensity != null ? `${region}, ${type}, ${intensity} of 10` : `${region}, ${type}`;
}
