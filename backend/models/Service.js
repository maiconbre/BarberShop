const { DataTypes } = require('sequelize');
const sequelize = require('./database');
const Barber = require('./Barber');

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
Service.belongsToMany(Barber, { through: 'BarberServices' });
Barber.belongsToMany(Service, { through: 'BarberServices' });

module.exports = Service;