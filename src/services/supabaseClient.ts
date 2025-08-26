// Importar a instância única do Supabase
import { supabase } from '../config/supabaseConfig';

// Exportar a instância única
export default supabase;
export { supabase as supabaseClient };

// Funções auxiliares para interagir com o Supabase

/**
 * Faz upload de um arquivo para o bucket de armazenamento do Supabase
 * @param bucket Nome do bucket de armazenamento
 * @param path Caminho do arquivo no bucket
 * @param file Arquivo a ser enviado
 * @returns Objeto com informação do upload ou erro
 */
export const uploadFile = async (bucket: string, path: string, file: File) => {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true
      });
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Erro ao fazer upload do arquivo:', error);
    return { data: null, error };
  }
};

/**
 * Obtém a URL pública de um arquivo no Supabase Storage
 * @param bucket Nome do bucket de armazenamento
 * @param path Caminho do arquivo no bucket
 * @returns URL pública do arquivo
 */
export const getPublicUrl = (bucket: string, path: string) => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
};

/**
 * Remove um arquivo do bucket de armazenamento do Supabase
 * @param bucket Nome do bucket de armazenamento
 * @param path Caminho do arquivo no bucket
 * @returns Objeto com informação da remoção ou erro
 */
export const removeFile = async (bucket: string, path: string) => {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .remove([path]);
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Erro ao remover arquivo:', error);
    return { data: null, error };
  }
};