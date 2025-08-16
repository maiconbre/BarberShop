const { DataTypes } = require('sequelize');
/** @type {import('sequelize').Sequelize} */
const sequelize = require('./database');
const Service = sequelize.define('Service', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  price: {
    type: DataTypes.FLOAT,
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
      fields: ['barbershopId', 'name']
    }
  ]
});

// Relação muitos-para-muitos entre Serviços e Barbeiros

module.exports = Service;