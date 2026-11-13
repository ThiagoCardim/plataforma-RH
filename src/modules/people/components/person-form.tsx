"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type ReactNode } from "react";
import { ArrowRight, Check, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/fields";
import { usePeopleDemo } from "./demo-provider";
import { BackToPeople, MissingPerson } from "./person-ui";
import {
  contractNames,
  currentEngagement,
  departments,
  draftFromPerson,
  normalize,
  peoplePath,
  units,
  validateDraft,
  type DraftErrors,
  type PersonDraft,
} from "../model";
function Field({
  id,
  label,
  required,
  error,
  help,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  help?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-xs font-semibold">
        {label}
        {required && (
          <span className="ml-1 text-primary" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children}
      {error ? (
        <p id={`${id}-help`} className="mt-2 text-xs text-destructive">
          {error}
        </p>
      ) : help ? (
        <p
          id={`${id}-help`}
          className="mt-2 text-xs leading-5 text-muted-foreground"
        >
          {help}
        </p>
      ) : (
        <span id={`${id}-help`} className="sr-only">
          {required ? "Campo obrigatório." : "Campo opcional."}
        </span>
      )}
    </div>
  );
}
function FormSection({
  number,
  title,
  description,
  children,
}: {
  number: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <fieldset className="form-section rounded-xl border bg-card p-5 md:p-7">
      <legend className="sr-only">{title}</legend>
      <div className="mb-6 flex items-start gap-3">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-[11px] font-semibold text-muted-foreground">
          {number}
        </span>
        <div>
          <h2 className="section-title">{title}</h2>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}
export function PersonForm({ personId }: { personId?: string }) {
  const { people, organizationId, canEdit, save } = usePeopleDemo();
  const person = people.find(
    (p) => p.id === personId && p.organizationId === organizationId,
  );
  const [draft, setDraft] = useState(() => draftFromPerson(person));
  const [errors, setErrors] = useState<DraftErrors>({});
  const [duplicateReviewed, setDuplicateReviewed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const errorRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  if (personId && !person) return <MissingPerson />;
  if (!canEdit)
    return (
      <p>Cadastro demonstrativo disponível somente para RH e Diretoria.</p>
    );
  if (person && !currentEngagement(person))
    return (
      <div>
        <BackToPeople />
        <h1 className="page-title">Histórico preservado</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          A edição deste vínculo encerrado ou programado não está disponível
          nesta demonstração.
        </p>
      </div>
    );
  const duplicate = people.some(
    (p) =>
      p.id !== personId &&
      p.organizationId === organizationId &&
      normalize(p.name) === normalize(draft.name),
  );
  function change<K extends keyof PersonDraft>(key: K, value: PersonDraft[K]) {
    setDraft((previous) => ({
      ...previous,
      [key]: value,
      ...(key === "type" ? { detail: "" } : {}),
    }));
    setSubmitted(false);
    if (key === "name") setDuplicateReviewed(false);
    setErrors((previous) => ({ ...previous, [key]: undefined }));
  }
  function props(key: keyof PersonDraft) {
    return {
      id: key,
      name: key,
      value: draft[key],
      "aria-invalid": !!errors[key],
      "aria-describedby": `${key}-help`,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        change(key, e.target.value as PersonDraft[typeof key]),
    };
  }
  function showErrors(next: DraftErrors) {
    setErrors(next);
    requestAnimationFrame(() => errorRef.current?.focus());
  }
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (submitted) return;
    const next = validateDraft(draft);
    if (duplicate && !duplicateReviewed)
      next.form =
        "Revise a possível duplicidade e confirme a revisão antes de continuar.";
    if (Object.keys(next).length) return showErrors(next);
    const result = save(draft, personId);
    if ("errors" in result) return showErrors(result.errors);
    setSubmitted(true);
    router.push(`${peoplePath}/${result.person.id}`);
  }
  function cancel(e: React.MouseEvent<HTMLAnchorElement>) {
    if (
      JSON.stringify(draft) !== JSON.stringify(draftFromPerson(person)) &&
      !window.confirm("Descartar o preenchimento desta simulação?")
    )
      e.preventDefault();
  }
  const isPj = draft.type === "pj";
  const detailLabel = isPj
    ? "Empresa e escopo da prestação"
    : draft.type === "intern"
      ? "Instituição de ensino e curso"
      : "Modalidade do contrato";
  return (
    <div>
      <BackToPeople />
      <header className="mb-7">
        <p className="section-kicker mb-3">
          Base central / {person ? "Edição" : "Novo cadastro"}
        </p>
        <h1 className="page-title">
          {person ? "Editar pessoa" : "Uma nova trajetória."}
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {person
            ? "Atualize os dados do exemplo. O histórico anterior permanece disponível."
            : "Comece pelo essencial. As demais informações podem ser complementadas depois."}{" "}
          Campos com * são obrigatórios.
        </p>
      </header>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_240px]">
        <form
          method="post"
          noValidate
          onSubmit={submit}
          autoComplete="off"
          className="min-w-0 space-y-5"
        >
          {Object.values(errors).some(Boolean) && (
            <div
              ref={errorRef}
              tabIndex={-1}
              role="alert"
              className="rounded-xl border border-destructive/30 bg-red-50 p-5 text-sm text-destructive"
            >
              <p className="font-semibold">Revise os campos para continuar</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {Object.entries(errors)
                  .filter(([, value]) => value)
                  .map(([key, value]) => (
                    <li key={key}>
                      {key === "form" ? (
                        value
                      ) : (
                        <a href={`#${key}`} className="underline">
                          {value}
                        </a>
                      )}
                    </li>
                  ))}
              </ul>
            </div>
          )}
          <FormSection
            number="01"
            title="Identificação"
            description="Uma pessoa, independentemente de ter uma conta de acesso."
          >
            <Field
              id="name"
              label="Nome completo"
              required
              error={errors.name}
              help="Use um nome fictício para esta demonstração."
            >
              <Input
                {...props("name")}
                required
                maxLength={160}
                placeholder="Ex.: Ana Exemplo"
              />
            </Field>
            <Field
              id="displayName"
              label="Nome de exibição"
              error={errors.displayName}
              help="Como a pessoa prefere ser apresentada. Opcional."
            >
              <Input
                {...props("displayName")}
                maxLength={160}
                placeholder="Ex.: Ana"
              />
            </Field>
            {duplicate && (
              <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-xs sm:col-span-2">
                <p className="font-semibold">Possível duplicidade</p>
                <p className="mt-1 leading-5">
                  Já existe uma pessoa com esse nome nesta base. Nomes iguais
                  não significam a mesma identidade. Revise o cadastro antes de
                  continuar.
                </p>
                <label className="mt-3 flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={duplicateReviewed}
                    onChange={(e) => setDuplicateReviewed(e.target.checked)}
                    className="mt-0.5"
                  />
                  Revisei a ocorrência e desejo simular um cadastro separado.
                </label>
              </div>
            )}
          </FormSection>
          <FormSection
            number="02"
            title="Contato profissional"
            description="Opcional no cadastro inicial. Nenhum destes campos cria ou altera um login."
          >
            <Field
              id="email"
              label="E-mail profissional"
              error={errors.email}
              help="Use um endereço fictício, como pessoa@exemplo.invalid."
            >
              <Input
                {...props("email")}
                type="email"
                maxLength={160}
                placeholder="pessoa@exemplo.invalid"
              />
            </Field>
            <Field
              id="phone"
              label="Telefone profissional"
              error={errors.phone}
              help="Deixe em branco se não for necessário."
            >
              <Input
                {...props("phone")}
                type="tel"
                maxLength={24}
                placeholder="Opcional"
              />
            </Field>
          </FormSection>
          <FormSection
            number="03"
            title="Vínculo com a organização"
            description="Somente um vínculo ativo por organização. Os anteriores permanecem no histórico."
          >
            <Field
              id="type"
              label="Tipo de vínculo"
              required
              error={errors.type}
              help={
                person
                  ? "O tipo do vínculo existente é preservado."
                  : "CLT, estágio e prestação de serviço têm regras próprias."
              }
            >
              <Select {...props("type")} required disabled={!!person}>
                {Object.entries(contractNames).map(([key, label]) => (
                  <option value={key} key={key}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field
              id="start"
              label="Data de início"
              required
              error={errors.start}
              help={
                person
                  ? "A data original é preservada na edição."
                  : "Datas futuras representam vínculos programados."
              }
            >
              <Input
                {...props("start")}
                type="date"
                required
                disabled={!!person}
              />
            </Field>
            <div className="sm:col-span-2">
              <Field
                id="detail"
                label={detailLabel}
                error={errors.detail}
                help={
                  isPj
                    ? "Escopo de serviço contratado. Não representa cargo empregatício, salário ou benefícios CLT."
                    : draft.type === "intern"
                      ? "O termo e a supervisão serão complementados na integração futura."
                      : "Dados contratuais completos serão complementados depois."
                }
              >
                <Input
                  {...props("detail")}
                  maxLength={300}
                  placeholder={
                    isPj
                      ? "Ex.: Estúdio Exemplo · Consultoria de projetos"
                      : draft.type === "intern"
                        ? "Ex.: Instituto Modelo · Engenharia"
                        : "Ex.: Prazo indeterminado"
                  }
                />
              </Field>
            </div>
          </FormSection>
          <FormSection
            number="04"
            title="Informações profissionais"
            description="O contexto de atuação da pessoa na organização."
          >
            <Field
              id="position"
              label={isPj ? "Função / serviço contratado" : "Cargo ou função"}
              required
              error={errors.position}
            >
              <Input
                {...props("position")}
                required
                maxLength={160}
                placeholder={
                  isPj
                    ? "Ex.: Consultoria de engenharia"
                    : "Ex.: Analista de projetos"
                }
              />
            </Field>
            <Field
              id="department"
              label="Setor"
              required
              error={errors.department}
            >
              <Select {...props("department")} required>
                <option value="">Selecione um setor</option>
                {departments.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </Select>
            </Field>
            <Field id="unit" label="Unidade" required error={errors.unit}>
              <Select {...props("unit")} required>
                <option value="">Selecione uma unidade</option>
                {units.map((u) => (
                  <option key={u}>{u}</option>
                ))}
              </Select>
            </Field>
            <Field
              id="leader"
              label={
                isPj
                  ? "Responsável pela relação contratual"
                  : "Liderança responsável"
              }
              error={errors.leader}
              help="Opcional nesta simulação; catálogo validado previsto para a integração."
            >
              <Input
                {...props("leader")}
                maxLength={160}
                placeholder="Nome fictício do responsável"
              />
            </Field>
          </FormSection>
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-card p-5">
            <p className="max-w-sm text-xs leading-5 text-muted-foreground">
              {person ? "A edição é temporária" : "O cadastro é temporário"} e
              não gera conta de acesso.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link
                  onClick={cancel}
                  href={person ? `${peoplePath}/${person.id}` : peoplePath}
                >
                  Cancelar
                </Link>
              </Button>
              <Button type="submit" disabled={submitted}>
                {person ? "Simular edição" : "Simular cadastro"}
                <ArrowRight aria-hidden="true" />
              </Button>
            </div>
          </div>
        </form>
        <aside className="rounded-xl border bg-card p-5 xl:sticky xl:top-6">
          <span className="mb-4 flex size-10 items-center justify-center rounded-xl bg-accent text-primary">
            <ShieldCheck size={20} aria-hidden="true" />
          </span>
          <h2 className="section-title">Só o necessário.</h2>
          <p className="mt-3 text-xs leading-6 text-muted-foreground">
            Identificação e relação profissional primeiro. Documentos, endereço
            residencial e informações financeiras ficam fora desta etapa.
          </p>
          <ul className="mt-5 space-y-3 text-xs">
            {[
              "Pessoa e conta de acesso separadas",
              "Um vínculo vigente por organização",
              "Histórico profissional preservado",
            ].map((text) => (
              <li key={text} className="flex items-start gap-2">
                <Check
                  size={14}
                  className="mt-0.5 shrink-0 text-primary"
                  aria-hidden="true"
                />
                {text}
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
