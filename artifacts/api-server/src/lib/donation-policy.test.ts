import {
  canChangeDonationStatus,
  canReceiveDonation,
} from "./donation-policy";
import { describe, expect, it } from "@jest/globals";

describe("donation status authorization", () => {
  it("lets admins approve or reject pending donations", () => {
    expect(
      canChangeDonationStatus({
        actorRole: "admin",
        actorOrganizationId: null,
        recipientId: "org-1",
        currentStatus: "pending",
        nextStatus: "approved",
      }),
    ).toBe(true);
    expect(
      canChangeDonationStatus({
        actorRole: "admin",
        actorOrganizationId: null,
        recipientId: "org-1",
        currentStatus: "pending",
        nextStatus: "rejected",
      }),
    ).toBe(true);
    expect(
      canChangeDonationStatus({
        actorRole: "admin",
        actorOrganizationId: null,
        recipientId: "org-1",
        currentStatus: "approved",
        nextStatus: "rejected",
      }),
    ).toBe(false);
  });

  it("lets only the receiving organization confirm an approved delivery", () => {
    const change = {
      actorRole: "organization" as const,
      actorOrganizationId: "org-1",
      recipientId: "org-1",
      currentStatus: "approved" as const,
      nextStatus: "delivered" as const,
    };
    expect(canChangeDonationStatus(change)).toBe(true);
    expect(
      canChangeDonationStatus({ ...change, actorOrganizationId: "org-2" }),
    ).toBe(false);
    expect(
      canChangeDonationStatus({ ...change, currentStatus: "pending" }),
    ).toBe(false);
  });

  it("lets only the receiving organization accept a pending donation", () => {
    const change = {
      actorRole: "organization" as const,
      actorOrganizationId: "org-1",
      recipientId: "org-1",
      currentStatus: "pending" as const,
      nextStatus: "approved" as const,
    };
    expect(canChangeDonationStatus(change)).toBe(true);
    expect(
      canChangeDonationStatus({ ...change, actorOrganizationId: "org-2" }),
    ).toBe(false);
    expect(
      canChangeDonationStatus({ ...change, actorRole: "donor" }),
    ).toBe(false);
  });

  it("allows donations only to verified organizations that accept the category", () => {
    expect(
      canReceiveDonation({
        isVerified: true,
        acceptedCategories: ["plastics", "paper"],
        category: "plastics",
      }),
    ).toBe(true);
    expect(
      canReceiveDonation({
        isVerified: false,
        acceptedCategories: ["plastics"],
        category: "plastics",
      }),
    ).toBe(false);
    expect(
      canReceiveDonation({
        isVerified: true,
        acceptedCategories: ["paper"],
        category: "plastics",
      }),
    ).toBe(false);
  });

  it("never lets donors or organizations make unrelated transitions", () => {
    expect(
      canChangeDonationStatus({
        actorRole: "donor",
        actorOrganizationId: null,
        recipientId: "org-1",
        currentStatus: "pending",
        nextStatus: "approved",
      }),
    ).toBe(false);
    expect(
      canChangeDonationStatus({
        actorRole: "organization",
        actorOrganizationId: null,
        recipientId: "org-1",
        currentStatus: "approved",
        nextStatus: "delivered",
      }),
    ).toBe(false);
  });
});