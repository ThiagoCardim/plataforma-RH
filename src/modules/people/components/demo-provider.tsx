"use client";
import { createContext, useContext, useState, type ReactNode } from "react";
import { FlaskConical } from "lucide-react";
import { createDemoPeople } from "../demo-data";
import { simulateSave, type PersonDraft, type SaveResult } from "../model";

type DemoStore = {
  people: ReturnType<typeof createDemoPeople>;
  organizationId: string;
  canEdit: boolean;
  lastSavedId: string | null;
  save: (draft: PersonDraft, existingId?: string) => SaveResult;
};
const DemoContext = createContext<DemoStore | null>(null);
export function DemoProvider({
  organizationId,
  canEdit,
  children,
}: {
  organizationId: string;
  canEdit: boolean;
  children: ReactNode;
}) {
  const [people, setPeople] = useState(() => createDemoPeople(organizationId));
  const [lastSavedId, setLastSavedId] = useState<string | null>(null);
  function save(draft: PersonDraft, existingId?: string): SaveResult {
    if (!canEdit)
      return {
        errors: { form: "Esta demonstração é exclusiva de RH e Diretoria." },
      };
    const result = simulateSave(
      people,
      organizationId,
      draft,
      `demo-${crypto.randomUUID()}`,
      existingId,
    );
    if ("person" in result)
      setPeople((current) =>
        existingId
          ? current.map((p) =>
              p.id === existingId && p.organizationId === organizationId
                ? result.person
                : p,
            )
          : [...current, result.person],
      );
    if ("person" in result) setLastSavedId(result.person.id);
    return result;
  }
  return (
    <DemoContext value={{ people, organizationId, canEdit, lastSavedId, save }}>
      <div className="demo-notice mb-7 flex items-start gap-3 rounded-xl border border-orange-200 bg-accent px-4 py-3 text-accent-foreground">
        <FlaskConical
          size={18}
          className="mt-0.5 shrink-0"
          aria-hidden="true"
        />
        <div>
          <p className="text-xs font-semibold">
            Demonstração · pessoas fictícias
          </p>
          <p className="mt-1 text-xs leading-5">
            Cadastros e edições ficam somente na memória desta navegação.
            Recarregar a página reinicia os exemplos. Use apenas dados
            fictícios.
          </p>
        </div>
      </div>
      {children}
    </DemoContext>
  );
}
export function usePeopleDemo() {
  const context = useContext(DemoContext);
  if (!context) throw new Error("Base de demonstração indisponível.");
  return context;
}
