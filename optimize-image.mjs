import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Obter o diretório atual em ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Caminho da imagem original
const inputPath = path.join(__dirname, 'public', 'img', 'fotohero.avif');

// Caminho para salvar a imagem otimizada
const outputPathWebP = path.join(__dirname, 'public', 'img', 'fotohero.webp');
const outputPathAvif = path.join(__dirname, 'public', 'img', 'fotohero-optimized.avif');

// Configurações de otimização
const width = 1920; // Largura máxima suficiente para a maioria das telas
const quality = 75; // Bom equilíbrio entre qualidade e tamanho

// Função para mostrar o tamanho do arquivo em KB
const getFileSize = (filePath) => {
  const stats = fs.statSync(filePath);
  return (stats.size / 1024).toFixed(2) + ' KB';
};

console.log(`Tamanho original: ${getFileSize(inputPath)}`);

// Criar versão WebP otimizada
await sharp(inputPath)
  .resize({ width, withoutEnlargement: true })
  .webp({ quality, effort: 6 }) // Effort 6 para melhor compressão
  .toFile(outputPathWebP);

console.log(`WebP otimizado criado: ${getFileSize(outputPathWebP)}`);

// Criar versão AVIF otimizada
await sharp(inputPath)
  .resize({ width, withoutEnlargement: true })
  .avif({ quality, effort: 9 }) // Effort máximo para AVIF
  .toFile(outputPathAvif);

console.log(`AVIF otimizado criado: ${getFileSize(outputPathAvif)}`);