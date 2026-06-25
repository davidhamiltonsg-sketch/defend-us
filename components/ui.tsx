"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Check, TriangleAlert, X } from "lucide-react";

// ---------------------------------------------------------------------------
// Toasts
// ---------------------------------------------------------------------------

type ToastKind = "ok" | "error";
interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

const ToastContext = createContext<(message: string, kind?: ToastKind) => void>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

// ---------------------------------------------------------------------------
// Confirm
// ---------------------------------------------------------------------------

interface ConfirmOpts {
  title: string;
  body?: string;
  confirmLabel?: string;
  danger?: boolean;
}
const ConfirmContext = createContext<(opts: ConfirmOpts) => Promise<boolean>>(async () => false);

export function useConfirm() {
  return useContext(ConfirmContext);
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function UiProviders({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const toast = useCallback((message: string, kind: ToastKind = "ok") => {
    const id = nextId.current++;
    setToasts((t) => [...t, { id, kind, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  const [confirmState, setConfirmState] = useState<{
    opts: ConfirmOpts;
    resolve: (v: boolean) => void;
  } | null>(null);

  const confirm = useCallback(
    (opts: ConfirmOpts) => new Promise<boolean>((resolve) => setConfirmState({ opts, resolve })),
    [],
  );

  function settle(value: boolean) {
    confirmState?.resolve(value);
    setConfirmState(null);
  }

  return (
    <ToastContext.Provider value={toast}>
      <ConfirmContext.Provider value={confirm}>
        {children}

        {/* toasts */}
        <div className="pointer-events-none fixed bottom-5 left-1/2 z-[80] flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4">
          {toasts.map((t) => (
            <div
              key={t.id}
              className="pointer-events-auto flex items-center gap-2.5 rounded-xl border border-night-hair bg-night-raised/95 px-4 py-3 text-sm text-bone shadow-lamp backdrop-blur animate-rise"
            >
              {t.kind === "ok" ? (
                <Check className="h-4 w-4 shrink-0 text-ember" strokeWidth={2.2} />
              ) : (
                <TriangleAlert className="h-4 w-4 shrink-0 text-[#E59A8C]" strokeWidth={2} />
              )}
              <span>{t.message}</span>
            </div>
          ))}
        </div>

        {/* confirm modal */}
        {confirmState && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center px-5">
            <button
              aria-label="Dismiss"
              onClick={() => settle(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <div className="relative w-full max-w-sm animate-rise rounded-2xl border border-night-hair bg-night-raised p-6 shadow-lamp">
              <h2 className="font-serif text-xl text-bone">{confirmState.opts.title}</h2>
              {confirmState.opts.body && (
                <p className="mt-2 text-sm leading-relaxed text-ash">{confirmState.opts.body}</p>
              )}
              <div className="mt-6 flex justify-end gap-2">
                <button
                  onClick={() => settle(false)}
                  className="rounded-xl px-4 py-2 font-mono text-[11px] uppercase tracking-eyebrow text-smoke transition hover:text-ash"
                >
                  Cancel
                </button>
                <button
                  onClick={() => settle(true)}
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                    confirmState.opts.danger
                      ? "border border-[#5a3530] text-[#E59A8C] hover:bg-[#2a1a18]"
                      : "bg-ember text-night shadow-glow hover:bg-ember-soft"
                  }`}
                >
                  {confirmState.opts.confirmLabel ?? "Confirm"}
                </button>
              </div>
            </div>
          </div>
        )}
      </ConfirmContext.Provider>
    </ToastContext.Provider>
  );
}

// A tiny X button used by drawers/panels elsewhere.
export function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="text-smoke transition hover:text-bone" aria-label="Close">
      <X className="h-4 w-4" />
    </button>
  );
}
