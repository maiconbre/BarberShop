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
  }
}, { timestamps: false });

module.exports = BarberServices;