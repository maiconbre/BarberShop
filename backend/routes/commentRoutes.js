const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const { protect, admin } = require('../middleware/authMiddleware');
const { limitRepeatedRequests } = require('../middleware/requestLimitMiddleware');
const rateLimitConfig = require('../config/rateLimits');

// Configuração do limitador de chamadas repetidas para comentários
// Mais restritivo para criação de comentários para evitar spam
const commentLimiter = limitRepeatedRequests({
  ...rateLimitConfig.comments.create,
  message: {
    success: false,
    message: 'Muitas requisições idênticas. Esta operação está temporariamente bloqueada.'
  }
});

// Configuração do limitador para leitura de comentários
// Configuração mais permissiva para leitura
const commentReadLimiter = limitRepeatedRequests({
  ...rateLimitConfig.comments.read,
  message: {
    success: false,
    message: 'Muitas requisições idênticas. Esta operação está temporariamente bloqueada.'
  }
});

// Rota para criar um novo comentário (pública) com limitador
router.post('/', commentLimiter, async (req, res) => {
  try {
    const { name, comment } = req.body;

    if (!name || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Nome e comentário são obrigatórios'
      });
    }

    const newComment = await Comment.create({
      id: Date.now().toString(),
      name,
      comment,
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      data: newComment
    });
  } catch (error) {
    console.error('Erro ao criar comentário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar comentário'
    });
  }
});

// Rota para listar todos os comentários (pública) com limitador
router.get('/', commentReadLimiter, async (req, res) => {
  try {
    const { status } = req.query;
    let whereClause = {};
    
    // Permitir acesso a todos os status sem verificação de autenticação
    if (status === 'pending' || status === 'rejected' || status === 'approved') {
      // Filtrar por status específico se fornecido
      whereClause.status = status;
    } else if (status === 'all') {
      // Não aplicar filtro de status se 'all' for especificado
      whereClause = {};
    } else {
      // Por padrão, mostrar apenas comentários aprovados
      whereClause.status = 'approved';
    }

    const comments = await Comment.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: comments
    });
  } catch (error) {
    console.error('Erro ao listar comentários:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar comentários'
    });
  }
});

// Rota para listar todos os comentários (incluindo pendentes) - apenas admin com limitador
router.get('/admin', protect, admin, commentReadLimiter, async (req, res) => {
  try {
    const comments = await Comment.findAll({
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: comments
    });
  } catch (error) {
    console.error('Erro ao listar comentários:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar comentários'
    });
  }
});

// Rota para atualizar o status de um comentário (pública) com limitador
router.patch('/:id', commentLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status inválido'
      });
    }

    const comment = await Comment.findByPk(id);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comentário não encontrado'
      });
    }

    await comment.update({ status });

    res.json({
      success: true,
      data: comment
    });
  } catch (error) {
    console.error('Erro ao atualizar comentário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar comentário'
    });
  }
});

// Rota para excluir um comentário com limitador
router.delete('/:id', commentLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    
    const comment = await Comment.findByPk(id);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comentário não encontrado'
      });
    }

    await comment.destroy();

    res.json({
      success: true,
      message: 'Comentário excluído com sucesso'
    });
  } catch (error) {
    console.error('Erro ao excluir comentário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao excluir comentário'
    });
  }
});

module.exports = router;