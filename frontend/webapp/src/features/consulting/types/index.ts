export interface IConsulting {
  consultingId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  description: string;
  categoryId: string;
  categoryName: string;
}

export interface IConsultingRequest {
  id: string;
  description: string;
  categoryId: string;
  categoryName: string;
  documentIds: string[];
  status: ConsultingRequestStatus;
  createdAt: string;
}

export enum ConsultingRequestStatus {
  Pending = 1,
  InProgress = 2,
  Completed = 3,
  Rejected = 4,
}

export const ConsultingRequestStatusStringMap = {
  [ConsultingRequestStatus.Pending]: "Pending",
  [ConsultingRequestStatus.InProgress]: "InProgress",
  [ConsultingRequestStatus.Completed]: "Completed",
  [ConsultingRequestStatus.Rejected]: "Rejected",
};
