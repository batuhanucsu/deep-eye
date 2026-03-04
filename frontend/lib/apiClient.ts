import axios, { AxiosError, type AxiosInstance } from "axios";

// ── Axios instance ────────────────────────────────────────────────────────────
const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000",
  timeout: Number(process.env.NEXT_PUBLIC_API_TIMEOUT ?? 60_000),
  headers: {
    Accept: "application/json",
  },
});

// ── Request interceptor ───────────────────────────────────────────────────────
apiClient.interceptors.request.use(
  (config) => {
    // FormData requests must NOT have Content-Type set manually —
    // axios sets it automatically with the correct boundary.
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor ──────────────────────────────────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ detail?: string | { msg: string }[] }>) => {
    // Normalise FastAPI error shapes into a plain Error with a human message.
    if (error.response) {
      const detail = error.response.data?.detail;
      let message: string;

      if (typeof detail === "string") {
        message = detail;
      } else if (Array.isArray(detail)) {
        // Pydantic validation errors are arrays of {msg, ...}
        message = detail.map((d) => d.msg).join("; ");
      } else {
        message = `Request failed with status ${error.response.status}`;
      }

      return Promise.reject(new Error(message));
    }

    if (error.request) {
      return Promise.reject(
        new Error("No response from server. Is the backend running?")
      );
    }

    return Promise.reject(error);
  }
);

export default apiClient;
