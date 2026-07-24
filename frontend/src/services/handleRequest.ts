import axios from "axios";

export interface BackendError {
  code: string;
  message: string;
  field: string | null;
}

// Único punto de entrada HTTP del frontend: toda llamada a la API pasa por acá, lo que
// permite mockearlo por completo en tests de frontend sin backend real (Principio V).
export async function handleRequest<TResponse = unknown>(
  method: "GET" | "POST" | "PUT" | "DELETE",
  endpoint: string,
  body?: unknown,
  headers?: Record<string, string>,
): Promise<TResponse> {
  try {
    const response = await axios.request<TResponse>({
      baseURL: process.env.BACKEND_API_URL,
      withCredentials: true,
      method,
      url: endpoint,
      data: body,
      headers,
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.error) {
      throw error.response.data.error as BackendError;
    }
    throw error;
  }
}
