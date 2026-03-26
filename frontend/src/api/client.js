import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";
const TOKEN_KEY = "cubitax_token";
const unauthorizedListeners = new Set();

const client = axios.create({
  baseURL: API_BASE_URL
});

export function subscribeToUnauthorized(handler) {
  unauthorizedListeners.add(handler);
  return () => unauthorizedListeners.delete(handler);
}

client.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      unauthorizedListeners.forEach((listener) => listener());
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  async login(payload) {
    const response = await client.post("/api/auth/login", payload);
    return response.data;
  },
  async register(payload) {
    const response = await client.post("/api/auth/register", payload);
    return response.data;
  },
  async getMe() {
    const response = await client.get("/api/auth/me");
    return response.data;
  }
};

export const uploadApi = {
  async uploadDocument(file, onProgress) {
    const formData = new FormData();
    formData.append("file", file);
    const response = await client.post("/api/upload/document", formData, {
      headers: {
        "Content-Type": "multipart/form-data"
      },
      onUploadProgress(event) {
        if (event.total && onProgress) {
          onProgress(Math.round((event.loaded / event.total) * 100));
        }
      }
    });
    return response.data;
  },
  async getDocuments() {
    const response = await client.get("/api/upload/documents");
    return response.data;
  },
  async getDocumentStatus(docId) {
    const response = await client.get(`/api/upload/documents/${docId}/status`);
    return response.data;
  }
};

export const chatApi = {
  async sendMessage(payload) {
    const response = await client.post("/api/chat/message", payload);
    return response.data;
  },
  streamMessage({ query, sessionId, onToken, onCitation, onDone, onError }) {
    const token = localStorage.getItem(TOKEN_KEY);
    const url = new URL(`${API_BASE_URL}/api/chat/stream`);
    url.searchParams.set("query", query);
    url.searchParams.set("session_id", sessionId);
    if (token) {
      url.searchParams.set("token", token);
    }

    const source = new EventSource(url.toString());
    source.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === "token" && onToken) {
          onToken(payload.data);
        }
        if (payload.type === "citation" && onCitation) {
          onCitation(payload.data);
        }
        if (payload.type === "done" && onDone) {
          onDone(payload.data);
        }
      } catch (error) {
        if (onError) {
          onError(error);
        }
      }
    };
    source.onerror = (error) => {
      source.close();
      if (onError) {
        onError(error);
      }
    };
    return source;
  },
  async getHistory(sessionId) {
    const response = await client.get(`/api/chat/history/${sessionId}`);
    return response.data;
  },
  async clearHistory(sessionId) {
    const response = await client.delete(`/api/chat/history/${sessionId}`);
    return response.data;
  }
};

export const dashboardApi = {
  async getMetrics() {
    const response = await client.get("/api/dashboard/metrics");
    return response.data;
  },
  async getDeadlines() {
    const response = await client.get("/api/dashboard/deadlines");
    return response.data;
  },
  async getAlerts() {
    const response = await client.get("/api/dashboard/alerts");
    return response.data;
  }
};

export const reportsApi = {
  async generateReport() {
    const response = await client.post("/api/reports/generate");
    return response.data;
  },
  async downloadReport(reportId) {
    const response = await client.get(`/api/reports/download/${reportId}`, {
      responseType: "blob"
    });
    const blobUrl = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = `cubitaxai-report-${reportId}.pdf`;
    link.click();
    window.URL.revokeObjectURL(blobUrl);
  }
};

export const api = {
  auth: authApi,
  upload: uploadApi,
  chat: chatApi,
  dashboard: dashboardApi,
  reports: reportsApi
};

export { TOKEN_KEY };
export default client;

