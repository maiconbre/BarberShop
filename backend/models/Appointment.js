const { DataTypes } = require('sequelize');
const sequelize = require('./database');

const Appointment = sequelize.define('Appointment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  clientName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  serviceName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  time: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'pending'
  },
  barberId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Barbers',
      key: 'id'
    }
  },
  barberName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  wppclient: {
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
      fields: ['barbershopId', 'date']
    },
    {
      fields: ['barbershopId', 'barberId']
    },
    {
      fields: ['barbershopId', 'status']
    }
  ]
});

module.exports = Appointment;  // Exportação correta