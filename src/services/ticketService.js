import api from './api';

export const getMyTickets = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.status && params.status !== 'all') query.append('status', params.status);
  if (params.category && params.category !== 'all') query.append('category', params.category);
  if (params.q) query.append('q', params.q);
  if (params.sortBy) query.append('sortBy', params.sortBy);

  const res = await api.get(`/tickets/my?${query.toString()}`);
  return res.data;
};

export const createCustomerTicket = async (ticketData) => {
  const res = await api.post('/tickets', ticketData);
  return res.data;
};

export const getTicketById = async (id) => {
  const res = await api.get(`/tickets/${id}`);
  return res.data;
};

export const replyToTicket = async (id, text, attachments = []) => {
  const res = await api.post(`/tickets/${id}/reply`, { text, attachments });
  return res.data;
};

export const resolveOrCloseTicket = async (id, status = 'resolved', resolutionSummary = '') => {
  const res = await api.patch(`/tickets/${id}/close`, { status, resolutionSummary });
  return res.data;
};

// Vendor Tickets
export const getVendorTickets = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.tab) query.append('tab', params.tab);
  if (params.status && params.status !== 'all') query.append('status', params.status);
  if (params.q) query.append('q', params.q);

  const res = await api.get(`/tickets/vendor/list?${query.toString()}`);
  return res.data;
};

export const createVendorTicket = async (ticketData) => {
  const res = await api.post('/tickets/vendor/create', ticketData);
  return res.data;
};

export const replyVendorTicket = async (id, text) => {
  const res = await api.post(`/tickets/vendor/${id}/reply`, { text });
  return res.data;
};

export const resolveVendorTicket = async (id, resolutionSummary) => {
  const res = await api.patch(`/tickets/vendor/${id}/resolve`, { status: 'resolved', resolutionSummary });
  return res.data;
};
