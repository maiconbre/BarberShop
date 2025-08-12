const { DataTypes } = require('sequelize');
const sequelize = require('./database');
const Service = sequelize.define('Service', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: false
  }
});

// Relação muitos-para-muitos entre Serviços e Barbeiros

module.exports = Service;