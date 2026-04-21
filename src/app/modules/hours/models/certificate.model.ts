export interface Certificate {
  certificateId: number;
  volunteerId: number;
  orgId: number;
  totalHours: number;
  periodFrom: string;
  periodTo: string;
  skills: number[];
  pdfUrl: string | null;
  impactCardUrl: string | null;
  credentialHash: string | null;
  issuedAt: string;
  expiresAt: string | null;
}

export interface CertificateRequest {
  volunteerId: number;
  orgId: number;
  totalHours: number;
  periodFrom: string;
  periodTo: string;
  skills: number[];
  pdfUrl?: string;
  impactCardUrl?: string;
  credentialHash?: string;
  expiresAt?: string;
}
