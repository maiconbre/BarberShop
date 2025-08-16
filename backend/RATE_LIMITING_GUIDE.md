# Guia de Configuração de Rate Limiting - Sistema BarberShop

## 🎯 Objetivo
Este guia documenta as otimizações realizadas no sistema de rate limiting para reduzir falsos positivos e melhorar a experiência do usuário.

## 📊 Problema Original
- **Rate Limit Excessivo**: Sistema bloqueava usuários legítimos após apenas 2-3 requisições
- **Janela de Tempo Restritiva**: Bloqueios de 1 minuto para requisições legítimas
- **Detecção Agressiva**: Requisições normais sendo classificadas como suspeitas

## ✅ Solução Implementada

### 1. Novos Limites Otimizados

| Endpoint | Limite Anterior | Limite Novo | Melhoria |
|----------|----------------|-------------|----------|
| **Serviços (GET)** | 100 req/min | 200 req/min | +100% |
| **Serviços (POST/PUT)** | 10 req/min | 15 req/min | +50% |
| **Rajada de Serviços** | 30 req/30s | 50 req/30s | +67% |
| **Tempo de Bloqueio** | 60s | 30s | -50% |
| **Período de Graça** | 10s | 15s | +50% |

### 2. Detecção Inteligente Ajustada

| Padrão | Limite Anterior | Limite Novo | Impacto |
|--------|----------------|-------------|---------|
| **Frequência Alta** | 100 req | 200 req | Menos sensível |
| **Rajada Rápida** | 20 req | 40 req | Permite mais requisições |
| **Repetição** | 80% | 90% | Só bloqueia se 90% forem repetidas |
| **Intervalo Médio** | 500ms | 250ms | Permite requests mais rápidos |

### 3. Rate Limiters por Endpoint

```javascript
// Serviços - Mais permissivo para GET requests
app.use('/api/services', servicesApiLimiter, serviceRoutes);

// Autenticação - Mantém restrições por segurança
app.use('/api/auth', authLimiter, authRoutes);

// Comentários - Limites moderados
app.use('/api/comments', commentsLimiter, commentRoutes);

// Agendamentos - Limites adequados para uso
app.use('/api/appointments', appointmentsLimiter, appointmentRoutes);

// Rotas gerais - Limites públicos generosos
app.use('/api/users', publicApiLimiter, userRoutes);
app.use('/api/barbers', publicApiLimiter, barberRoutes);
app.use('/api/barbershops', publicApiLimiter, barbershopRoutes);
app.use('/api/plans', publicApiLimiter, planRoutes);
```

## 🔧 Configurações Técnicas

### Redis vs Memória
- **Redis**: Usado quando disponível (melhor performance e persistência)
- **Memória**: Fallback automático quando Redis não está disponível

### Headers HTTP
- `X-RateLimit-Limit`: Limite máximo de requisições
- `X-RateLimit-Remaining`: Requisições restantes
- `X-RateLimit-Reset`: Tempo até o reset do limite
- `Retry-After`: Tempo para aguardar antes de tentar novamente

## 📈 Monitoramento

### Logs de Rate Limiting
Os logs incluem informações detalhadas:
```json
{
  "pattern": "RATE_LIMIT_EXCEEDED",
  "severity": "MEDIUM",
  "details": {
    "patterns": ["highFrequency"],
    "url": "/api/services",
    "method": "GET"
  }
}
```

### Métricas para Monitorar
1. **Taxa de Bloqueios Legítimos**: Deve ser < 1%
2. **Tempo Médio de Resposta**: Deve manter-se < 500ms
3. **Taxa de Requisições 429**: Deve diminuir significativamente

## 🚨 Troubleshooting

### Se ainda houver bloqueios excessivos:
1. Verificar logs: `grep "RATE_LIMIT_EXCEEDED" backend/logs/security.log`
2. Aumentar limites em `backend/config/rateLimits.js`
3. Desabilitar temporariamente para testes
4. Verificar se Redis está funcionando

### Comandos Úteis
```bash
# Verificar se Redis está rodando
redis-cli ping

# Ver estatísticas de rate limiting
redis-cli --scan --pattern "rl:*"

# Limpar cache de rate limiting
redis-cli FLUSHDB
```

## 🔄 Rollback
Se necessário, os arquivos originais foram preservados e podem ser restaurados:
- `backend/config/rateLimits.js` (backup automático)
- `backend/server.js` (backup automático)

## 📞 Suporte
Para problemas com rate limiting:
1. Verificar logs em `backend/logs/security.log`
2. Verificar configurações em `backend/config/rateLimits.js`
3. Consultar este guia para ajustes
4. Contatar suporte técnico se persistir

## 📊 Resultados Esperados
Após implementação:
- **Redução de 80%** em bloqueios de usuários legítimos
- **Tempo de bloqueio** reduzido de 60s para 30s
- **Capacidade de throughput** aumentada em 100%
- **UX melhorada** com menos interrupções