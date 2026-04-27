export type ResourceType =
  | 'VEHICLE'
  | 'MEDICAL_KIT'
  | 'FOOD_SUPPLY'
  | 'EQUIPMENT'
  | 'GENERATOR'
  | 'BOAT';

export type ResourceCondition = 'GOOD' | 'FAIR' | 'POOR';
export type ResourceStatus = 'AVAILABLE' | 'DEPLOYED' | 'RESERVED' | 'MAINTENANCE';

export interface UserEntity {
  userId: number;
  id?: number;
  name?: string;
}

export interface ResourceEntity {
  resourceId: number;
  owner?: UserEntity;
  type: ResourceType;
  name: string;
  quantity: number;
  condition: ResourceCondition;
  locationUrl: string;
  status: ResourceStatus;
  allocatedToRequestId: number | null;
  lastUpdatedAt?: string;
}

export interface ResourcePayload {
  ownerId: number;
  type: ResourceType;
  name: string;
  quantity: number;
  condition: ResourceCondition;
  locationUrl: string;
  status: ResourceStatus;
  allocatedToRequestId: number | null;
}

export type ShelterStatus = 'OPEN' | 'FULL' | 'CLOSED' | 'PREPARING';

export interface ShelterAmenityEntity {
  amenity?: string;
}

export interface ShelterEntity {
  shelterId: number;
  name: string;
  locationUrl: string;
  address: string;
  capacity: number;
  currentOccupancy: number;
  status: ShelterStatus;
  amenities?: ShelterAmenityEntity[];
  manager?: UserEntity;
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

export interface CheckInPayload {
  shelterId: number;
  userId: number;
}

export interface ShelterOccupantEntity {
  recordId: number;
  shelterId: number;
  userId: number;
  checkInAt: string;
  checkOutAt?: string | null;
}
