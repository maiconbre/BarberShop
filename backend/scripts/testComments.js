const { Sequelize } = require('sequelize');
const Comment = require('../models/Comment');
require('dotenv').config();

async function testComments() {
  try {
    // Verificar a conexão com o banco de dados
    const sequelize = require('../models/database');
    await sequelize.authenticate();
    console.log('Conexão com o banco de dados estabelecida com sucesso.');
    
    // Verificar se a tabela Comments existe
    const [tables] = await sequelize.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    console.log('\nTabelas no banco de dados:');
    console.log(tables);
    
    // Verificar se há registros na tabela Comments
    try {
      const comments = await Comment.findAll();
      console.log('\nRegistros na tabela Comments:');
      console.log(comments);
      
      if (comments.length === 0) {
        console.log('\nNenhum comentário encontrado. Tentando criar um comentário de teste...');
        
        // Criar um comentário de teste
        const testComment = await Comment.create({
          id: Date.now().toString(),
          name: 'Teste Automático',
          comment: 'Este é um comentário de teste para verificar o funcionamento do sistema.',
          status: 'pending'
        });
        
        console.log('\nComentário de teste criado com sucesso:');
        console.log(testComment.toJSON());
        
        // Verificar novamente os comentários
        const updatedComments = await Comment.findAll();
        console.log('\nRegistros atualizados na tabela Comments:');
        console.log(updatedComments);
      }
    } catch (err) {
      console.error('\nErro ao consultar ou criar comentários:', err);
      
      // Verificar se a tabela Comments existe no banco de dados
      console.log('\nVerificando se a tabela Comments existe...');
      const commentTable = tables.find(t => t.table_name === 'Comments');
      if (!commentTable) {
        console.log('A tabela Comments não existe no banco de dados!');
        console.log('Tentando sincronizar o modelo Comment...');
        
        // Tentar sincronizar o modelo Comment
        await Comment.sync({ force: false });
        console.log('Modelo Comment sincronizado. Tentando criar um comentário de teste...');
        
        // Criar um comentário de teste após sincronização
        const testComment = await Comment.create({
          id: Date.now().toString(),
          name: 'Teste Automático',
          comment: 'Este é um comentário de teste para verificar o funcionamento do sistema.',
          status: 'pending'
        });
        
        console.log('\nComentário de teste criado com sucesso:');
        console.log(testComment.toJSON());
      }
    }
    
    // Verificar o problema no frontend
    console.log('\nVerificando possíveis problemas no frontend:');
    console.log('1. O frontend está enviando o comentário corretamente para a API');
    console.log('2. O frontend está buscando os comentários com status "approved"');
    console.log('3. Verificar se há algum problema com o CORS ou headers de autorização');
    
  } catch (error) {
    console.error('Erro geral:', error);
  }
}

testComments();