// app/api/endpoints.js

const BASE_URL = 'http://127.0.0.1:8090/api/v1';

export const endpoints = {
  login: `${BASE_URL}/sensor/login`,
  logout: `${BASE_URL}/sensor/logout`,
  register: `${BASE_URL}/sensor/register`,
  getUserInfo: `${BASE_URL}/sensor/userinfo`,
  verifyToken: `${BASE_URL}/sensor/verify-token`,
  changePassword: `${BASE_URL}/sensor/change-password`,
  resetPassword: `${BASE_URL}/sensor/reset-password`,
};
