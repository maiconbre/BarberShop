const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Endpoint para alterar senha
router.post('/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword, userId } = req.body;

    // Busca o usuário no banco de dados
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    // Verifica se a senha atual está correta
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Senha atual incorreta' });
    }

    // Atualiza a senha
    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: 'Senha alterada com sucesso' });
  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    res.status(500).json({ message: 'Erro ao alterar senha' });
  }
});

module.exports = router;