"use client";
import * as React from "react";
import { Dialog } from "radix-ui";
import { AnimatePresence, LazyMotion, domMax, m, useDragControls, useIsPresent, useReducedMotion } from "motion/react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

const SPRING = { type: "spring", damping: 34, stiffness: 380, mass: 0.9 } as const;

/** The animated panel. Split out so `useIsPresent` can read the AnimatePresence context. */
function Panel({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  const present = useIsPresent();
  const reduce = useReducedMotion();
  const controls = useDragControls();

  return (
    <div className="sheet-pos">
      <m.div
        className="sheet-panel"
        // While exiting, the panel is gone for assistive tech and the next sheet can't collide with it.
        aria-hidden={present ? undefined : true}
        style={present ? undefined : { pointerEvents: "none" }}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%", transition: { duration: reduce ? 0 : 0.18, ease: [0.4, 0, 1, 1] } }}
        transition={reduce ? { duration: 0 } : SPRING}
        drag={reduce ? false : "y"}
        dragControls={controls}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.7 }}
        onDragEnd={(_, info) => {
          if (info.offset.y > 110 || info.velocity.y > 600) onClose();
        }}
      >
        {/* the grab handle is the drag target, so scrolling the form never fights the gesture */}
        <div className="sheet-grab" onPointerDown={(e) => controls.start(e)} aria-hidden="true" />
        {children}
        <Dialog.Close asChild>
          <Button type="button" variant="ghost" size="icon-sm" className="sheet-close">
            <X />
            <span className="sr-only">Close</span>
          </Button>
        </Dialog.Close>
      </m.div>
    </div>
  );
}

/** The backdrop. Like the panel, it stops intercepting taps the moment it starts fading out. */
function Overlay({ style, ...props }: React.ComponentProps<typeof m.div>) {
  const present = useIsPresent();
  return (
    <m.div
      {...props}
      className="sheet-overlay"
      // keep Radix's own style (it re-enables pointer events on the overlay while the body is locked)
      style={present ? style : { ...style, pointerEvents: "none" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.18 } }}
    />
  );
}

/**
 * A bottom sheet with a spring entrance, drag-to-dismiss and a focus trap (Radix Dialog underneath).
 * `title` is announced to screen readers; the visible heading lives in `children`.
 */
export function BottomSheet({
  open,
  onOpenChange,
  title,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
}) {
  // When the sheet re-opens from a tap made while it was still closing, the closing sheet's outside-click
  // listener sees that same tap and asks to dismiss — after it re-opened. A press that began before the
  // latest opening is the one that opened it, so it must never close it.
  const openedAt = React.useRef(0);
  React.useEffect(() => {
    if (open) openedAt.current = performance.now();
  }, [open]);

  // Radix returns focus to a Dialog.Trigger on close — but these sheets open from a body region (or a list
  // button), not a trigger, so focus would fall to <body>. Remember what was focused as the sheet opens and
  // hand focus back to it. A layout effect runs before Radix's own effect moves focus into the sheet.
  const returnTo = React.useRef<HTMLElement | SVGElement | null>(null);
  React.useLayoutEffect(() => {
    if (open) {
      const el = document.activeElement;
      returnTo.current = el instanceof HTMLElement || el instanceof SVGElement ? el : null;
    }
  }, [open]);

  return (
    <LazyMotion features={domMax} strict>
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <Overlay />
            </Dialog.Overlay>
            <Dialog.Content
              asChild
              forceMount
              aria-describedby={undefined}
              onPointerDownOutside={(e) => {
                if (e.detail.originalEvent.timeStamp < openedAt.current) e.preventDefault();
              }}
              onCloseAutoFocus={(e) => {
                const el = returnTo.current;
                if (el && el.isConnected && el !== document.body) {
                  e.preventDefault();
                  el.focus({ preventScroll: true });
                }
              }}
            >
              <div>
                <Dialog.Title className="sr-only">{title}</Dialog.Title>
                <Panel onClose={() => onOpenChange(false)}>{children}</Panel>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
    </LazyMotion>
  );
}
