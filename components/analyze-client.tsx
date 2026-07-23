"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { deleteAnalysis, listAnalyses } from "@/lib/firestore";
import type { Analysis } from "@/lib/types";
import { AnalysisList } from "./analysis-list";
import { AnalysisResultView, SupportResources } from "./analysis-result";
import { AnalysisUpload } from "./analysis-upload";
import { useConfirm, useToast } from "./ui";

export function AnalyzeClient() {
  const toast = useToast();
  const confirm = useConfirm();
  const [history, setHistory] = useState<Analysis[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [active, setActive] = useState<Analysis | null>(null);

  const refresh = useCallback(async () => {
    try {
      setHistory(await listAnalyses());
    } catch {
      /* keep current list */
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function remove(id?: string) {
    if (!id) return;
    const ok = await confirm({ title: "Delete this analysis?", confirmLabel: "Delete", danger: true });
    if (!ok) return;
    await deleteAnalysis(id).catch(() => {});
    setActive((a) => (a?.id === id ? null : a));
    toast("Analysis deleted");
    refresh();
  }

  return (
    <div className="space-y-7">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-eyebrow text-smoke">Chat Lens</p>
          <h1 className="mt-2 font-display text-4xl tracking-tight text-bone">Read a conversation</h1>
          <p className="mt-2 max-w-xl text-ash">
            Upload or paste a transcript. It&apos;s checked against 18 concerning patterns and 7 healthy ones, each
            grounded in a cited, published source — evidence quoted straight from the text, both speakers held to
            the same bar. Not a verdict on anyone; a place to look closer.
          </p>
        </div>
        {active && (
          <button
            onClick={() => setActive(null)}
            className="flex items-center gap-1.5 rounded-xl border border-night-hair px-3.5 py-2 text-sm text-ash transition hover:border-ember/40 hover:text-bone print:hidden"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={1.8} /> New analysis
          </button>
        )}
      </header>

      {active ? (
        <AnalysisResultView analysis={active} onDelete={() => remove(active.id)} />
      ) : (
        <>
          <AnalysisUpload
            onDone={(analysis) => {
              setActive(analysis);
              refresh();
            }}
          />
          <AnalysisList analyses={history} loading={loadingHistory} onSelect={setActive} onDelete={remove} />
          <SupportResources />
        </>
      )}
    </div>
  );
}
