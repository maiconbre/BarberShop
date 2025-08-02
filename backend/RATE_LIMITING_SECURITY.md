# Sistema de Rate Limiting e Segurança

## Visão Geral

Este documento descreve as melhorias implementadas no sistema de rate limiting e segurança da API da Barbearia para resolver problemas de erro 429 (Too Many Requests) e implementar monitoramento de atividade maliciosa.

## Problemas Resolvidos

### 1. Erro 429 - Too Many Requests
- **Problema**: Usuários legítimos recebendo erro 429 ao acessar `/api/comments?status=pending`
- **Solução**: Aumentados os limites de rate limiting e implementada configuração mais granular

### 2. Falta de Monitoramento de Segurança
- **Problema**: Ausência de logs e rastreamento de atividade suspeita
- **Solução**: Sistema completo de logging de segurança e detecção de padrões maliciosos

## Arquivos Modificados/Criados

### Novos Arquivos

1. **`middleware/securityLogger.js`**
   - Sistema de logging de segurança
   - Detecção de padrões suspeitos
   - Geração de relatórios de segurança

2. **`routes/securityRoutes.js`**
   - Rotas administrativas para monitoramento
   - Endpoints para visualizar logs e relatórios
   - Limpeza automática de logs antigos

3. **`config/rateLimits.js`**
   - Configurações centralizadas de rate limiting
   - Limites específicos por tipo de operação
   - Fácil ajuste sem modificar código

4. **`RATE_LIMITING_SECURITY.md`**
   - Documentação completa do sistema

### Arquivos Modificados

1. **`middleware/requestLimitMiddleware.js`**
   - Integração com sistema de logging
   - Uso de configurações centralizadas
   - Limites aumentados e mais flexíveis

2. **`routes/commentRoutes.js`**
   - Limites aumentados para leitura de comentários
   - Configuração mais permissiva para usuários legítimos

3. **`server.js`**
   - Adicionadas rotas de segurança
   - Documentação atualizada da API

## Configurações de Rate Limiting

### Limites Anteriores vs Atuais

#### Comentários - Leitura
- **Anterior**: 3 requisições, bloqueio de 5 minutos
- **Atual**: 15 requisições, bloqueio de 2 minutos, rajadas de até 30

#### Comentários - Criação
- **Anterior**: 2 requisições, bloqueio de 10 minutos
- **Atual**: 5 requisições, bloqueio de 5 minutos

#### Configurações Globais
- **Anterior**: 100 requisições, rajadas de 20
- **Atual**: 200 requisições, rajadas de 50

### Configurações por Endpoint

```javascript
// Comentários
comments: {
  read: {
    maxRepeatedRequests: 15,
    blockTimeMs: 120000, // 2 minutos
    burstLimit: 30,
    windowMs: 60000
  },
  create: {
    maxRepeatedRequests: 5,
    blockTimeMs: 300000, // 5 minutos
    burstLimit: 10,
    windowMs: 60000
  }
}

// Autenticação
auth: {
  login: {
    maxRepeatedRequests: 5,
    blockTimeMs: 900000, // 15 minutos
    burstLimit: 3,
    windowMs: 300000
  }
}
```

## Sistema de Logging de Segurança

### Funcionalidades

1. **Detecção Automática de Padrões Suspeitos**
   - Alta frequência de requisições
   - User-Agents suspeitos (bots, crawlers)
   - Requisições muito rápidas
   - Referers suspeitos

2. **Logging Estruturado**
   - Logs salvos em `logs/security.log`
   - Formato JSON para fácil análise
   - Informações detalhadas do cliente

3. **Relatórios Automáticos**
   - Estatísticas das últimas 24 horas
   - Top IPs ofensores
   - Tipos de eventos mais comuns

### Exemplo de Log

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "eventType": "RATE_LIMIT_EXCEEDED",
  "severity": "HIGH",
  "clientInfo": {
    "ip": "192.168.1.100",
    "userAgent": "Mozilla/5.0...",
    "method": "GET",
    "url": "/api/comments?status=pending"
  },
  "suspiciousPatterns": ["highFrequency"],
  "details": {
    "requestCount": 25,
    "timeWindow": 5000,
    "blockDuration": 120000
  }
}
```

## Rotas de Administração

### Endpoints Disponíveis

1. **`GET /api/security/report`**
   - Relatório resumido de segurança
   - Requer autenticação de admin

2. **`GET /api/security/logs`**
   - Logs detalhados com filtros
   - Parâmetros: `limit`, `severity`, `eventType`

3. **`GET /api/security/stats/realtime`**
   - Estatísticas em tempo real
   - Inclui uso de memória e uptime

4. **`DELETE /api/security/logs/cleanup`**
   - Limpa logs antigos
   - Parâmetro: `days` (padrão: 30)

### Exemplo de Uso

```bash
# Obter relatório de segurança
curl -H "Authorization: Bearer <admin_token>" \
     https://barber-backend-spm8.onrender.com/api/security/report

# Obter logs de alta severidade
curl -H "Authorization: Bearer <admin_token>" \
     "https://barber-backend-spm8.onrender.com/api/security/logs?severity=HIGH&limit=50"

# Limpar logs antigos (mais de 7 dias)
curl -X DELETE \
     -H "Authorization: Bearer <admin_token>" \
     "https://barber-backend-spm8.onrender.com/api/security/logs/cleanup?days=7"
```

## Detecção de Atividade Maliciosa

### Padrões Detectados

1. **Alta Frequência**
   - Mais de 100 requisições em pouco tempo
   - Classificação automática como suspeito

2. **User-Agents Suspeitos**
   - Bots, crawlers, scrapers
   - Ferramentas automatizadas (curl, wget)

3. **Comportamento de Rajada**
   - Muitas requisições em sequência rápida
   - Intervalo médio menor que 500ms

4. **Requisições Repetitivas**
   - Mais de 80% de requisições idênticas
   - Padrão típico de ataques automatizados

### Ações Automáticas

1. **Bloqueio Temporário**
   - IPs suspeitos são bloqueados automaticamente
   - Duração baseada na severidade

2. **Logging Detalhado**
   - Todas as atividades suspeitas são registradas
   - Informações para análise posterior

3. **Alertas no Console**
   - Logs em tempo real para desenvolvimento
   - Fácil identificação de problemas

## Monitoramento e Manutenção

### Limpeza Automática

- Cache de requisições limpo a cada 5 minutos
- Logs antigos podem ser removidos via API
- Configuração de retenção flexível

### Métricas Importantes

1. **Taxa de Bloqueios**
   - Percentual de requisições bloqueadas
   - Indicador de atividade suspeita

2. **IPs Únicos**
   - Número de IPs diferentes por período
   - Diversidade de acessos

3. **Tipos de Eventos**
   - Distribuição de eventos de segurança
   - Padrões de ataque mais comuns

## Configuração e Ajustes

### Ajustando Limites

Para modificar os limites, edite o arquivo `config/rateLimits.js`:

```javascript
// Exemplo: Aumentar limite para leitura de comentários
comments: {
  read: {
    maxRepeatedRequests: 25, // Aumentado de 15 para 25
    blockTimeMs: 60000,      // Reduzido de 2min para 1min
    burstLimit: 50,          // Aumentado de 30 para 50
    windowMs: 60000
  }
}
```

### Variáveis de Ambiente

Nenhuma variável adicional necessária. O sistema usa as configurações existentes.

## Resolução de Problemas

### Erro 429 Persistente

1. **Verificar Logs**
   ```bash
   curl -H "Authorization: Bearer <token>" \
        "https://barber-backend-spm8.onrender.com/api/security/logs?limit=10"
   ```

2. **Ajustar Limites**
   - Editar `config/rateLimits.js`
   - Aumentar `maxRepeatedRequests` ou `burstLimit`

3. **Verificar Padrões**
   - Analisar relatório de segurança
   - Identificar IPs problemáticos

### Performance

- Sistema otimizado para baixo overhead
- Cache com limpeza automática
- Logs estruturados para análise eficiente

## Benefícios Implementados

1. **Usuários Legítimos**
   - Menos bloqueios desnecessários
   - Limites mais permissivos para leitura
   - Experiência melhorada

2. **Segurança**
   - Detecção automática de ataques
   - Logs detalhados para análise
   - Bloqueio inteligente de atividade suspeita

3. **Administração**
   - Visibilidade completa da segurança
   - Ferramentas de monitoramento
   - Configuração centralizada e flexível

4. **Manutenção**
   - Sistema auto-gerenciado
   - Limpeza automática de dados
   - Configuração sem necessidade de restart

## Próximos Passos

1. **Monitoramento Contínuo**
   - Acompanhar métricas de segurança
   - Ajustar limites conforme necessário

2. **Análise de Padrões**
   - Revisar logs regularmente
   - Identificar novos tipos de ataques

3. **Otimizações**
   - Ajustar configurações baseado no uso real
   - Implementar melhorias baseadas em feedback

Este sistema fornece uma base sólida para segurança e rate limiting, resolvendo os problemas de erro 429 enquanto mantém proteção robusta contra atividades maliciosas.