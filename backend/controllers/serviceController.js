const Service = require('../models/Service');

// Obter todos os serviços
/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
exports.getAllServices = async (req, res) => {
  const requestId = Date.now();
  console.log(`[${new Date().toISOString()}] [REQUEST:${requestId}] Iniciando busca de serviços`);
  console.log(`[${new Date().toISOString()}] [REQUEST:${requestId}] IP: ${req.ip}, User-Agent: ${req.get('user-agent')}`);
  
  try {
    let whereClause = {};
    
    // Se há contexto de tenant, filtrar por barbearia
    if (req.tenant && req.tenant.barbershopId) {
      whereClause.barbershopId = req.tenant.barbershopId;
      console.log(`[${new Date().toISOString()}] [REQUEST:${requestId}] Executando Service.findAll() para barbershop: ${req.tenant.barbershopId}`);
    } else {
      // Se não há tenant, buscar todos os serviços (modo público)
      console.log(`[${new Date().toISOString()}] [REQUEST:${requestId}] Executando Service.findAll() - modo público`);
    }

    const services = await Service.findAll({
      where: whereClause
    });
    console.log(`[${new Date().toISOString()}] [REQUEST:${requestId}] Serviços encontrados: ${services.length}`);
    
    return res.status(200).json({
      success: true,
      data: services
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] [REQUEST:${requestId}] Erro ao buscar serviços:`, error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar serviços',
      error: error.message
    });
  } finally {
    console.log(`[${new Date().toISOString()}] [REQUEST:${requestId}] Finalizando busca de serviços`);
  }
};

// Obter serviço por ID
/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
exports.getServiceById = async (req, res) => {
  try {
    // Verificar contexto de tenant
    if (!req.tenant || !req.tenant.barbershopId) {
      return res.status(400).json({
        success: false,
        message: 'Contexto de barbearia não encontrado',
        code: 'TENANT_CONTEXT_MISSING'
      });
    }

    const service = await Service.findOne({
      where: {
        id: req.params.id,
        barbershopId: req.tenant.barbershopId
      }
    });
    
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Serviço não encontrado'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: service
    });
  } catch (error) {
    console.error('Erro ao buscar serviço:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar serviço',
      error: error.message
    });
  }
};

// Criar novo serviço
/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
exports.createService = async (req, res) => {
  try {
    // Verificar contexto de tenant
    if (!req.tenant || !req.tenant.barbershopId) {
      return res.status(400).json({
        success: false,
        message: 'Contexto de barbearia não encontrado',
        code: 'TENANT_CONTEXT_MISSING'
      });
    }

    const { name, price } = req.body;
    
    // Validações básicas
    if (!name || !price) {
      return res.status(400).json({
        success: false,
        message: 'Nome e preço são obrigatórios'
      });
    }
    
    // Verificar se o serviço já existe na barbearia
    const existingService = await Service.findOne({ 
      where: { 
        name,
        barbershopId: req.tenant.barbershopId
      }
    });
    if (existingService) {
      return res.status(400).json({
        success: false,
        message: 'Já existe um serviço com este nome nesta barbearia'
      });
    }
    
    // Criar o serviço
    const service = await Service.create({
      name,
      price,
      barbershopId: req.tenant.barbershopId
    });
    
    return res.status(201).json({
      success: true,
      message: 'Serviço criado com sucesso',
      data: service
    });
  } catch (error) {
    console.error('Erro ao criar serviço:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao criar serviço',
      error: error.message
    });
  }
};

// Atualizar serviço
/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
exports.updateService = async (req, res) => {
  try {
    // Verificar contexto de tenant
    if (!req.tenant || !req.tenant.barbershopId) {
      return res.status(400).json({
        success: false,
        message: 'Contexto de barbearia não encontrado',
        code: 'TENANT_CONTEXT_MISSING'
      });
    }

    const { id } = req.params;
    const { name, price } = req.body;
    
    // Buscar o serviço na barbearia
    const service = await Service.findOne({
      where: {
        id,
        barbershopId: req.tenant.barbershopId
      }
    });
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Serviço não encontrado'
      });
    }
    
    // Atualizar os campos
    if (name) service.name = name;
    if (price !== undefined) service.price = price;
    await service.save();
    
    return res.status(200).json({
      success: true,
      message: 'Serviço atualizado com sucesso',
      data: service
    });
  } catch (error) {
    console.error('Erro ao atualizar serviço:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao atualizar serviço',
      error: error.message
    });
  }
};

// Excluir serviço
/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
exports.deleteService = async (req, res) => {
  try {
    // Verificar contexto de tenant
    if (!req.tenant || !req.tenant.barbershopId) {
      return res.status(400).json({
        success: false,
        message: 'Contexto de barbearia não encontrado',
        code: 'TENANT_CONTEXT_MISSING'
      });
    }

    const { id } = req.params;
    
    // Buscar o serviço na barbearia
    const service = await Service.findOne({
      where: {
        id,
        barbershopId: req.tenant.barbershopId
      }
    });
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Serviço não encontrado'
      });
    }
    
    // Excluir o serviço
    await service.destroy();
    
    return res.status(200).json({
      success: true,
      message: 'Serviço excluído com sucesso'
    });
  } catch (error) {
    console.error('Erro ao excluir serviço:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao excluir serviço',
      error: error.message
    });
  }
};

// Associar barbeiros a um serviço
/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
exports.associateBarbers = async (req, res) => {
  try {
    // Verificar contexto de tenant
    if (!req.tenant || !req.tenant.barbershopId) {
      return res.status(400).json({
        success: false,
        message: 'Contexto de barbearia não encontrado',
        code: 'TENANT_CONTEXT_MISSING'
      });
    }

    const { id } = req.params;
    const { barberIds } = req.body;
    
    if (!barberIds || !Array.isArray(barberIds)) {
      return res.status(400).json({
        success: false,
        message: 'IDs de barbeiros são obrigatórios'
      });
    }
    
    // Buscar o serviço na barbearia
    const service = await Service.findOne({
      where: {
        id,
        barbershopId: req.tenant.barbershopId
      }
    });
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Serviço não encontrado'
      });
    }
    
    // Buscar os barbeiros na mesma barbearia
    const Barber = require('../models/Barber');
    const barbers = await Barber.findAll({
      where: { 
        id: barberIds,
        barbershopId: req.tenant.barbershopId
      }
    });
    
    if (barbers.length !== barberIds.length) {
      return res.status(400).json({
        success: false,
        message: 'Um ou mais barbeiros não foram encontrados nesta barbearia'
      });
    }
    
    // Associar os barbeiros ao serviço
    await service.setBarbers(barbers);
    
    // Buscar o serviço atualizado com os barbeiros associados
    const updatedService = await Service.findOne({
      where: {
        id,
        barbershopId: req.tenant.barbershopId
      },
      include: [{ model: Barber, attributes: ['id', 'name'] }]
    });
    
    return res.status(200).json({
      success: true,
      message: 'Barbeiros associados com sucesso',
      data: updatedService
    });
  } catch (error) {
    console.error('Erro ao associar barbeiros:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao associar barbeiros',
      error: error.message
    });
  }
};

// Obter serviços por barbeiro
/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
exports.getServicesByBarber = async (req, res) => {
  try {
    // Verificar contexto de tenant
    if (!req.tenant || !req.tenant.barbershopId) {
      return res.status(400).json({
        success: false,
        message: 'Contexto de barbearia não encontrado',
        code: 'TENANT_CONTEXT_MISSING'
      });
    }

    const { barberId } = req.params;
    
    // Verificar se o barbeiro existe na barbearia
    const Barber = require('../models/Barber');
    const barber = await Barber.findOne({
      where: {
        id: barberId,
        barbershopId: req.tenant.barbershopId
      }
    });
    if (!barber) {
      return res.status(404).json({
        success: false,
        message: 'Barbeiro não encontrado nesta barbearia'
      });
    }
    
    // Buscar os serviços associados ao barbeiro na mesma barbearia
    const services = await Service.findAll({
      where: { barbershopId: req.tenant.barbershopId },
      include: [{
        model: Barber,
        where: { id: barberId },
        attributes: []
      }]
    });
    
    return res.status(200).json({
      success: true,
      data: services
    });
  } catch (error) {
    console.error('Erro ao buscar serviços do barbeiro:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar serviços do barbeiro',
      error: error.message
    });
  }
};