const Appointment = require('./Appointment.js');
const Barber = require('./Barber.js');
const Service = require('./Service.js');

// Definir associações muitos-para-muitos
Barber.belongsToMany(Service, { through: BarberServices, timestamps: false });
Service.belongsToMany(Barber, { through: BarberServices, timestamps: false });
const Comment = require('./Comment.js');
const User = require('./User.js');
const BarberServices = require('./BarberServices.js');

module.exports = {
  Appointment,
  Barber,
  Service,
  Comment,
  User,
  BarberServices
};