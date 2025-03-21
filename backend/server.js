const express = require('express');
const cors = require('cors');
require('dotenv').config();
const rateLimit = require('express-rate-limit');

const sequelize = require('./models/database');
const Barber = require('./models/Barber');
const Appointment = require('./models/Appointment');
const User = require('./models/User');
const Comment = require('./models/Comment');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/users');
const barberRoutes = require('./routes/barberRoutes');
const commentRoutes = require('./routes/commentRoutes');
const authController = require('./controllers/authController');
const { protect, barber } = require('./middleware/authMiddleware');

const app = express();

// Configuração do CORS para permitir requisições do Vercel e outras origens
app.use(cors({
  origin: ['https://barber-shop-ten-mu.vercel.app', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Middleware para processar JSON e adicionar headers de segurança
app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

// Rotas de autenticação
app.use('/api/auth', authRoutes);

// Rotas de usuário
app.use('/api/users', userRoutes);

// Rotas de barbeiro
app.use('/api/barbers', barberRoutes);

// Rotas de comentários
app.use('/api/comments', commentRoutes);


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

// Nova rota para atualizar barbeiros

app.patch('/api/barbers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const barber = await Barber.findByPk(id);
    if (!barber) {
      return res.status(404).json({
        success: false,
        message: 'Barbeiro não encontrado'
      });
    }
    const updatedBarber = await barber.update(req.body);
    res.json({
      success: true,
      data: updatedBarber
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}
);


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
    // Sincronizar o banco de dados sem forçar a recriação das tabelas
    await sequelize.sync({ force: false });
    console.log('Banco de dados sincronizado');
    

    // Seed initial users
    const usersCount = await User.count();
    if (usersCount === 0) {
      await authController.seedUsers();
    } else {
      console.log(`Já existem ${usersCount} usuários no banco de dados.`);
    }

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Erro ao inicializar o banco de dados:', error);
  }
};

initDatabase();

// Importar o middleware de rate limiting personalizado
const { createRateLimiter } = require('./middleware/rateLimitMiddleware');

// Criar o middleware de rate limiting com configurações personalizadas
const apiLimiter = createRateLimiter({
  windowMs: 5000, // 5 segundos
  maxRequests: 3, // máximo de 3 requisições
  message: {
    success: false,
    message: 'Muitas requisições. Por favor, aguarde 5 segundos antes de tentar novamente.'
  }
});

// Aplicar rate limiter em rotas específicas
app.use('/api/comments', apiLimiter);
app.use('/api/appointments', apiLimiter);
app.use('/api/barbers', apiLimiter);
