import axios from 'axios';


interface AuthResponse {
  data: {
    data: {
      token: string;
      user: unknown;
    }
  }
}



const axiosInstance = axios.create({
  timeout: 30000, // 30 segundos
  baseURL: `${(import.meta).env.VITE_API_URL}/api`
});

const retryRequest = async (fn: () => Promise<unknown>, retries = 2, delay = 1000) => {
  try {
    return await fn();
  } catch (error: unknown) {
    if (retries === 0) throw error;
    if (
      (error as { code?: string }).code === 'ECONNABORTED' ||
      (error as { message?: string }).message?.includes('timeout')
    ) {
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

    if (!response || typeof response !== 'object' || !('data' in (response as AuthResponse))) {
      throw new Error('Token não encontrado na resposta');
    }

    const typedResponse = response as AuthResponse;
    const { token, user } = typedResponse.data.data;
    // Armazenar apenas no localStorage para persistência de 6 horas
    // Usar 'authToken' para consistência com o resto da aplicação
    localStorage.setItem('authToken', token);
    localStorage.setItem('token', token); // Manter compatibilidade
    return user;
  } catch (error: unknown) {
    if (
      (error as { code?: string }).code === 'ECONNABORTED' || 
      (error as { message?: string }).message?.includes('timeout')
    ) {
      throw new Error('Tempo de resposta do servidor excedido. Por favor, tente novamente.');
    }
    if ((error as { response?: { status: number } }).response?.status === 401) {
      throw new Error('Credenciais inválidas');
    }
    if ((error as { response?: { data?: { message?: string } } }).response?.data?.message) {
      throw new Error((error as { response: { data: { message: string } } }).response.data.message);
    }
    throw new Error('Erro ao autenticar usuário');
  }
};