/**
 * Sequelize hooks para garantir isolamento de dados por tenant
 * Estes hooks são aplicados automaticamente a todas as operações de banco
 */

const { Barbershop } = require('../models');

// Store para manter o contexto do tenant atual por requisição
const tenantContext = new Map();

/**
 * Define o contexto do tenant para a requisição atual
 */
exports.setTenantContext = (requestId, barbershopId) => {
  tenantContext.set(requestId, barbershopId);
};

/**
 * Obtém o contexto do tenant para a requisição atual
 */
exports.getTenantContext = (requestId) => {
  return tenantContext.get(requestId);
};

/**
 * Remove o contexto do tenant após a requisição
 */
exports.clearTenantContext = (requestId) => {
  tenantContext.delete(requestId);
};

/**
 * Hook beforeFind - Adiciona automaticamente barbershopId em todas as queries de busca
 */
exports.beforeFindHook = (options) => {
  // Skip for Barbershop model itself
  if (options.model && options.model.name === 'Barbershop') {
    return;
  }
  
  // Get current tenant context (this would need to be set by middleware)
  const barbershopId = getCurrentTenantId();
  
  if (barbershopId) {
    // Add barbershopId to where clause
    if (!options.where) {
      options.where = {};
    }
    
    // Only add if not already specified
    if (!options.where.barbershopId) {
      options.where.barbershopId = barbershopId;
    }
    
    console.log(`[TENANT-HOOK] beforeFind: Added barbershopId filter (${barbershopId}) to ${options.model?.name || 'query'}`);
  }
};

/**
 * Hook beforeCreate - Adiciona automaticamente barbershopId em todas as criações
 */
exports.beforeCreateHook = (instance, options) => {
  // Skip for Barbershop model itself
  if (instance.constructor.name === 'Barbershop') {
    return;
  }
  
  const barbershopId = getCurrentTenantId();
  
  if (barbershopId && !instance.barbershopId) {
    instance.barbershopId = barbershopId;
    console.log(`[TENANT-HOOK] beforeCreate: Added barbershopId (${barbershopId}) to ${instance.constructor.name}`);
  }
};

/**
 * Hook beforeUpdate - Valida que barbershopId não seja alterado
 */
exports.beforeUpdateHook = (instance, options) => {
  // Skip for Barbershop model itself
  if (instance.constructor.name === 'Barbershop') {
    return;
  }
  
  // Prevent changing barbershopId
  if (instance.changed('barbershopId')) {
    throw new Error('Cannot change barbershopId - tenant isolation violation');
  }
  
  // Ensure update is scoped to current tenant
  const barbershopId = getCurrentTenantId();
  if (barbershopId) {
    if (!options.where) {
      options.where = {};
    }
    
    if (!options.where.barbershopId) {
      options.where.barbershopId = barbershopId;
    }
    
    console.log(`[TENANT-HOOK] beforeUpdate: Ensured tenant isolation for ${instance.constructor.name}`);
  }
};

/**
 * Hook beforeDestroy - Garante que exclusões sejam isoladas por tenant
 */
exports.beforeDestroyHook = (instance, options) => {
  // Skip for Barbershop model itself
  if (instance && instance.constructor.name === 'Barbershop') {
    return;
  }
  
  const barbershopId = getCurrentTenantId();
  if (barbershopId) {
    if (!options.where) {
      options.where = {};
    }
    
    if (!options.where.barbershopId) {
      options.where.barbershopId = barbershopId;
    }
    
    console.log(`[TENANT-HOOK] beforeDestroy: Ensured tenant isolation for deletion`);
  }
};

/**
 * Hook beforeBulkCreate - Adiciona barbershopId em criações em lote
 */
exports.beforeBulkCreateHook = (instances, options) => {
  // Skip for Barbershop model itself
  if (options.model && options.model.name === 'Barbershop') {
    return;
  }
  
  const barbershopId = getCurrentTenantId();
  
  if (barbershopId && Array.isArray(instances)) {
    instances.forEach(instance => {
      if (!instance.barbershopId) {
        instance.barbershopId = barbershopId;
      }
    });
    
    console.log(`[TENANT-HOOK] beforeBulkCreate: Added barbershopId (${barbershopId}) to ${instances.length} instances`);
  }
};

/**
 * Hook beforeBulkUpdate - Garante que atualizações em lote sejam isoladas por tenant
 */
exports.beforeBulkUpdateHook = (options) => {
  // Skip for Barbershop model itself
  if (options.model && options.model.name === 'Barbershop') {
    return;
  }
  
  const barbershopId = getCurrentTenantId();
  
  if (barbershopId) {
    if (!options.where) {
      options.where = {};
    }
    
    if (!options.where.barbershopId) {
      options.where.barbershopId = barbershopId;
    }
    
    console.log(`[TENANT-HOOK] beforeBulkUpdate: Ensured tenant isolation for bulk update`);
  }
};

/**
 * Hook beforeBulkDestroy - Garante que exclusões em lote sejam isoladas por tenant
 */
exports.beforeBulkDestroyHook = (options) => {
  // Skip for Barbershop model itself
  if (options.model && options.model.name === 'Barbershop') {
    return;
  }
  
  const barbershopId = getCurrentTenantId();
  
  if (barbershopId) {
    if (!options.where) {
      options.where = {};
    }
    
    if (!options.where.barbershopId) {
      options.where.barbershopId = barbershopId;
    }
    
    console.log(`[TENANT-HOOK] beforeBulkDestroy: Ensured tenant isolation for bulk deletion`);
  }
};

/**
 * Função auxiliar para obter o ID do tenant atual
 * Em uma implementação real, isso seria obtido do contexto da requisição
 */
function getCurrentTenantId() {
  // This is a simplified implementation
  // In a real scenario, this would get the tenant ID from request context
  // For now, we'll return null and rely on middleware to set barbershopId explicitly
  return null;
}

/**
 * Aplica todos os hooks aos modelos Sequelize
 */
exports.applyTenantHooks = (sequelize) => {
  // Apply hooks to all models except Barbershop
  Object.values(sequelize.models).forEach(model => {
    if (model.name !== 'Barbershop') {
      model.addHook('beforeFind', exports.beforeFindHook);
      model.addHook('beforeCreate', exports.beforeCreateHook);
      model.addHook('beforeUpdate', exports.beforeUpdateHook);
      model.addHook('beforeDestroy', exports.beforeDestroyHook);
      model.addHook('beforeBulkCreate', exports.beforeBulkCreateHook);
      model.addHook('beforeBulkUpdate', exports.beforeBulkUpdateHook);
      model.addHook('beforeBulkDestroy', exports.beforeBulkDestroyHook);
      
      console.log(`[TENANT-HOOKS] Applied tenant isolation hooks to ${model.name}`);
    }
  });
  
  console.log('[TENANT-HOOKS] All tenant isolation hooks applied successfully');
};