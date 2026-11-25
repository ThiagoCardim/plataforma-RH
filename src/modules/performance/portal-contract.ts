/** Future boundary only. No adapter is instantiated, no URL or remote request is configured. */
export type OperationalDeliveryEvidence = {
  organizationId: string;
  personExternalRef: string;
  functionExternalRef: string;
  periodStart: string;
  periodEnd: string;
  dimension:
    "Entregas" | "Qualidade" | "Prazos" | "Complexidade" | "Resultados";
  expected: number;
  actual: number;
  unit: string;
  deliveryReference: string;
  observedAt: string;
};
export interface OperationalEvidenceReadPort {
  listDeliveries(input: {
    organizationId: string;
    periodStart: string;
    periodEnd: string;
  }): Promise<OperationalDeliveryEvidence[]>;
}
