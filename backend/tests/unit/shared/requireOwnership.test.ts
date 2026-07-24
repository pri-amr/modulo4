import { createRequireOwnership } from "@/shared/http/requireOwnership";
import { AppError } from "@/shared/http/errors";

describe("requireOwnership", () => {
  it("returns the resource when its userId matches the requesting user", async () => {
    const onCrossAccountAccessDenied = jest.fn();
    const requireOwnership = createRequireOwnership(onCrossAccountAccessDenied);
    const resource = { userId: "user-1", name: "Santander" };

    const result = await requireOwnership(resource, "user-1");

    expect(result).toBe(resource);
    expect(onCrossAccountAccessDenied).not.toHaveBeenCalled();
  });

  it("throws a 404 AppError and notifies the caller when the resource belongs to another user (FR-008/SC-008)", async () => {
    const onCrossAccountAccessDenied = jest.fn().mockResolvedValue(undefined);
    const requireOwnership = createRequireOwnership(onCrossAccountAccessDenied);
    const resource = { userId: "other-user", name: "Santander" };

    await expect(requireOwnership(resource, "user-1")).rejects.toBeInstanceOf(AppError);
    await expect(requireOwnership(resource, "user-1")).rejects.toMatchObject({ statusCode: 404 });
    expect(onCrossAccountAccessDenied).toHaveBeenCalledWith("user-1");
  });

  it("throws a 404 AppError without notifying when the resource does not exist", async () => {
    const onCrossAccountAccessDenied = jest.fn();
    const requireOwnership = createRequireOwnership(onCrossAccountAccessDenied);

    await expect(requireOwnership(null, "user-1")).rejects.toMatchObject({ statusCode: 404 });
    expect(onCrossAccountAccessDenied).not.toHaveBeenCalled();
  });
});
