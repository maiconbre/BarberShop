import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';

// Obter o diretório atual em ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Promisify fs functions
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const mkdir = promisify(fs.mkdir);

// Configurações de otimização
const config = {
  width: 1920, // Largura máxima suficiente para a maioria das telas
  quality: 75, // Bom equilíbrio entre qualidade e tamanho
  webpOptions: { quality: 75, effort: 6 }, // Effort 6 para melhor compressão
  avifOptions: { quality: 75, effort: 9 }, // Effort máximo para AVIF
};

// Função para mostrar o tamanho do arquivo em KB
const getFileSize = (filePath) => {
  const stats = fs.statSync(filePath);
  return (stats.size / 1024).toFixed(2) + ' KB';
};

// Função para verificar se um diretório existe, se não, cria-o
async function ensureDir(dirPath) {
  try {
    await stat(dirPath);
  } catch (error) {
    if (error.code === 'ENOENT') {
      await mkdir(dirPath, { recursive: true });
      console.log(`Diretório criado: ${dirPath}`);
    } else {
      throw error;
    }
  }
}

// Função para otimizar uma única imagem
async function optimizeImage(inputPath, outputDir, filename) {
  try {
    // Extrair nome do arquivo sem extensão
    const nameWithoutExt = path.parse(filename).name;
    
    // Definir caminhos de saída
    const outputPathWebP = path.join(outputDir, `${nameWithoutExt}.webp`);
    const outputPathAvif = path.join(outputDir, `${nameWithoutExt}.avif`);
    
    console.log(`Otimizando: ${filename}`);
    console.log(`Tamanho original: ${getFileSize(inputPath)}`);
    
    // Criar versão WebP otimizada
    await sharp(inputPath)
      .resize({ width: config.width, withoutEnlargement: true })
      .webp(config.webpOptions)
      .toFile(outputPathWebP);
    
    console.log(`WebP otimizado criado: ${getFileSize(outputPathWebP)}`);
    
    // Criar versão AVIF otimizada
    await sharp(inputPath)
      .resize({ width: config.width, withoutEnlargement: true })
      .avif(config.avifOptions)
      .toFile(outputPathAvif);
    
    console.log(`AVIF otimizado criado: ${getFileSize(outputPathAvif)}`);
    
    return {
      original: inputPath,
      webp: outputPathWebP,
      avif: outputPathAvif
    };
  } catch (error) {
    console.error(`Erro ao otimizar ${filename}:`, error);
    return null;
  }
}

// Função para processar imagens em um diretório
async function processDirectory(inputDir, outputDir) {
  try {
    // Garantir que o diretório de saída existe
    await ensureDir(outputDir);
    
    // Ler arquivos no diretório
    const files = await readdir(inputDir);
    
    // Filtrar apenas arquivos de imagem
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif'];
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return imageExtensions.includes(ext);
    });
    
    console.log(`Encontradas ${imageFiles.length} imagens em ${inputDir}`);
    
    // Processar cada imagem
    const results = [];
    for (const file of imageFiles) {
      const inputPath = path.join(inputDir, file);
      const result = await optimizeImage(inputPath, outputDir, file);
      if (result) results.push(result);
    }
    
    return results;
  } catch (error) {
    console.error(`Erro ao processar diretório ${inputDir}:`, error);
    return [];
  }
}

// Função principal
async function main() {
  // Diretório de imagens públicas
  const publicImgDir = path.join(__dirname, 'public', 'img');
  const optimizedImgDir = path.join(__dirname, 'public', 'img', 'optimized');
  
  console.log('Iniciando otimização de imagens...');
  
  // Processar diretório de imagens públicas
  const results = await processDirectory(publicImgDir, optimizedImgDir);
  
  console.log('\nResumo da otimização:');
  console.log(`Total de imagens otimizadas: ${results.length}`);
  
  // Calcular economia total de espaço
  let originalSize = 0;
  let webpSize = 0;
  let avifSize = 0;
  
  for (const result of results) {
    const origStats = fs.statSync(result.original);
    const webpStats = fs.statSync(result.webp);
    const avifStats = fs.statSync(result.avif);
    
    originalSize += origStats.size;
    webpSize += webpStats.size;
    avifSize += avifStats.size;
  }
  
  console.log(`Tamanho original total: ${(originalSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Tamanho WebP total: ${(webpSize / 1024 / 1024).toFixed(2)} MB (${(100 - (webpSize / originalSize * 100)).toFixed(2)}% de redução)`);
  console.log(`Tamanho AVIF total: ${(avifSize / 1024 / 1024).toFixed(2)} MB (${(100 - (avifSize / originalSize * 100)).toFixed(2)}% de redução)`);
  
  console.log('\nOtimização concluída!');
}

// Executar função principal
main().catch(error => {
  console.error('Erro:', error);
  process.exit(1);
});