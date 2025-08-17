const Barbershop = require('./Barbershop.js');
const Appointment = require('./Appointment.js');
const Barber = require('./Barber.js');
const Service = require('./Service.js');
const Comment = require('./Comment.js');
const User = require('./User.js');
const BarberServices = require('./BarberServices.js');

// Define associations
// Barbershop associations
Barbershop.hasMany(User, { foreignKey: 'barbershopId', onDelete: 'CASCADE' });
Barbershop.hasMany(Barber, { foreignKey: 'barbershopId', onDelete: 'CASCADE' });
Barbershop.hasMany(Service, { foreignKey: 'barbershopId', onDelete: 'CASCADE' });
Barbershop.hasMany(Appointment, { foreignKey: 'barbershopId', onDelete: 'CASCADE' });
Barbershop.hasMany(Comment, { foreignKey: 'barbershopId', onDelete: 'CASCADE' });

// Reverse associations
User.belongsTo(Barbershop, { foreignKey: 'barbershopId' });
Barber.belongsTo(Barbershop, { foreignKey: 'barbershopId' });
Service.belongsTo(Barbershop, { foreignKey: 'barbershopId' });
Appointment.belongsTo(Barbershop, { foreignKey: 'barbershopId' });
Comment.belongsTo(Barbershop, { foreignKey: 'barbershopId' });

// Many-to-many associations between Barber and Service
Barber.belongsToMany(Service, { through: BarberServices, timestamps: false });
Service.belongsToMany(Barber, { through: BarberServices, timestamps: false });

// Barber-User association (one-to-one)
Barber.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasOne(Barber, { foreignKey: 'userId', as: 'barber' });

module.exports = {
  Barbershop,
  Appointment,
  Barber,
  Service,
  Comment,
  User,
  BarberServices
};