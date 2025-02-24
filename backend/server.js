const express = require('express');
const cors = require('cors');
require('dotenv').config();

const sequelize = require('./models/database');
const Barber = require('./models/Barber');
const Appointment = require('./models/Appointment');

const app = express();

app.use(cors());
app.use(express.json());

// Nova rota para listar barbeiros
app.get('/api/barbers', async (req, res) => {
  try {
    const barbers = await Barber.findAll();
    res.json({
      success: true,
      data: barbers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Rota para criar agendamentos
app.post('/api/appointments', async (req, res) => {
  try {
    const appointment = await Appointment.create({
      id: Date.now().toString(),
      ...req.body
    });
    
    res.status(201).json({
      success: true,
      data: appointment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});
// Atualizar status do agendamento
// Adicione estas rotas no servidor
app.patch('/api/appointments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const appointment = await Appointment.findByPk(id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Agendamento não encontrado' });
    }

    await appointment.update({ status });
    res.json({ success: true, data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.delete('/api/appointments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const appointment = await Appointment.findByPk(id);
    
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Agendamento não encontrado' });
    }

    await appointment.destroy();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
// Rota para listar agendamentos
app.get('/api/appointments', async (req, res) => {
  try {
    const appointments = await Appointment.findAll();
    res.json({
      success: true,
      data: appointments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

const PORT = process.env.PORT || 3000;

// Inicialização do banco de dados
const initDatabase = async () => {
  try {
    await sequelize.sync();
    
    // Verificar se já existem barbeiros
    const barbersCount = await Barber.count();
    if (barbersCount === 0) {
      // Adicionar os barbeiros iniciais
      await Barber.bulkCreate([
        {
          id: '01',
          name: 'Maicon',
          whatsapp: '21997764645',
          pix: '21997761646'
        },
        {
          id: '02',
          name: 'Brendon',
          whatsapp: '2199774658',
          pix: '21554875965'
        }
      ]);
      console.log('Barbeiros iniciais adicionados com sucesso!');
    }

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Erro ao inicializar o banco de dados:', error);
  }
};

initDatabase();