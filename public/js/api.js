const API_BASE = "/api";

async function request(url, method = "GET", body = null) {
  const res = await fetch(API_BASE + url, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: body ? JSON.stringify(body) : null,
  });

  const data = await res.json();
  if (!res.ok) throw data;
  return data;
}

// Auth
export const AuthAPI = {
  login: (identifier, password) =>
    request("/auth/login", "POST", { identifier, password }),

  register: (data) =>
    request("/auth/register", "POST", data),

  me: () =>
    request("/auth/me"),

  logout: () =>
    request("/auth/logout", "POST"),
};

// Account
export const AccountAPI = {
  get: () => request("/account"),
  balance: () => request("/account/balance"),
  profile: () => request("/account/profile"),
  updateProfile: (data) =>
    request("/account/profile", "PUT", data),

  notifications: () => request("/account/notifications"),
};

// Transactions
export const TxAPI = {
  transfer: (recipientId, amount, description) =>
    request("/transactions/transfer", "POST", {
      recipientId,
      amount,
      description,
    }),

  history: (page = 1) =>
    request(`/transactions/history?page=${page}`),
};
