const { DataTypes } = require('sequelize');
const sequelize = require('./database');
const Barber = sequelize.define('Barber', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  whatsapp: {
    type: DataTypes.STRING,
    allowNull: false
  },
  pix: {
    type: DataTypes.STRING,
    allowNull: false
  },
  barbershopId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Barbershops',
      key: 'id'
    }
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['barbershopId', 'id']
    },
    {
      fields: ['barbershopId']
    }
  ]
});

// Relação muitos-para-muitos entre Barbeiros e Serviços

module.exports = Barber;