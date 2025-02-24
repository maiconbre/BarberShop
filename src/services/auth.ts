interface User {
  id: string;
  email: string;
  role: string;
  name: string;
}

export async function authenticateUser(email: string, password: string): Promise<User> {
  // Mock admin credentials
  const mockUsers = [
    {
      id: '1',
      email: 'admin',
      password: '123456',
      role: 'admin',
      name: 'Admin'
    },
    {
      id: '2',
      email: 'maicon@grbarber.com',
      password: '123456',
      role: 'barber',
      name: 'Maicon'
    },
    {
      id: '3',
      email: 'brendon@grbarber.com',
      password: '123456',
      role: 'barber',
      name: 'Brendon'
    }
  ];

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  const user = mockUsers.find(u => u.email === email && u.password === password);

  if (!user) {
    throw new Error('Invalid credentials');
  }

  // Don't send password in the response
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}