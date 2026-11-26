import type { Contract } from "../career/model";
import type { Stage, Form, Criterion } from "./model";
import type { Attachment } from "../documents/model";
export const workflowViews = [
  ["processo-seletivo", "Processo Seletivo"],
  ["vagas", "Gestão de Vagas"],
  ["admissao", "Admissão Digital"],
  ["talentos", "Banco de Talentos"],
  ["indicadores", "Indicadores"],
  ["configuracoes", "Configurações"],
] as const;
export type WorkflowView = (typeof workflowViews)[number][0];
export const experienceLevels = [
  "Estudante: cursando ensino médio ou superior",
  "Júnior: até 3 anos de experiência",
  "Pleno: de 4 a 6 anos de experiência",
  "Sênior: 7 anos ou mais de experiência",
] as const;
export type StageKind =
  | "entry"
  | "normal"
  | "qualified"
  | "hired"
  | "bank"
  | "disqualified"
  | "rejected"
  | "declined";
export type PipelineStage = Stage & { color: string; kind: StageKind };
export type AdmissionStage = Stage & {
  color: string;
  purpose: "normal" | "confirmed" | "final" | "canceled";
};
export type DocumentRule = {
  id: string;
  name: string;
  required: boolean;
  instructions: string;
};
export type CentralConfig = {
  stages: PipelineStage[];
  cards: string[];
  tags: string[];
  formId: string;
  privacyNotice: string;
  admissionStages: Record<Contract, AdmissionStage[]>;
  documents: Record<Contract, DocumentRule[]>;
  admissionForms: Record<Contract, Form>;
  customCriteria: Criterion[];
};
export type Admission = {
  id: string;
  application: string;
  candidate: string;
  contract: Contract;
  stage: string;
  stages: AdmissionStage[];
  rules: DocumentRule[];
  form: Form;
  fields: Record<string, string>;
  checks: Record<string, boolean>;
  files: Record<string, Attachment>;
  answers: Record<string, string>;
  created: string;
  entered: string;
  owner: string;
  due: string;
  notes: string;
  externalRef: string;
  externalConfirmed: boolean;
  signedOn: string;
  start: string;
  amount: number;
  state: "Aberta" | "Confirmada" | "Cancelada";
  token: string;
  events: { id: string; at: string; by: string; text: string }[];
  confirmedAt?: string;
};
export type Employment = {
  id: string;
  org: string;
  candidate: string;
  application: string;
  admission: string;
  job: string;
  contract: Contract;
  start: string;
  confirmedAt: string;
  end?: string;
  exitConfirmedAt?: string;
  offboarding?: string;
  status: "Ativo" | "Encerrado";
  origin: string;
};
export type Relationship = {
  id: string;
  candidate: string;
  application?: string;
  at: string;
  by: string;
  kind:
    | "Entrada"
    | "Movimentação"
    | "Banco de Talentos"
    | "Reativação"
    | "Proposta recusada"
    | "Contratação"
    | "Desligamento"
    | "Elegibilidade";
  text: string;
};
export type WorkflowFilters = {
  search: string;
  area: string;
  sector: string;
  level: string;
  city: string;
  education: string;
  skills: string;
  software: string;
  availability: string;
  contract: string;
  job: string;
  origin: string;
  tags: string;
  stage: string;
  from: string;
  until: string;
};
export const clearWorkflowFilters = (): WorkflowFilters => ({
  search: "",
  area: "",
  sector: "",
  level: "",
  city: "",
  education: "",
  skills: "",
  software: "",
  availability: "",
  contract: "",
  job: "",
  origin: "",
  tags: "",
  stage: "",
  from: "",
  until: "",
});
