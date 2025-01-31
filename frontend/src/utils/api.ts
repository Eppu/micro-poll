import axios from 'axios';

const API_URL = 'http://localhost:5050/api/v1';

export interface PollResponse {
  id: string;
}

export const createPoll = async (pollData: {
  question: string;
  options: string[];
  timeLimit: number;
}): Promise<PollResponse> => {
  const res = await axios.post(`${API_URL}/polls`, pollData);
  return res.data;
};

export const fetchPoll = async (pollId: string) => {
  const res = await axios.get(`${API_URL}/polls/${pollId}`);
  return res.data;
};

export const vote = async (pollId: string, option: string) => {
  const res = await axios.post(`${API_URL}/polls/${pollId}/vote`, { option });
  return res.data;
};
