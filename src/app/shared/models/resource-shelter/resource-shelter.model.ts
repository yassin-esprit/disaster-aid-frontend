export type ResourceType =
  | 'VEHICLE'
  | 'MEDICAL_KIT'
  | 'FOOD_SUPPLY'
  | 'EQUIPMENT'
  | 'GENERATOR'
  | 'BOAT';

export type ResourceCondition = 'GOOD' | 'FAIR' | 'POOR';

export type ResourceStatus =
  | 'AVAILABLE'
  | 'DEPLOYED'
  | 'RESERVED'
  | 'MAINTENANCE';

export type ShelterStatus = 'OPEN' | 'FULL' | 'CLOSED' | 'PREPARING';

export interface ResourcePayload {
  ownerId: number;
  type: ResourceType;
  name: string;
  quantity: number;
  condition: ResourceCondition;
  locationUrl: string;
  status: ResourceStatus;
  allocatedToRequestId?: number | null;
}

export interface ShelterPayload {
  name: string;
  locationUrl: string;
  address: string;
  capacity: number;
  managerId: number;
  amenities: string[];
  status: ShelterStatus;
}

export interface ResourceEntity {
  resourceId: number;
  name: string;
  quantity: number;
  type: ResourceType;
  condition: ResourceCondition;
  status: ResourceStatus;
  locationUrl: string;
  allocatedToRequestId?: number | null;
  lastUpdatedAt?: string;
  owner?: {
    userId?: number;
    id?: number;
  };
}

export interface ShelterEntity {
  shelterId: number;
  name: string;
  address: string;
  locationUrl: string;
  capacity: number;
  currentOccupancy: number;
  status: ShelterStatus;
  amenities?: Array<{
    amenity?: string;
  }>;
}

export interface ResourceShelterUser {
  userId: number;
  name: string;
}

export interface ShelterOccupantPayload {
  shelterId: number;
  userId: number;
  needsFlag?: string[];
}

export interface ShelterOccupantEntity {
  recordId: number;
  checkInAt: string;
  checkOutAt?: string | null;
  user?: {
    userId?: number;
    id?: number;
  };
}
