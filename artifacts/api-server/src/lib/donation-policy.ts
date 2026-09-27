export type DonationRole = "donor" | "organization" | "admin";
export type DonationState = "pending" | "approved" | "delivered" | "rejected";

export interface DonationStatusChange {
  actorRole: DonationRole;
  actorOrganizationId: string | null;
  recipientId: string;
  currentStatus: DonationState;
  nextStatus: DonationState;
}

export interface DonationRecipientEligibility {
  isVerified: boolean;
  acceptedCategories: readonly string[];
  category: string;
}

export function canReceiveDonation({
  isVerified,
  acceptedCategories,
  category,
}: DonationRecipientEligibility): boolean {
  return isVerified && acceptedCategories.includes(category);
}

export function canChangeDonationStatus({
  actorRole,
  actorOrganizationId,
  recipientId,
  currentStatus,
  nextStatus,
}: DonationStatusChange): boolean {
  if (
    actorRole === "admin" &&
    currentStatus === "pending" &&
    (nextStatus === "approved" || nextStatus === "rejected")
  ) {
    return true;
  }

  if (actorRole !== "organization" || actorOrganizationId !== recipientId) {
    return false;
  }

  return (
    (currentStatus === "pending" && nextStatus === "approved") ||
    (currentStatus === "approved" && nextStatus === "delivered")
  );
}