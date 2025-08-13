const { DataTypes } = require('sequelize');
const sequelize = require('./database');

const BarberServices = sequelize.define('BarberServices', {
  BarberId: {
    type: DataTypes.STRING,
    primaryKey: true,
    references: {
      model: 'Barbers',
      key: 'id'
    }
  },
  ServiceId: {
    type: DataTypes.UUID,
    primaryKey: true,
    references: {
      model: 'Services',
      key: 'id'
    }
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
  timestamps: false,
  indexes: [
    {
      fields: ['barbershopId']
    }
  ]
});

module.exports = BarberServices;