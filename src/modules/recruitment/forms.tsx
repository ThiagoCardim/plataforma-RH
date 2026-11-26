"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  TextField,
  AreaField,
  Pick,
  Check,
  Upload,
  move,
  Reorder,
} from "../academy/components";
import { FileCard } from "../documents/file-card";
import { type Attachment } from "../documents/model";
import { type Form, type Field, visibleFields } from "./model";
import { uid } from "../career/model";
export function FieldBuilder({
  fields,
  change,
  stageFields = false,
  mappingOptions,
}: {
  fields: Field[];
  stageFields?: boolean;
  mappingOptions?: { id: string; name: string }[];
  change: (f: Field[]) => void;
}) {
  const patch = (id: string, p: Partial<Field>) =>
    change(fields.map((f) => (f.id === id ? { ...f, ...p } : f)));
  return (
    <div className="space-y-4">
      {fields.map((f, i) => (
        <details key={f.id} className="rounded-xl border bg-card p-4">
          <summary className="cursor-pointer text-sm font-semibold">
            {i + 1}. {f.label} {f.required ? "· obrigatório" : ""}
          </summary>
          <div className="mt-4 space-y-3">
            <Reorder
              name={`campo ${i + 1}`}
              first={!i}
              last={i === fields.length - 1}
              up={() => change(move(fields, i, -1))}
              down={() => change(move(fields, i, 1))}
              remove={() => change(fields.filter((x) => x.id !== f.id))}
            />
            <TextField
              label={`Pergunta ${i + 1}`}
              value={f.label}
              onChange={(label) => patch(f.id, { label })}
            />
            <AreaField
              label={`Descrição do campo ${i + 1}`}
              value={f.description ?? ""}
              onChange={(description) => patch(f.id, { description })}
            />
            <Pick
              label={`Tipo do campo ${i + 1}`}
              value={f.type}
              onChange={(type) => patch(f.id, { type: type as Field["type"] })}
              options={[
                "Texto",
                "Parágrafo",
                "E-mail",
                "Telefone",
                "Número",
                "Data",
                "Seleção",
                "Múltipla escolha",
                "Arquivo",
                "Confirmação",
              ]
                .filter((x) => !stageFields || x !== "Arquivo")
                .map((x) => ({ id: x, name: x }))}
            />
            <Check
              label={`Campo ${i + 1} obrigatório`}
              checked={f.required}
              onChange={(required) => patch(f.id, { required })}
            />
            {["Seleção", "Múltipla escolha"].includes(f.type) && (
              <AreaField
                label={`Opções do campo ${i + 1} (uma por linha)`}
                value={f.options.join("\n")}
                onChange={(v) => patch(f.id, { options: v.split("\n") })}
              />
            )}
            <Pick
              label={`Mapeamento do campo ${i + 1}`}
              value={f.mapping}
              onChange={(mapping) => patch(f.id, { mapping })}
              options={
                mappingOptions ??
                [
                  ["", "Resposta adicional"],
                  ["name", "Nome"],
                  ["email", "E-mail"],
                  ["phone", "Telefone"],
                  ["city", "Cidade"],
                  ["sector", "Área"],
                  ["education", "Formação"],
                  ["experience", "Experiência"],
                  ["skills", "Competências"],
                  ["software", "Softwares"],
                  ["availability", "Disponibilidade"],
                  ["expected", "Pretensão mensal em R$"],
                  ["cv", "Currículo"],
                  ["portfolio", "Portfólio"],
                  ["notes", "Observações"],
                ].map(([id, name]) => ({ id, name }))
              }
            />
            <Pick
              label={`Exibir campo ${i + 1} quando`}
              value={f.condition?.field ?? ""}
              onChange={(v) =>
                patch(f.id, {
                  condition: v ? { field: v, equals: "" } : undefined,
                })
              }
              options={[
                { id: "", name: "Sempre visível" },
                ...fields.slice(0, i).map((x) => ({ id: x.id, name: x.label })),
              ]}
            />
            {f.condition && (
              <TextField
                label={`Resposta que exibe campo ${i + 1}`}
                value={f.condition.equals}
                onChange={(equals) =>
                  patch(f.id, { condition: { ...f.condition!, equals } })
                }
              />
            )}
          </div>
        </details>
      ))}
      <Button
        variant="outline"
        onClick={() =>
          change([
            ...fields,
            {
              id: uid(),
              label: "Nova pergunta",
              type: "Texto",
              required: false,
              options: ["Opção A", "Opção B"],
              mapping: "",
            },
          ])
        }
      >
        Adicionar campo
      </Button>
    </div>
  );
}
export function FormEditor({
  initial,
  save,
}: {
  initial: Form;
  save: (f: Form) => void;
}) {
  const [f, set] = useState(() => structuredClone(initial)),
    [preview, setPreview] = useState(false);
  return (
    <div className="space-y-5">
      <TextField
        label="Nome do formulário"
        value={f.name}
        onChange={(name) => set({ ...f, name })}
      />
      <TextField
        label="Cor do formulário"
        type="color"
        value={f.color}
        onChange={(color) => set({ ...f, color })}
      />
      <AreaField
        label="Mensagem de confirmação"
        value={f.message}
        onChange={(message) => set({ ...f, message })}
      />
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => setPreview(!preview)}>
          {preview ? "Voltar ao construtor" : "Pré-visualizar formulário"}
        </Button>
        <Button onClick={() => save(f)}>Salvar formulário</Button>
      </div>
      {preview ? (
        <CandidateForm form={f} submit={() => {}} preview />
      ) : (
        <FieldBuilder
          fields={f.fields}
          change={(fields) => set({ ...f, fields })}
        />
      )}
    </div>
  );
}
export function CandidateForm({
  form,
  submit,
  preview = false,
}: {
  form: Form;
  submit: (
    a: Record<string, string>,
    f: Record<string, Attachment>,
    consent: boolean,
  ) => void;
  preview?: boolean;
}) {
  const [answers, set] = useState<Record<string, string>>({}),
    [files, setFiles] = useState<Record<string, Attachment>>({}),
    [consent, setConsent] = useState(false);
  const answer = (id: string, v: string) => set({ ...answers, [id]: v });
  return (
    <form
      className="space-y-5 rounded-2xl border bg-card p-6"
      style={{ borderTop: `5px solid ${form.color}` }}
      onSubmit={(e) => {
        e.preventDefault();
        submit(answers, files, consent);
      }}
    >
      <div>
        <p className="text-xs uppercase tracking-wider text-primary">
          Candidatura demonstrativa protegida
        </p>
        <h3 className="mt-3 text-xl font-semibold">{form.name}</h3>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          Use apenas informações fictícias. Nenhuma candidatura real, mensagem
          ou envio externo será realizado.
        </p>
      </div>
      {visibleFields(form, answers).map((f) => (
        <div key={f.id}>
          {f.description && (
            <p className="mb-2 text-xs text-muted-foreground">
              {f.description}
            </p>
          )}
          {f.type === "Arquivo" ? (
            <>
              <Upload
                label={f.label + (f.required ? " *" : "")}
                onFile={(file) => setFiles({ ...files, [f.id]: file })}
              />
              {files[f.id] && (
                <>
                  <FileCard file={files[f.id]} />
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      const next = { ...files };
                      delete next[f.id];
                      setFiles(next);
                    }}
                  >
                    Remover {f.label}
                  </Button>
                </>
              )}
            </>
          ) : f.type === "Parágrafo" ? (
            <AreaField
              label={f.label + (f.required ? " *" : "")}
              value={answers[f.id] ?? ""}
              onChange={(v) => answer(f.id, v)}
            />
          ) : f.type === "Seleção" ? (
            <Pick
              label={f.label + (f.required ? " *" : "")}
              value={answers[f.id] ?? ""}
              onChange={(v) => answer(f.id, v)}
              options={[
                { id: "", name: "Selecione" },
                ...f.options.filter(Boolean).map((x) => ({ id: x, name: x })),
              ]}
            />
          ) : f.type === "Múltipla escolha" ? (
            <fieldset className="space-y-3 rounded-xl border p-4">
              <legend className="px-2 text-sm">{f.label}</legend>
              {f.options.filter(Boolean).map((x) => (
                <Check
                  key={x}
                  label={x}
                  checked={(answers[f.id] ?? "").split("|").includes(x)}
                  onChange={(yes) =>
                    answer(
                      f.id,
                      yes
                        ? [
                            ...(answers[f.id] ?? "").split("|").filter(Boolean),
                            x,
                          ].join("|")
                        : (answers[f.id] ?? "")
                            .split("|")
                            .filter((v) => v !== x)
                            .join("|"),
                    )
                  }
                />
              ))}
            </fieldset>
          ) : f.type === "Confirmação" ? (
            <Check
              label={f.label}
              checked={answers[f.id] === "Sim"}
              onChange={(yes) => answer(f.id, yes ? "Sim" : "")}
            />
          ) : (
            <TextField
              label={f.label + (f.required ? " *" : "")}
              required={f.required}
              type={
                f.type === "E-mail"
                  ? "email"
                  : f.type === "Telefone"
                    ? "tel"
                    : f.type === "Número"
                      ? "number"
                      : f.type === "Data"
                        ? "date"
                        : "text"
              }
              value={answers[f.id] ?? ""}
              onChange={(v) => answer(f.id, v)}
            />
          )}
        </div>
      ))}
      <Check
        label="Confirmo o uso de dados exclusivamente fictícios nesta simulação local"
        checked={consent}
        onChange={setConsent}
      />
      {!preview && (
        <Button type="submit">Registrar candidatura demonstrativa</Button>
      )}
      {preview && (
        <p className="text-xs text-muted-foreground">
          Prévia do formulário; nenhum registro é criado.
        </p>
      )}
    </form>
  );
}

export function StageField({
  field: f,
  value,
  change,
}: {
  field: Field;
  value: string;
  change: (v: string) => void;
}) {
  const label = f.label + (f.required ? " *" : "");
  if (f.type === "Seleção")
    return (
      <Pick
        label={label}
        value={value}
        onChange={change}
        options={[
          { id: "", name: "Selecione" },
          ...f.options.filter(Boolean).map((v) => ({ id: v, name: v })),
        ]}
      />
    );
  if (f.type === "Confirmação")
    return (
      <Check
        label={label}
        checked={value === "Sim"}
        onChange={(yes) => change(yes ? "Sim" : "")}
      />
    );
  if (f.type === "Múltipla escolha")
    return (
      <fieldset className="space-y-3 rounded-xl border p-4">
        <legend className="px-2 text-sm">{label}</legend>
        {f.options.filter(Boolean).map((v) => (
          <Check
            key={v}
            label={v}
            checked={value.split("|").includes(v)}
            onChange={(yes) =>
              change(
                yes
                  ? [...value.split("|").filter(Boolean), v].join("|")
                  : value
                      .split("|")
                      .filter((x) => x !== v)
                      .join("|"),
              )
            }
          />
        ))}
      </fieldset>
    );
  if (f.type === "Parágrafo")
    return <AreaField label={label} value={value} onChange={change} />;
  return (
    <TextField
      label={label}
      value={value}
      onChange={change}
      type={
        f.type === "E-mail"
          ? "email"
          : f.type === "Telefone"
            ? "tel"
            : f.type === "Número"
              ? "number"
              : f.type === "Data"
                ? "date"
                : "text"
      }
    />
  );
}
