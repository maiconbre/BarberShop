const { DataTypes } = require('sequelize');
const sequelize = require('./database');

const Barbershop = sequelize.define('Barbershop', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 100]
    }
  },
  slug: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      len: [3, 50],
      is: /^[a-z0-9-]+$/ // Only lowercase letters, numbers, and hyphens
    }
  },
  owner_email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  plan_type: {
    type: DataTypes.ENUM('free', 'pro'),
    defaultValue: 'free',
    allowNull: false
  },
  settings: {
    type: DataTypes.JSONB,
    defaultValue: {},
    allowNull: false
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['slug']
    },
    {
      fields: ['owner_email']
    },
    {
      fields: ['plan_type']
    }
  ]
});

module.exports = Barbershop;