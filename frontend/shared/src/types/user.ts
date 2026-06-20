export type KycStatus = 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';

export interface UserProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  address?: string;
  countryCode?: string;
  kycStatus: KycStatus;
  kycReviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  address?: string;
  countryCode?: string;
}
