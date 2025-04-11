import axios from 'axios';

const API_URL = 'http://localhost:8000/api/';

export const login = (credentials) => {
  return axios.post(`${API_URL}login/`, credentials);
};

export const getGameState = (gameId) => {
  return axios.get(`${API_URL}game/${gameId}/`);
};
