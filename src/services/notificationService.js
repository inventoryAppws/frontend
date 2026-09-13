import api from "./api";

// Get notifications & unread count
export async function getNotifications(limit = 50) {
  const response = await api.get("/notifications", {
    params: { limit }
  });
  return response.data;
}

// Mark a single notification as read
export async function markNotificationAsRead(id) {
  const response = await api.patch(`/notifications/${id}/read`);
  return response.data;
}

// Mark all as read
export async function markAllNotificationsAsRead() {
  const response = await api.post("/notifications/read-all");
  return response.data;
}

// Dismiss (delete) single notification
export async function dismissNotification(id) {
  const response = await api.delete(`/notifications/${id}`);
  return response.data;
}

// Clear all notifications
export async function clearAllNotifications() {
  const response = await api.delete("/notifications");
  return response.data;
}

