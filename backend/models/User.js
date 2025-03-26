const { DataTypes } = require('sequelize');
const sequelize = require('./database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'client'
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  timestamps: true,
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

// Instance method to check password
User.prototype.comparePassword = async function (candidatePassword) {
  try {
    console.log('=== Debug de Autenticação ===');
    console.log('Usuário:', this.username);
    console.log('Senha fornecida:', candidatePassword);
    console.log('Hash armazenado:', this.password);

    // Verificar se a senha está vazia ou indefinida
    if (!candidatePassword) {
      console.log('ERRO: Senha vazia ou indefinida');
      return false;
    }

    // Adicionar log do processo de comparação
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    console.log('Resultado da comparação:', isMatch);
    console.log('=== Fim do Debug ===');
    
    return isMatch;
  } catch (error) {
    console.error('Erro na comparação de senha:', error);
    console.log('Stack trace:', error.stack);
    return false;
  }
};

module.exports = User;
