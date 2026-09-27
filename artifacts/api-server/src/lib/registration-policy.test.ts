import { describe, expect, it } from "@jest/globals";
import { hasCompleteOrganizationProfile } from "./registration-policy";

const validProfile = {
  organizationName: "Centro Verde",
  municipality: "Chihuahua",
  description: "Recibimos materiales reciclables para apoyar a la comunidad.",
  acceptedCategories: ["plastics", "paper"],
};

describe("organization registration requirements", () => {
  it("accepts complete organization profiles", () => {
    expect(hasCompleteOrganizationProfile(validProfile)).toBe(true);
  });

  it("rejects missing, empty, or whitespace-only profile details", () => {
    expect(
      hasCompleteOrganizationProfile({ ...validProfile, organizationName: "  " }),
    ).toBe(false);
    expect(
      hasCompleteOrganizationProfile({ ...validProfile, municipality: " " }),
    ).toBe(false);
    expect(
      hasCompleteOrganizationProfile({ ...validProfile, description: "" }),
    ).toBe(false);
    expect(
      hasCompleteOrganizationProfile({ ...validProfile, acceptedCategories: [] }),
    ).toBe(false);
    expect(
      hasCompleteOrganizationProfile({
        organizationName: validProfile.organizationName,
        municipality: validProfile.municipality,
      }),
    ).toBe(false);
  });
});