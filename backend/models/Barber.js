const { DataTypes } = require('sequelize');
const sequelize = require('./database');
const Barber = sequelize.define('Barber', {
  id: {
    type: DataTypes.STRING,
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
  }
});

// Relação muitos-para-muitos entre Barbeiros e Serviços

module.exports = Barber;