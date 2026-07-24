import { recordSecurityEvent } from "@/modules/security-log/application/commands/recordSecurityEvent";
import type { SecurityEventRepository } from "@/modules/security-log/domain/securityEvent";

describe("recordSecurityEvent", () => {
  it("delegates to the repository with the given userId and eventType (FR-038)", async () => {
    const repository: SecurityEventRepository = { record: jest.fn().mockResolvedValue(undefined) };

    await recordSecurityEvent(repository, {
      userId: "user-1",
      eventType: "cross_account_access_denied",
    });

    expect(repository.record).toHaveBeenCalledWith("user-1", "cross_account_access_denied");
  });
});
