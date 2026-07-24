import { createBus } from "@/shared/cqrs/bus";

describe("CQRS bus", () => {
  it("resolves the handler registered for a given message type and returns its result", async () => {
    const bus = createBus<{ type: string; payload: number }, number>();
    bus.register("double", async (message) => message.payload * 2);

    const result = await bus.dispatch({ type: "double", payload: 21 });

    expect(result).toBe(42);
  });

  it("throws when dispatching a message type with no registered handler", async () => {
    const bus = createBus<{ type: string }, void>();

    await expect(bus.dispatch({ type: "unregistered" })).rejects.toThrow(
      /no handler registered for "unregistered"/i,
    );
  });
});
