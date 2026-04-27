export type TimesheetStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'DISPUTED';

export interface Timesheet {
  timesheetId: number;
  applicationId: number;
  volunteerId: number;
  orgId: number;
  loggedHours: number;
  taskDescription: string;
  workDate: string;
  status: TimesheetStatus;
  supervisorId: number;
  approvedAt: string | null;
  rejectionReason: string | null;
}

export interface TimesheetRequest {
  applicationId: number;
  volunteerId: number;
  orgId: number;
  loggedHours: number;
  taskDescription: string;
  workDate: string;
  supervisorId: number;
}
