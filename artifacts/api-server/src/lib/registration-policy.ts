export interface OrganizationRegistrationDetails {
  organizationName?: string;
  municipality?: string;
  description?: string;
  acceptedCategories?: string[];
}

export function hasCompleteOrganizationProfile(
  details: OrganizationRegistrationDetails,
): boolean {
  return Boolean(
    details.organizationName?.trim() &&
      details.municipality?.trim() &&
      details.description?.trim() &&
      details.acceptedCategories?.length,
  );
}