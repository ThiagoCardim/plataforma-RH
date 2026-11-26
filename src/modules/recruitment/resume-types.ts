import type { Candidate, Form } from "./model";
import type { Attachment } from "../documents/model";
export const availabilityStates = [
  "Disponível para oportunidades",
  "Empregado, mas aberto a propostas",
  "Sem interesse no momento",
  "Não respondeu ao contato",
  "Disponibilidade desconhecida",
] as const;
export type AvailabilityStatus = (typeof availabilityStates)[number];
export const resumeFields = [
  "name",
  "email",
  "phone",
  "city",
  "sector",
  "education",
  "experience",
  "skills",
  "software",
  "availability",
  "summary",
] as const;
export type ResumeField = (typeof resumeFields)[number];
export type ResumeProfile = Pick<Candidate, ResumeField | "contracts"> & {
  cv?: Attachment;
  portfolio?: Attachment;
  availabilityStatus: AvailabilityStatus;
};
export type ReceivedForm = {
  form: Form;
  answers: Record<string, string>;
  files: Record<string, Attachment>;
};
export type ResumeRevision = {
  receivedForm?: ReceivedForm;
  id: string;
  candidate: string;
  originCandidate?: string;
  originVersion?: number;
  version: number;
  resumeUpdated?: string;
  at: string;
  by: string;
  reason: string;
  until: string;
  profile: Partial<ResumeProfile>;
  purged?: boolean;
};
export type Contact = {
  id: string;
  candidate: string;
  originCandidate?: string;
  at: string;
  by: string;
  note: string;
  returnOn: string;
  availability: AvailabilityStatus;
  done: boolean;
};
export type UpdateRequest = {
  id: string;
  candidate: string;
  originCandidate?: string;
  org: string;
  token: string;
  created: string;
  expires: string;
  by: string;
  state: "Aberta" | "Utilizada" | "Revogada";
  revision: number;
  message: string;
  usedAt?: string;
};
export type DuplicateReview = {
  intake?: ReceivedForm;
  id: string;
  left: string;
  right?: string;
  incoming?: Candidate;
  matches: string[];
  state: "Pendente" | "Unificados" | "Separados";
  at: string;
  by: string;
  note: string;
  choices?: Partial<
    Record<
      ResumeField | "cv" | "portfolio" | "availabilityStatus",
      "left" | "right"
    >
  >;
  resolvedAt?: string;
};
export type ResumeConfig = {
  months: [number, number, number];
  linkHours: number;
  message: string;
  autoArchive: boolean;
  archiveDays: number;
};
export type ImportReport = {
  id: string;
  at: string;
  by: string;
  source: string;
  file: string;
  total: number;
  created: number;
  reviews: number;
  skipped: number;
  rows: { row: number; state: string; candidate?: string; review?: string }[];
};
export const resumeViews = [
  "Todos os currículos",
  "Novos cadastros",
  "Talentos selecionados",
  "Em processo seletivo",
  "Currículos desatualizados",
  "Propostas recusadas",
  "Ex-profissionais",
  "Arquivados",
] as const;
export type ResumeView = (typeof resumeViews)[number];
