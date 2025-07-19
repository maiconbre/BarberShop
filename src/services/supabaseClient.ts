import { createClient } from '@supabase/supabase-js';

// Obter as variáveis de ambiente do Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xxxsgvqbnkftoswascds.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHNndnFibmtmdG9zd2FzY2RzIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTg3NjQ4MDAsImV4cCI6MjAxNDM0MDgwMH0.placeholder-key';

// Criar o cliente Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;

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