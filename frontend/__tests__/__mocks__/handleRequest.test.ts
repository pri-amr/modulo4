import axios from "axios";
import { handleRequest } from "@/services/handleRequest";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("handleRequest", () => {
  it("resolves with response data on success", async () => {
    mockedAxios.request.mockResolvedValueOnce({ data: { id: "1" } });

    const result = await handleRequest("GET", "/transactions");

    expect(result).toEqual({ id: "1" });
    expect(mockedAxios.request).toHaveBeenCalledWith(
      expect.objectContaining({ method: "GET", url: "/transactions" }),
    );
  });

  it("sends the body and headers when provided", async () => {
    mockedAxios.request.mockResolvedValueOnce({ data: { ok: true } });

    await handleRequest("POST", "/transactions", { amount: 10 }, { "X-Test": "1" });

    expect(mockedAxios.request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "POST",
        url: "/transactions",
        data: { amount: 10 },
        headers: { "X-Test": "1" },
      }),
    );
  });

  it("throws the backend error payload when the request fails", async () => {
    mockedAxios.request.mockRejectedValueOnce({
      isAxiosError: true,
      response: { data: { error: { code: "VALIDATION_ERROR", message: "Invalid", field: "amount" } } },
    });
    mockedAxios.isAxiosError = jest.fn().mockReturnValue(true) as unknown as typeof axios.isAxiosError;

    await expect(handleRequest("POST", "/transactions", {})).rejects.toEqual({
      code: "VALIDATION_ERROR",
      message: "Invalid",
      field: "amount",
    });
  });
});
