import axios from 'axios';

const axiosInstance = axios.create({
  timeout: 30000, // 30 segundos
  baseURL: 'https://barber-backend-spm8.onrender.com/api'
});

const retryRequest = async (fn: () => Promise<any>, retries = 2, delay = 1000) => {
  try {
    return await fn();
  } catch (error: any) {
    if (retries === 0) throw error;
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryRequest(fn, retries - 1, delay * 2);
    }
    throw error;
  }
};

export const authenticateUser = async (username: string, password: string) => {
  try {
    const response = await retryRequest(() => 
      axiosInstance.post('/auth/login', {
        username,
        password
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
    );

    if (!response.data || !response.data.data || !response.data.data.token) {
      throw new Error('Token não encontrado na resposta');
    }

    const { token, user } = response.data.data;
    localStorage.setItem('token', token);
    sessionStorage.setItem('token', token);

    return user;
  } catch (error: any) {
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      throw new Error('Tempo de resposta do servidor excedido. Por favor, tente novamente.');
    }
    if (error.response?.status === 401) {
      throw new Error('Credenciais inválidas');
    }
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Erro ao autenticar usuário');
  }
};