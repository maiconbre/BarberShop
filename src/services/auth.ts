import axios from 'axios';

export const authenticateUser = async (username: string, password: string) => {
  try {
    const response = await axios.post('http://localhost:3000/api/auth/login', {
      username,
      password
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.data || !response.data.token) {
      throw new Error('Token não encontrado na resposta');
    }

    // Store token in both localStorage and sessionStorage for consistency
    localStorage.setItem('token', response.data.token);
    sessionStorage.setItem('token', response.data.token);

    return response.data.user;
  } catch (error: any) {
    if (error.response?.status === 401) {
      throw new Error('Credenciais inválidas');
    }
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Erro ao autenticar usuário');
  }
};