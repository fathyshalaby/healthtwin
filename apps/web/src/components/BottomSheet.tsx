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
  return (
    <LazyMotion features={domMax} strict>
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <m.div
                className="sheet-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.18 } }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild forceMount aria-describedby={undefined}>
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
