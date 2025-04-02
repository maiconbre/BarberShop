const Service = require('../models/Service');
const Barber = require('../models/Barber');

// Obter todos os serviços
exports.getAllServices = async (req, res) => {
  try {
    const services = await Service.findAll({
      include: [{ model: Barber, attributes: ['id', 'name'] }]
    });
    
    return res.status(200).json({
      success: true,
      data: services
    });
  } catch (error) {
    console.error('Erro ao buscar serviços:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar serviços',
      error: error.message
    });
  }
};

// Obter serviço por ID
exports.getServiceById = async (req, res) => {
  try {
    const service = await Service.findByPk(req.params.id, {
      include: [{ model: Barber, attributes: ['id', 'name'] }]
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
exports.createService = async (req, res) => {
  try {
    const { name, price, barbers } = req.body;
    
    // Validações básicas
    if (!name || !price) {
      return res.status(400).json({
        success: false,
        message: 'Nome e preço são obrigatórios'
      });
    }
    
    // Verificar se o serviço já existe
    const existingService = await Service.findOne({ where: { name } });
    if (existingService) {
      return res.status(400).json({
        success: false,
        message: 'Já existe um serviço com este nome'
      });
    }
    
    // Criar o serviço
    const service = await Service.create({
      name,
      price
    });
    
    // Associar barbeiros se fornecidos
    if (barbers && barbers.length > 0) {
      const barberInstances = await Barber.findAll({
        where: { id: barbers }
      });
      await service.setBarbers(barberInstances);
    }
    
    // Buscar o serviço com os barbeiros associados
    const createdService = await Service.findByPk(service.id, {
      include: [{ model: Barber, attributes: ['id', 'name'] }]
    });
    
    return res.status(201).json({
      success: true,
      message: 'Serviço criado com sucesso',
      data: createdService
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
exports.updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, barbers } = req.body;
    
    // Buscar o serviço
    const service = await Service.findByPk(id);
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
    
    // Atualizar associações de barbeiros se fornecidos
    if (barbers && Array.isArray(barbers)) {
      const barberInstances = await Barber.findAll({
        where: { id: barbers }
      });
      await service.setBarbers(barberInstances);
    }
    
    // Buscar o serviço atualizado com os barbeiros associados
    const updatedService = await Service.findByPk(id, {
      include: [{ model: Barber, attributes: ['id', 'name'] }]
    });
    
    return res.status(200).json({
      success: true,
      message: 'Serviço atualizado com sucesso',
      data: updatedService
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
exports.deleteService = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Buscar o serviço
    const service = await Service.findByPk(id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Serviço não encontrado'
      });
    }
    
    // Remover associações com barbeiros
    await service.setBarbers([]);
    
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
exports.associateBarbers = async (req, res) => {
  try {
    const { id } = req.params;
    const { barberIds } = req.body;
    
    if (!barberIds || !Array.isArray(barberIds)) {
      return res.status(400).json({
        success: false,
        message: 'IDs de barbeiros são obrigatórios'
      });
    }
    
    // Buscar o serviço
    const service = await Service.findByPk(id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Serviço não encontrado'
      });
    }
    
    // Buscar os barbeiros
    const barbers = await Barber.findAll({
      where: { id: barberIds }
    });
    
    if (barbers.length !== barberIds.length) {
      return res.status(400).json({
        success: false,
        message: 'Um ou mais barbeiros não foram encontrados'
      });
    }
    
    // Associar os barbeiros ao serviço
    await service.setBarbers(barbers);
    
    // Buscar o serviço atualizado com os barbeiros associados
    const updatedService = await Service.findByPk(id, {
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
exports.getServicesByBarber = async (req, res) => {
  try {
    const { barberId } = req.params;
    
    // Verificar se o barbeiro existe
    const barber = await Barber.findByPk(barberId);
    if (!barber) {
      return res.status(404).json({
        success: false,
        message: 'Barbeiro não encontrado'
      });
    }
    
    // Buscar os serviços associados ao barbeiro
    const services = await barber.getServices();
    
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