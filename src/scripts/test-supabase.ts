/**
 * Script para testar a conexão com o Supabase no frontend
 * 
 * Execute com: npx ts-node src/scripts/test-supabase.ts
 */

import { supabase } from '../config/supabaseConfig';

async function testSupabaseConnection() {
  console.log('Testando conexão com o Supabase...');
  
  try {
    // Testar conexão com uma consulta simples
    const { data, error } = await supabase.from('pg_stat_statements').select('*').limit(1);
    
    if (error) {
      throw error;
    }
    
    console.log('✅ Conexão com o Supabase estabelecida com sucesso!');
    console.log('Dados recebidos:', data);
    
    // Listar buckets de armazenamento
    console.log('\nBuckets de armazenamento disponíveis:');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Erro ao listar buckets:', bucketsError.message);
    } else if (buckets.length === 0) {
      console.log('Nenhum bucket encontrado.');
    } else {
      buckets.forEach(bucket => {
        console.log(`- ${bucket.name}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro ao conectar ao Supabase:');
    console.error(error instanceof Error ? error.message : 'An unknown error occurred');
    console.error('\nDetalhes completos do erro:');
    console.error(error);
    console.log('\nVerifique se:');
    console.log('1. As variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY estão definidas corretamente');
    console.log('2. O projeto Supabase está acessível');
    console.log('3. Você tem permissões para acessar o projeto Supabase');
  }
}

testSupabaseConnection();