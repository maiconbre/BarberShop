# 🏥 Health Check Automatizado 24/7

Script automatizado para monitorar a saúde da API da barbearia com intervalos inteligentes baseados no horário.

## 📋 Funcionalidades

- ✅ **Monitoramento 24/7** sem necessidade de cron jobs
- 🕕 **Intervalos inteligentes**: 10min (dia) / 30min (noite)
- 📊 **Estatísticas em tempo real**
- 📝 **Logs detalhados** com timestamps
- 🔄 **Auto-recuperação** em caso de erros
- 🛑 **Parada graceful** com CTRL+C

## ⏰ Horários e Intervalos

| Período | Horário | Intervalo | Motivo |
|---------|---------|-----------|--------|
| 🕕 **Diurno** | 06:00 - 22:00 | 10 minutos | Maior tráfego de usuários |
| 🌙 **Noturno** | 22:00 - 06:00 | 30 minutos | Menor tráfego, economia de recursos |

## 🚀 Como Usar

### 1. Instalação de Dependências
```bash
npm install axios
```

### 2. Configuração (Opcional)
O script usa variáveis de ambiente ou valores padrão:

```bash
# Opcional: definir URL da API
export API_URL="https://sua-api.com"
```

### 3. Execução
```bash
# Executar o script
node scripts/health-check-auto.js

# Ou em background (Linux/Mac)
nohup node scripts/health-check-auto.js > health-check.out 2>&1 &

# Ou usando PM2 (recomendado para produção)
pm2 start scripts/health-check-auto.js --name "health-check"
```

## 📊 Endpoints Monitorados

O script monitora automaticamente:

- `/api/barbers` - Lista de barbeiros
- `/api/comments?status=approved` - Comentários aprovados
- `/api/services` - Serviços disponíveis

## 📝 Logs e Monitoramento

### Logs em Tempo Real
```
[28/03/2025 14:30:15] [INFO] 🔍 Iniciando health check - Período: DIURNO (10min)
[28/03/2025 14:30:16] [INFO] ✅ /api/barbers - Status: 200 - Tempo: 245ms
[28/03/2025 14:30:17] [INFO] ✅ /api/comments?status=approved - Status: 200 - Tempo: 189ms
[28/03/2025 14:30:18] [INFO] ✅ /api/services - Status: 200 - Tempo: 156ms
[28/03/2025 14:30:18] [INFO] 📊 Health check concluído - Sucesso: 3/3 (100.0%)
[28/03/2025 14:30:18] [INFO] ⏰ Próximo check agendado para: 28/03/2025 14:40:18
```

### Arquivo de Log
Todos os logs são salvos em: `scripts/health-check.log`

### Estatísticas Horárias
```
📈 === ESTATÍSTICAS ===
   Tempo ativo: 120 minutos
   Total de requests: 36
   Sucessos: 35
   Falhas: 1
   Taxa de sucesso: 97.2%
   Último check: 28/03/2025 14:30:18
========================
```

## 🛠️ Configurações Avançadas

### Variáveis de Ambiente

```bash
# URL da API (padrão: https://barber-backend-spm8.onrender.com)
API_URL="https://sua-api.com"

# Timeout das requisições em ms (padrão: 30000)
API_TIMEOUT="30000"
```

### Personalização no Código

Edite o objeto `CONFIG` no arquivo:

```javascript
const CONFIG = {
  API_URL: process.env.API_URL || 'https://sua-api.com',
  ENDPOINTS: [
    '/api/barbers',
    '/api/comments?status=approved',
    '/api/services',
    '/seu/endpoint/customizado'  // Adicione aqui
  ],
  INTERVALS: {
    DAY: 5 * 60 * 1000,    // 5 minutos no dia
    NIGHT: 15 * 60 * 1000  // 15 minutos na noite
  },
  TIMEOUT: 30000
};
```

## 🔧 Comandos Úteis

### Parar o Script
```bash
# CTRL+C ou
kill -SIGTERM <PID>
```

### Verificar Logs
```bash
# Ver logs em tempo real
tail -f scripts/health-check.log

# Ver últimas 50 linhas
tail -n 50 scripts/health-check.log

# Buscar erros
grep "ERROR" scripts/health-check.log
```

### Com PM2 (Produção)
```bash
# Iniciar
pm2 start scripts/health-check-auto.js --name "health-check"

# Ver logs
pm2 logs health-check

# Reiniciar
pm2 restart health-check

# Parar
pm2 stop health-check

# Status
pm2 status
```

## 🚨 Tratamento de Erros

O script possui tratamento robusto de erros:

- **Timeout de requisições**: 30 segundos
- **Reconexão automática**: Em caso de falha de rede
- **Logs detalhados**: Para debugging
- **Parada graceful**: Preserva estatísticas

## 📈 Casos de Uso

### Desenvolvimento Local
```bash
# Monitorar API local
API_URL="http://localhost:8000" node scripts/health-check-auto.js
```

### Produção (VPS/Servidor)
```bash
# Com PM2 para auto-restart
pm2 start scripts/health-check-auto.js --name "health-check" --restart-delay=5000
```

### Serviços Cloud (Railway, Replit)
```bash
# Executar diretamente
node scripts/health-check-auto.js
```

## 🔍 Troubleshooting

### Script não inicia
```bash
# Verificar dependências
npm list axios

# Instalar se necessário
npm install axios
```

### Muitos erros de timeout
```bash
# Aumentar timeout (em ms)
API_TIMEOUT="60000" node scripts/health-check-auto.js
```

### Logs muito verbosos
Edite a função `log()` para filtrar níveis de log.

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique os logs em `scripts/health-check.log`
2. Teste manualmente os endpoints
3. Verifique conectividade de rede

---

**💡 Dica**: Use este script em conjunto com serviços de monitoramento como UptimeRobot ou StatusCake para redundância completa!