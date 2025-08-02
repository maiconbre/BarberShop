const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const { generateSecurityReport } = require('../middleware/securityLogger');
const fs = require('fs');
const path = require('path');

// Rota para obter relatório de segurança (apenas admin)
router.get('/report', protect, admin, async (req, res) => {
  try {
    const report = generateSecurityReport();
    
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Erro ao gerar relatório de segurança:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao gerar relatório de segurança'
    });
  }
});

// Rota para obter logs de segurança detalhados (apenas admin)
router.get('/logs', protect, admin, async (req, res) => {
  try {
    const { limit = 100, severity, eventType } = req.query;
    const securityLogFile = path.join(__dirname, '..', 'logs', 'security.log');
    
    if (!fs.existsSync(securityLogFile)) {
      return res.json({
        success: true,
        data: [],
        message: 'Nenhum log de segurança encontrado'
      });
    }
    
    const logs = fs.readFileSync(securityLogFile, 'utf8')
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(log => log !== null)
      .reverse(); // Mais recentes primeiro
    
    let filteredLogs = logs;
    
    // Filtrar por severidade se especificado
    if (severity) {
      filteredLogs = filteredLogs.filter(log => 
        log.severity === severity.toUpperCase()
      );
    }
    
    // Filtrar por tipo de evento se especificado
    if (eventType) {
      filteredLogs = filteredLogs.filter(log => 
        log.eventType === eventType.toUpperCase()
      );
    }
    
    // Limitar número de resultados
    const limitedLogs = filteredLogs.slice(0, parseInt(limit));
    
    res.json({
      success: true,
      data: limitedLogs,
      total: filteredLogs.length,
      showing: limitedLogs.length
    });
  } catch (error) {
    console.error('Erro ao obter logs de segurança:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter logs de segurança'
    });
  }
});

// Rota para limpar logs antigos (apenas admin)
router.delete('/logs/cleanup', protect, admin, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const securityLogFile = path.join(__dirname, '..', 'logs', 'security.log');
    
    if (!fs.existsSync(securityLogFile)) {
      return res.json({
        success: true,
        message: 'Nenhum log para limpar'
      });
    }
    
    const cutoffDate = Date.now() - (parseInt(days) * 24 * 60 * 60 * 1000);
    
    const logs = fs.readFileSync(securityLogFile, 'utf8')
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(log => log !== null);
    
    const recentLogs = logs.filter(log => 
      new Date(log.timestamp).getTime() > cutoffDate
    );
    
    const removedCount = logs.length - recentLogs.length;
    
    // Reescreve o arquivo apenas com logs recentes
    const newContent = recentLogs
      .map(log => JSON.stringify(log))
      .join('\n') + '\n';
    
    fs.writeFileSync(securityLogFile, newContent);
    
    res.json({
      success: true,
      message: `Limpeza concluída. ${removedCount} logs antigos removidos.`,
      removedCount,
      remainingCount: recentLogs.length
    });
  } catch (error) {
    console.error('Erro ao limpar logs:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao limpar logs'
    });
  }
});

// Rota para obter estatísticas em tempo real
router.get('/stats/realtime', protect, admin, async (req, res) => {
  try {
    const report = generateSecurityReport();
    
    // Adiciona informações em tempo real
    const realtimeStats = {
      ...report,
      serverUptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      timestamp: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: realtimeStats
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas em tempo real:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter estatísticas em tempo real'
    });
  }
});

module.exports = router;