/**
 * Sistema de debounce global para requisições API
 * Evita chamadas duplicadas e muito frequentes
 */

interface PendingRequest {
  timestamp: number;
  promise: Promise<any>;
}

class RequestDebouncer {
  private pendingRequests = new Map<string, PendingRequest>();
  private readonly DEBOUNCE_TIME = 2000; // 2 segundos
  private readonly MAX_PENDING_TIME = 30000; // 30 segundos máximo
  
  // Estatísticas
  private stats = {
    totalRequests: 0,
    debouncedRequests: 0,
    savedRequests: 0
  };

  /**
   * Executa uma requisição com debounce
   * @param key Chave única para identificar a requisição
   * @param requestFn Função que executa a requisição
   * @returns Promise com o resultado da requisição
   */
  async execute<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    const now = Date.now();
    const existing = this.pendingRequests.get(key);
    
    // Incrementar total de requisições
    this.stats.totalRequests++;

    // Se há uma requisição pendente e não expirou
    if (existing) {
      const age = now - existing.timestamp;
      
      // Se a requisição é muito antiga, remover e criar nova
      if (age > this.MAX_PENDING_TIME) {
        console.warn(`Requisição ${key} expirou após ${age}ms - criando nova`);
        this.pendingRequests.delete(key);
      } else {
        // Para requisições muito rápidas (< 100ms), aguardar um pouco mais
        if (age < 100) {
          console.log(`Requisição muito rápida para ${key} (${age}ms) - aguardando...`);
          await new Promise(resolve => setTimeout(resolve, 100 - age));
        }
        
        console.log(`Reutilizando requisição pendente para ${key} (${age}ms atrás)`);
        // Incrementar requisições salvas (evitadas)
        this.stats.savedRequests++;
        return existing.promise;
      }
    }

    // Criar nova requisição
    this.stats.debouncedRequests++;
    const promise = requestFn()
      .then((result) => {
        // Verificar se o resultado é válido antes de retornar
        if (result === null || result === undefined) {
          console.warn(`Requisição ${key} retornou resultado inválido:`, result);
        }
        return result;
      })
      .finally(() => {
        // Remover da lista após conclusão com delay menor para requisições rápidas
        setTimeout(() => {
          this.pendingRequests.delete(key);
        }, Math.min(this.DEBOUNCE_TIME, 1000)); // Máximo 1 segundo
      });

    this.pendingRequests.set(key, {
      timestamp: now,
      promise
    });

    return promise;
  }

  /**
   * Verifica se uma requisição está pendente
   */
  isPending(key: string): boolean {
    const existing = this.pendingRequests.get(key);
    if (!existing) return false;

    const age = Date.now() - existing.timestamp;
    if (age > this.MAX_PENDING_TIME) {
      this.pendingRequests.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Cancela uma requisição pendente
   */
  cancel(key: string): void {
    this.pendingRequests.delete(key);
  }

  /**
   * Limpa todas as requisições pendentes
   */
  clear(): void {
    this.pendingRequests.clear();
    this.stats = {
      totalRequests: 0,
      debouncedRequests: 0,
      savedRequests: 0
    };
  }

  /**
   * Retorna estatísticas do debouncer
   */
  getStats() {
    const now = Date.now();
    const active = Array.from(this.pendingRequests.entries())
      .filter(([_, req]) => (now - req.timestamp) <= this.MAX_PENDING_TIME);

    return {
      totalRequests: this.stats.totalRequests,
      debouncedRequests: this.stats.debouncedRequests,
      pendingRequests: active.length,
      savedRequests: this.stats.savedRequests,
      // Estatísticas adicionais para debug
      totalPending: this.pendingRequests.size,
      activePending: active.length,
      oldestRequest: active.length > 0 
        ? Math.min(...active.map(([_, req]) => now - req.timestamp))
        : 0
    };
  }
}

// Instância singleton
export const requestDebouncer = new RequestDebouncer();

// Hook para React components
export const useRequestDebouncer = () => {
  return {
    execute: requestDebouncer.execute.bind(requestDebouncer),
    isPending: requestDebouncer.isPending.bind(requestDebouncer),
    cancel: requestDebouncer.cancel.bind(requestDebouncer),
    getStats: requestDebouncer.getStats.bind(requestDebouncer)
  };
};