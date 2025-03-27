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
const barberScheduleRoutes = require('./routes/barberScheduleRoutes');
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

// Rotas de configuração de horários dos barbeiros
app.use('/api/barber-schedules', barberScheduleRoutes);

// Simplificar as rotas de appointments
app.post('/api/appointments', protect, async (req, res) => {
  try {
    const appointments = Array.isArray(req.body) ? req.body : [req.body];
    
    // Garantir que cada appointment tenha um ID único
    const createdAppointments = await Promise.all(
      appointments.map(appointment => 
        Appointment.create({
          id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          ...appointment,
          status: appointment.clientName === 'BLOCKED' ? 'confirmed' : 'pending'
        })
      )
    );
    
    res.status(201).json({
      success: true,
      data: createdAppointments
    });
  } catch (error) {
    console.error('Erro ao criar agendamentos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar agendamentos'
    });
  }
});

// Atualizar status do agendamento
app.patch('/api/appointments/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const appointment = await Appointment.findByPk(id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Agendamento não encontrado' });
    }

    // Verificar permissões: apenas o próprio barbeiro ou um admin pode modificar o agendamento
    if (req.user.role !== 'admin' && req.user.id !== appointment.barberId) {
      return res.status(403).json({
        success: false,
        message: 'Não autorizado a modificar agendamentos de outro barbeiro'
      });
    }

    await appointment.update({ status });
    res.json({ success: true, data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.delete('/api/appointments/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const appointment = await Appointment.findByPk(id);
    
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Agendamento não encontrado' });
    }

    // Verificar permissões: apenas o próprio barbeiro ou um admin pode excluir o agendamento
    if (req.user.role !== 'admin' && req.user.id !== appointment.barberId) {
      return res.status(403).json({
        success: false,
        message: 'Não autorizado a excluir agendamentos de outro barbeiro'
      });
    }

    await appointment.destroy();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Simplificar a rota GET de appointments
app.get('/api/appointments', async (req, res) => {
  try {
    const appointments = await Appointment.findAll();
    res.json({
      success: true,
      data: appointments
    });
  } catch (error) {
    console.error('Erro ao buscar agendamentos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar agendamentos'
    });
  }
});

const PORT = process.env.PORT || 3000;

// Modificar a ordem de inicialização
const startServer = async () => {
  try {
    // Tentar conectar ao banco
    await sequelize.authenticate();
    console.log('✅ Banco de dados conectado');

    // Sincronizar modelos
    await sequelize.sync({ force: false });
    console.log('✅ Modelos sincronizados');

    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`✅ Servidor rodando na porta ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Erro fatal:', error.message);
    process.exit(1);
  }
};

startServer();

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
