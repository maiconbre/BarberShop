const express = require('express');
const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const router = express.Router();

// Configuração do cliente Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://xxxsgvqbnkftoswascds.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

// Log da configuração (sem expor a chave completa)
console.log('[QR-CODES] Configuração Supabase:');
console.log('- URL:', supabaseUrl);
console.log('- Chave tipo:', supabaseServiceKey?.includes('service_role') ? 'SERVICE_ROLE' : 'ANON');
console.log('- Chave válida:', supabaseServiceKey ? 'SIM' : 'NÃO');

if (!supabaseServiceKey || supabaseServiceKey === 'SUBSTITUA_PELA_CHAVE_SERVICE_ROLE_CORRETA_DO_PAINEL_SUPABASE') {
  console.warn('[QR-CODES] ⚠️  ATENÇÃO: SERVICE_KEY não configurada corretamente!');
  console.warn('[QR-CODES] Acesse o painel do Supabase > Settings > API > service_role para obter a chave correta');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Nome do bucket para armazenar os QR codes
const QR_BUCKET = 'qr-codes';

// Endpoint para salvar QR codes
router.post('/upload', async (req, res) => {
  try {
    const { filename, svgContent } = req.body;
    
    // Validações
    if (!filename || !svgContent) {
      return res.status(400).json({
        success: false,
        message: 'Nome do arquivo e conteúdo SVG são obrigatórios'
      });
    }
    
    // Verificar tamanho do SVG antes de processar
    if (svgContent.length > 10000000) { // 10MB em caracteres
      return res.status(413).json({
        success: false,
        message: 'Conteúdo SVG muito grande. Máximo permitido: 10MB',
        size: svgContent.length
      });
    }
    
    // Sanitizar nome do arquivo
    const sanitizedFilename = filename.replace(/[^a-z0-9]/gi, '').toLowerCase();
    const fullFilename = `${sanitizedFilename}.svg`;
    
    // Otimizar SVG removendo espaços em branco, quebras de linha e atributos desnecessários
    const optimizedSvgContent = svgContent
      .replace(/\s+/g, ' ')
      .replace(/> </g, '><')
      .replace(/\s+\/>/g, '/>')
      .replace(/\s+=/g, '=')
      .replace(/=\s+/g, '=')
      .trim();
    
    // Converter string SVG otimizada para Buffer
    const svgBuffer = Buffer.from(optimizedSvgContent, 'utf8');
    
    // Log do tamanho do SVG para debug
    const originalSize = Buffer.from(svgContent, 'utf8').length;
    const optimizedSize = svgBuffer.length;
    const compressionRatio = ((originalSize - optimizedSize) / originalSize * 100).toFixed(2);
    
    console.log(`SVG para ${fullFilename}: Original: ${originalSize} bytes, Otimizado: ${optimizedSize} bytes, Redução: ${compressionRatio}%`);
    
    // Verificar se o tamanho otimizado ainda é muito grande
    if (optimizedSize > 15000000) { // 15MB em bytes
      return res.status(413).json({
        success: false,
        message: 'Conteúdo SVG muito grande mesmo após otimização. Tente reduzir a qualidade da imagem.',
        originalSize,
        optimizedSize
      });
    }
    
    // Upload para o Supabase Storage
    const { data, error } = await supabase
      .storage
      .from(QR_BUCKET)
      .upload(fullFilename, svgBuffer, {
        contentType: 'image/svg+xml',
        cacheControl: '3600',
        upsert: true
      });
    
    if (error) {
      console.error('Erro ao fazer upload para o Supabase:', error);
      
      // Verificar se o erro é relacionado ao tamanho do arquivo
      if (error.message && (error.message.includes('too large') || error.message.includes('size limit'))) {
        return res.status(413).json({
          success: false,
          message: 'Arquivo muito grande para o Supabase. Tente reduzir a qualidade da imagem.',
          size: optimizedSize,
          error: error.message
        });
      }
      
      throw new Error(error.message);
    }
    
    // Obter URL pública
    const { data: urlData } = supabase
      .storage
      .from(QR_BUCKET)
      .getPublicUrl(fullFilename);
    
    console.log(`QR Code salvo: ${fullFilename}`);
    
    res.json({
      success: true,
      message: 'QR Code salvo com sucesso',
      filename: fullFilename,
      path: urlData.publicUrl,
      size: optimizedSize
    });
    
  } catch (error) {
    console.error('Erro ao salvar QR Code:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Endpoint para listar QR codes disponíveis
router.get('/list', async (req, res) => {
  try {
    let filesWithUrls = [];
    
    try {
      // Tentar listar arquivos do bucket do Supabase primeiro
      const { data: files, error } = await supabase
        .storage
        .from(QR_BUCKET)
        .list();
      
      if (!error && files) {
        // Filtrar apenas arquivos SVG
        const svgFiles = files.filter(file => file.name.endsWith('.svg'));
        
        // Obter URLs públicas para cada arquivo
        filesWithUrls = svgFiles.map(file => {
          const { data: urlData } = supabase
            .storage
            .from(QR_BUCKET)
            .getPublicUrl(file.name);
          
          return {
            filename: file.name,
            name: file.name.replace('.svg', ''),
            path: urlData.publicUrl,
            source: 'supabase'
          };
        });
      }
    } catch (supabaseError) {
      console.log('Supabase não disponível, listando arquivos locais:', supabaseError.message);
    }
    
    // Fallback: listar arquivos locais
    const localQrPath = path.join(__dirname, '../../public/qr-codes');
    
    if (fs.existsSync(localQrPath)) {
      const localFiles = fs.readdirSync(localQrPath)
        .filter(file => file.endsWith('.svg'))
        .map(file => ({
          filename: file,
          name: file.replace('.svg', ''),
          path: `/qr-codes/${file}`,
          source: 'local'
        }));
      
      // Combinar arquivos do Supabase e locais, evitando duplicatas
      const existingNames = new Set(filesWithUrls.map(f => f.name));
      const uniqueLocalFiles = localFiles.filter(f => !existingNames.has(f.name));
      
      filesWithUrls = [...filesWithUrls, ...uniqueLocalFiles];
    }
    
    res.json({
      success: true,
      files: filesWithUrls
    });
    
  } catch (error) {
    console.error('Erro ao listar QR Codes:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Endpoint para deletar QR code
router.delete('/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    
    if (!filename || !filename.endsWith('.svg')) {
      return res.status(400).json({
        success: false,
        message: 'Nome de arquivo inválido'
      });
    }
    
    // Remover arquivo do Supabase Storage
    const { data, error } = await supabase
      .storage
      .from(QR_BUCKET)
      .remove([filename]);
    
    if (error) {
      console.error('Erro ao remover arquivo do Supabase:', error);
      
      // Verificar se o erro é de arquivo não encontrado
      if (error.message.includes('not found') || error.statusCode === 404) {
        return res.status(404).json({
          success: false,
          message: 'QR Code não encontrado'
        });
      }
      
      throw new Error(error.message);
    }
    
    res.json({
      success: true,
      message: 'QR Code deletado com sucesso'
    });
    
  } catch (error) {
    console.error('Erro ao deletar QR Code:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Endpoint para verificar se o bucket existe e criá-lo se necessário
router.get('/check-bucket', async (req, res) => {
  try {
    // Verificar se o bucket existe
    const { data: buckets, error: listError } = await supabase
      .storage
      .listBuckets();
    
    const bucketExists = buckets.some(bucket => bucket.name === QR_BUCKET);
    
    if (!bucketExists) {
      // Criar o bucket se não existir com limite aumentado
      const { data, error: createError } = await supabase
        .storage
        .createBucket(QR_BUCKET, {
          public: true,
          fileSizeLimit: 15728640 // 15MB em bytes
        });
      
      if (createError) {
        console.error('Erro ao criar bucket:', createError);
        throw new Error(createError.message);
      }
      
      console.log(`Bucket ${QR_BUCKET} criado com sucesso`);
    } else {
      // Atualizar o bucket existente para aumentar o limite de tamanho
      try {
        const { data: updateData, error: updateError } = await supabase
          .storage
          .updateBucket(QR_BUCKET, {
            public: true,
            fileSizeLimit: 15728640 // 15MB em bytes
          });
        
        if (updateError) {
          console.error('Aviso: Não foi possível atualizar o limite do bucket:', updateError);
          // Não lançamos erro aqui para não interromper o fluxo
        } else {
          console.log(`Bucket ${QR_BUCKET} atualizado com sucesso`);
        }
      } catch (updateErr) {
        console.error('Erro ao tentar atualizar o bucket:', updateErr);
        // Não lançamos erro aqui para não interromper o fluxo
      }
    }
    
    res.json({
      success: true,
      message: bucketExists ? `Bucket ${QR_BUCKET} já existe e foi atualizado` : `Bucket ${QR_BUCKET} criado com sucesso`
    });
    
  } catch (error) {
    console.error('Erro ao verificar/criar bucket:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao verificar/criar bucket',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Endpoint para verificar o status do bucket (tamanho, limites, etc)
router.get('/bucket-status', async (req, res) => {
  try {
    // Verificar se o bucket existe
    const { data: buckets, error: listError } = await supabase
      .storage
      .listBuckets();
    
    if (listError) {
      console.error('Erro ao listar buckets:', listError);
      throw new Error(listError.message);
    }
    
    const bucket = buckets.find(b => b.name === QR_BUCKET);
    
    if (!bucket) {
      return res.status(404).json({
        success: false,
        message: `Bucket ${QR_BUCKET} não encontrado`
      });
    }
    
    // Listar arquivos para calcular o tamanho total
    const { data: files, error: filesError } = await supabase
      .storage
      .from(QR_BUCKET)
      .list();
    
    if (filesError) {
      console.error('Erro ao listar arquivos do bucket:', filesError);
      throw new Error(filesError.message);
    }
    
    // Calcular estatísticas
    const fileCount = files.length;
    let totalSize = 0;
    
    // Obter tamanho de cada arquivo se disponível
    files.forEach(file => {
      if (file.metadata && file.metadata.size) {
        totalSize += file.metadata.size;
      }
    });
    
    res.json({
      success: true,
      bucket: {
        name: bucket.name,
        id: bucket.id,
        public: bucket.public,
        fileSizeLimit: bucket.file_size_limit || 'Não definido',
        created_at: bucket.created_at,
        updated_at: bucket.updated_at,
        fileCount,
        totalSize: totalSize || 'Não disponível',
        averageFileSize: totalSize && fileCount ? Math.round(totalSize / fileCount) : 'Não disponível'
      }
    });
    
  } catch (error) {
    console.error('Erro ao verificar status do bucket:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao verificar status do bucket',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Endpoint para download de QR code por nome de usuário
router.get('/download/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    if (!username) {
      return res.status(400).json({
        success: false,
        message: 'Nome de usuário é obrigatório'
      });
    }
    
    // Sanitizar nome do arquivo
    const sanitizedFilename = username.replace(/[^a-z0-9]/gi, '').toLowerCase();
    const fullFilename = `${sanitizedFilename}.svg`;
    
    try {
      // Tentar baixar do Supabase primeiro
      const { data, error } = await supabase
        .storage
        .from(QR_BUCKET)
        .download(fullFilename);
      
      if (!error && data) {
        // Converter o blob para string
        const svgContent = await data.text();
        
        // Enviar o SVG como resposta
        res.setHeader('Content-Type', 'image/svg+xml');
        res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache por 24 horas
        return res.send(svgContent);
      }
    } catch (supabaseError) {
      console.log('Supabase não disponível, tentando arquivo local:', supabaseError.message);
    }
    
    // Fallback: tentar servir arquivo local
    const localFilePath = path.join(__dirname, '../../public/qr-codes', fullFilename);
    
    if (fs.existsSync(localFilePath)) {
      const svgContent = fs.readFileSync(localFilePath, 'utf8');
      
      // Enviar o SVG como resposta
      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache por 24 horas
      return res.send(svgContent);
    }
    
    // Se não encontrou nem no Supabase nem localmente
    return res.status(404).json({
      success: false,
      message: 'QR Code não encontrado'
    });
    
  } catch (error) {
    console.error('Erro ao baixar QR Code:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

module.exports = router;