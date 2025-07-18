// app/api/endpoints.js

const BASE_URL = 'http://127.0.0.1:8090/api/v1';

const endpoints = {
  login: `${BASE_URL}/sensor/login`,
  logout: `${BASE_URL}/sensor/logout`,
};

export default endpoints;
