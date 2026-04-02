import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

const apiClient = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});

// ── Request Interceptor: Attach JWT ─────────────────────────────────

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("cubitax_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor: Auto-refresh on 401 ──────────────────────

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (token) prom.resolve(token);
    else prom.reject(error);
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Skip refresh for auth endpoints
    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      originalRequest.url?.includes("/auth/")
    ) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return apiClient(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = localStorage.getItem("cubitax_refresh_token");
      if (!refreshToken) {
        throw new Error("No refresh token");
      }

      const { data } = await axios.post(`${API_URL}/api/auth/refresh`, {
        refresh_token: refreshToken,
      });

      localStorage.setItem("cubitax_token", data.access_token);
      localStorage.setItem("cubitax_refresh_token", data.refresh_token);
      processQueue(null, data.access_token);

      originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      localStorage.removeItem("cubitax_token");
      localStorage.removeItem("cubitax_refresh_token");
      localStorage.removeItem("cubitax_user");
      window.location.href = "/login";
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

// ── WebSocket Helper ────────────────────────────────────────────────

export function createProgressSocket(userId) {
  const wsUrl = API_URL.replace("http", "ws");
  const ws = new WebSocket(`${wsUrl}/ws/progress/${userId}`);
  return ws;
}

// ── API Methods ─────────────────────────────────────────────────────

export const api = {
  // Auth
  register: (data) => apiClient.post("/api/auth/register", data),
  login: (data) => apiClient.post("/api/auth/login", data),
  getProfile: () => apiClient.get("/api/auth/me"),
  updateProfile: (data) => apiClient.put("/api/auth/me", null, { params: data }),

  // API Keys
  createApiKey: (data) => apiClient.post("/api/auth/api-keys", data),
  listApiKeys: () => apiClient.get("/api/auth/api-keys"),
  revokeApiKey: (id) => apiClient.delete(`/api/auth/api-keys/${id}`),

  // Chat
  sendMessage: (data) => apiClient.post("/api/chat/message", data),
  getChatHistory: (sessionId) => apiClient.get(`/api/chat/history/${sessionId}`),
  deleteChatHistory: (sessionId) => apiClient.delete(`/api/chat/history/${sessionId}`),
  listSessions: () => apiClient.get("/api/chat/sessions"),

  // Documents
  uploadDocument: (formData, onProgress) =>
    apiClient.post("/api/upload/document", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: onProgress,
      timeout: 120000,
    }),
  listDocuments: () => apiClient.get("/api/upload/documents"),
  deleteDocument: (id) => apiClient.delete(`/api/upload/documents/${id}`),

  // Dashboard
  getMetrics: () => apiClient.get("/api/dashboard/metrics"),
  getAlerts: () => apiClient.get("/api/dashboard/alerts"),
  getDeadlines: () => apiClient.get("/api/dashboard/deadlines"),
  getFilingStatus: () => apiClient.get("/api/dashboard/filing-status"),

  // Reports
  generateReport: (data) => apiClient.post("/api/reports/generate", data),
  listReports: () => apiClient.get("/api/reports/list"),
  downloadReport: (id, format = "pdf") =>
    apiClient.get(`/api/reports/download/${id}?format=${format}`, { responseType: "blob" }),

  // Admin
  createOrganization: (data) => apiClient.post("/api/admin/organizations", data),
  listTeam: () => apiClient.get("/api/admin/team"),
  inviteTeamMember: (data) => apiClient.post("/api/admin/team/invite", data),
  changeMemberRole: (userId, role) => apiClient.put(`/api/admin/team/${userId}/role`, null, { params: { role } }),
  removeMember: (userId) => apiClient.delete(`/api/admin/team/${userId}`),

  // Health
  getHealth: () => apiClient.get("/health"),
};

// ── Nested namespace aliases (for pages using api.dashboard.* pattern) ──

api.dashboard = {
  getMetrics: () => apiClient.get("/api/dashboard/metrics").then((r) => r.data),
  getDeadlines: () => apiClient.get("/api/dashboard/deadlines").then((r) => r.data),
  getAlerts: () => apiClient.get("/api/dashboard/alerts").then((r) => r.data),
  getFilingStatus: () => apiClient.get("/api/dashboard/filing-status").then((r) => r.data),
};

api.upload = {
  uploadDocument: api.uploadDocument,
  getDocuments: () => apiClient.get("/api/upload/documents").then((r) => r.data),
  deleteDocument: api.deleteDocument,
};

api.chat = {
  sendMessage: api.sendMessage,
  getHistory: api.getChatHistory,
  listSessions: api.listSessions,
};

api.reports = {
  generate: api.generateReport,
  list: api.listReports,
  download: api.downloadReport,
};

export default apiClient;

