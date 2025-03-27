const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const sequelize = require('../models/database');
const User = require('../models/User');

const createAdmin = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conectado ao banco de dados');

    const adminData = {
      id: uuidv4(),
      username: 'admin',
      password: '123123',
      name: 'Administrador',
      role: 'admin'
    };

    const existingAdmin = await User.findOne({
      where: { username: adminData.username }
    });

    if (existingAdmin) {
      console.log('⚠️ Admin já existe!');
      return;
    }

    const admin = await User.create(adminData);
    console.log('✅ Admin criado com sucesso!');
    console.log('📝 Credenciais:');
    console.log('Username:', adminData.username);
    console.log('Password:', adminData.password);

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await sequelize.close();
  }
};

createAdmin();
