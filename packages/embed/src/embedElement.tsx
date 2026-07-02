import * as React from "react";
import { createRoot, type Root } from "react-dom/client";
import { HealthTwinProvider, BodyMapCapture, createIdbStore } from "@healthtwin/react";
import type { LocalStore, Observation, BodyView } from "@healthtwin/core";

/** Wrap a store so each captured observation is emitted to the host. */
function emittingStore(base: LocalStore, emit: (o: Observation) => void): LocalStore {
  return {
    all: () => base.all(),
    async append(record) {
      await base.append(record);
      emit(record);
    },
  };
}

/**
 * Framework-agnostic capture widget. Attributes: `view`, `subject-id`.
 * Emits a `healthtwin:observation` CustomEvent (and a postMessage to the parent
 * frame) on every capture — so a partner can keep data in their own backend.
 * Advanced: set `.store` to a custom LocalStore (e.g. a partner adapter) before mount.
 */
export class HealthTwinCaptureElement extends HTMLElement {
  private root?: Root;
  private _store?: LocalStore;

  set store(s: LocalStore) { this._store = s; }

  connectedCallback(): void {
    const view = (this.getAttribute("view") as BodyView) || "anterior";
    const subjectId = this.getAttribute("subject-id") || "embed-anon";

    const emit = (o: Observation) => {
      this.dispatchEvent(new CustomEvent("healthtwin:observation", { detail: o, bubbles: true, composed: true }));
      try {
        window.parent?.postMessage({ type: "healthtwin:observation", observation: o }, "*");
      } catch {
        /* cross-origin parent may reject; ignore */
      }
    };

    const base = this._store ?? createIdbStore("healthtwin-embed");
    const store = emittingStore(base, emit);

    const container = document.createElement("div");
    this.appendChild(container);
    this.root = createRoot(container);
    this.root.render(
      <HealthTwinProvider store={store} subjectId={subjectId} origin="embed">
        <BodyMapCapture view={view} />
      </HealthTwinProvider>,
    );
  }

  disconnectedCallback(): void {
    this.root?.unmount();
    this.root = undefined;
  }
}

export function defineHealthTwinCapture(tag = "health-twin-capture"): void {
  if (typeof customElements !== "undefined" && !customElements.get(tag)) {
    customElements.define(tag, HealthTwinCaptureElement);
  }
}
