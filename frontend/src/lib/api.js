import axios from 'axios';

const trimTrailingSlash = (value) => value.replace(/\/+$/, '');

export const API_BASE_URL = trimTrailingSlash(
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
);

export const api = axios.create({
  baseURL: API_BASE_URL,
});

export const getAuthHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
});
