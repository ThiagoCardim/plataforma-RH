"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type Scope } from "../career/model";
import { type State } from "./model";
import { TextField, Pick } from "../academy/components";
import { type WorkflowFilters } from "./workflow-types";
export type WorkflowProps = {
  state: State;
  scope: Scope;
  act: (fn: (s: State) => State, text?: string) => State | undefined;
};
export const choices = (rows: readonly string[]) =>
  rows.map((x) => ({ id: x, name: x }));
export function SideSheet({
  title,
  close,
  children,
}: {
  title: string;
  close: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
    const el = ref.current;
    return () => el?.close();
  }, []);
  return (
    <dialog ref={ref} onCancel={close} className="ats-sheet" aria-label={title}>
      <header className="sticky top-0 z-20 flex items-center justify-between border-b bg-card p-4">
        <h2 className="text-lg font-semibold">{title}</h2>
        <Button variant="ghost" onClick={close} aria-label="Fechar painel">
          <X size={20} />
        </Button>
      </header>
      <div className="p-4 sm:p-6">{children}</div>
    </dialog>
  );
}
export function AdvancedFilters({
  filters,
  change,
  state,
}: {
  filters: WorkflowFilters;
  change: (f: WorkflowFilters) => void;
  state: State;
}) {
  const patch = (key: keyof WorkflowFilters, value: string) =>
    change({ ...filters, [key]: value });
  return (
    <div className="grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-3 xl:grid-cols-5">
      {(
        [
          ["area", "Área"],
          ["sector", "Setor"],
          ["level", "Nível de experiência"],
          ["city", "Cidade"],
          ["education", "Formação"],
          ["skills", "Competências"],
          ["software", "Softwares"],
          ["availability", "Disponibilidade"],
          ["origin", "Origem"],
          ["tags", "Tags"],
          ["from", "De"],
          ["until", "Até"],
        ] as const
      ).map(([key, label]) => (
        <TextField
          key={key}
          label={label}
          value={filters[key]}
          type={["from", "until"].includes(key) ? "date" : "text"}
          onChange={(v) => patch(key, v)}
        />
      ))}
      <Pick
        label="Vínculo"
        value={filters.contract}
        onChange={(v) => patch("contract", v)}
        options={choices(["", "CLT", "Estágio", "PJ"])}
      />
      <Pick
        label="Vaga"
        value={filters.job}
        onChange={(v) => patch("job", v)}
        options={[
          { id: "", name: "Todas" },
          ...state.jobs.map((j) => ({ id: j.id, name: j.title })),
        ]}
      />
      <Pick
        label="Etapa"
        value={filters.stage}
        onChange={(v) => patch("stage", v)}
        options={[{ id: "", name: "Todas" }, ...state.central!.stages]}
      />
    </div>
  );
}
