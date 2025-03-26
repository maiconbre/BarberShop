const { DataTypes } = require('sequelize');
const sequelize = require('./database');

const BarberSchedule = sequelize.define('BarberSchedule', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  barberId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  timeSlots: {
    type: DataTypes.JSON,
    allowNull: false
  }
});

module.exports = BarberSchedule;