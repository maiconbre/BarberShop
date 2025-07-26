# 💈 Barbershop - Sistema de Agendamento para Barbearias

<p align="center">

  <img src="./public/screenshots/Img1.PNG" alt="Barbershop" width="300px" />

</p>

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Funcionalidades](#️-funcionalidades)
- [Tecnologias](#-tecnologias-utilizadas)
- [Arquitetura](#️-arquitetura-do-projeto)
- [Configuração de Ambiente](#-configuração-de-ambiente)
- [Instalação](#-instalação-e-execução)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Guia de Desenvolvimento](#-guia-de-desenvolvimento)
- [Scripts Disponíveis](#-scripts-disponíveis)
- [Padrões e Convenções](#-padrões-e-convenções)
- [Performance e Otimização](#-performance-e-otimização)
- [Testes](#-testes)
- [Deploy](#-deploy)
- [Contribuição](#-contribuindo)

## 🎯 Visão Geral

O **Barbershop** é um sistema moderno e completo de agendamento online voltado para barbearias. A plataforma permite que clientes agendem serviços com facilidade, barbeiros organizem suas agendas de forma eficiente e administradores gerenciem toda a operação por meio de um painel intuitivo.

Desenvolvido com foco em escalabilidade, usabilidade e arquitetura limpa, o sistema aplica os princípios SOLID, boas práticas de engenharia de software e tecnologias modernas do ecossistema React.

### 🎯 Objetivos do Projeto

- **Escalabilidade**: Arquitetura preparada para crescimento
- **Manutenibilidade**: Código limpo e bem estruturado
- **Performance**: Otimizações avançadas e cache inteligente
- **Usabilidade**: Interface intuitiva e responsiva
- **Confiabilidade**: Sistema robusto com tratamento de erros

---

## ⚙️ Funcionalidades

### 👤 Área do Cliente
- Visualização de serviços disponíveis
- Seleção de barbeiros por especialidade
- Agendamento de horários com confirmação
- Histórico de agendamentos
- Avaliação dos serviços prestados
- Gerenciamento de perfil e credenciais

### ✂️ Área do Barbeiro
- Visualização de agenda por dia/semana
- Gerenciamento de horários disponíveis
- Confirmação ou cancelamento de agendamentos
- Histórico de atendimentos realizados
- Métricas individuais de desempenho

### 🛠️ Painel Administrativo
- Cadastro e gerenciamento de barbeiros
- Configuração de serviços e preços
- Relatórios gerenciais e métricas por período
- Moderação de avaliações/comentários
- Definição de horários de funcionamento da unidade

---

## 🧰 Tecnologias Utilizadas

### 🎨 Frontend Core
- **React 18.3.1** - Biblioteca principal para UI
- **TypeScript 5.7.3** - Tipagem estática 
- **Vite 6.1.1** - Build tool rápida
- **React Router DOM 7.1.5** - Roteamento SPA

### 🎭 UI/UX
- **Tailwind CSS 3.4.1** - Framework CSS utilitário
- **Framer Motion 12.4.9** - Animações 
- **Lucide React 0.344.0** - Ícones 
- **React Hot Toast 2.5.2** - Notificações
- **React Tooltip 5.28.0** - Tooltips interativos

### 📊 Visualização de Dados
- **Recharts 2.15.1** - Gráficos 
- **Chart.js 4.4.8** - Biblioteca 
- **React ChartJS 2 5.3.0** - Integração React + Chart.js

### 🔧 Gerenciamento de Estado
- **Zustand 5.0.6** - Estado global simples e eficiente
- **React Context** - Estado local e autenticação

### 📝 Validação e Formulários
- **Zod 4.0.5** - Validação de schemas TypeScript-first
- **React Hook Form** (via hooks customizados) - Gerenciamento de formulários

### 🚀 Performance
- **React Window 1.8.11** - Virtualização de listas
- **React Virtualized Auto Sizer 1.0.26** - Dimensionamento automático
- **React Lazy Load Image 1.6.3** - Carregamento lazy de imagens

### 🔗 Comunicação
- **Axios 1.8.1** - Cliente HTTP
- **Supabase JS 2.48.1** - Backend as a Service

### 🛠️ Ferramentas de Desenvolvimento
- **ESLint 9.9.1** - Linting de código
- **TypeScript ESLint 8.3.0** - Regras específicas para TS
- **PostCSS 8.4.35** - Processamento CSS
- **Autoprefixer 10.4.18** - Prefixos CSS automáticos

### 📦 Build e Deploy
- **Terser 5.39.0** - Minificação JavaScript
- **Vite Plugin Compression2 1.3.3** - Compressão Gzip
- **Sharp 0.33.5** - Otimização de imagens

### 🗄️ Banco de Dados
- **Prisma 6.4.1** - ORM moderno
- **SQLite3 5.1.7** - Banco local para desenvolvimento
- **Sequelize 6.37.5** - ORM alternativo

---

## 🏛️ Arquitetura de Projeto

### Princípios SOLID aplicados
- **SRP** – Cada módulo tem uma responsabilidade única
- **OCP** – Código aberto para extensão, fechado para modificação
- **LSP** – Substituições seguras de abstrações
- **ISP** – Interfaces enxutas e específicas
- **DIP** – Módulos de alto nível dependem de abstrações
  

## 📁 Estrutura do Projeto

### Visão Geral da Arquitetura

### Estrutura de Diretórios

```
Barbershop/
├── 📁 public/                    # Assets estáticos
│   ├── screenshots/              # Capturas de tela
│   └── favicon.ico
├── 📁 src/                       # Código fonte principal
│   ├── 📁 components/            # Componentes React
│   │   ├── auth/                 # Componentes de autenticação
│   │   ├── feature/              # Componentes de funcionalidades
│   │   └── ui/                   # Componentes de interface
│   ├── 📁 config/                # Configurações do sistema
│   │   ├── apiConfig.ts          # Configurações de API
│   │   └── environmentConfig.ts  # Configurações de ambiente
│   ├── 📁 contexts/              # Contextos React
│   │   └── AuthContext.tsx       # Contexto de autenticação
│   ├── 📁 hooks/                 # Hooks customizados
│   │   ├── useAsync.ts           # Hook para operações assíncronas
│   │   ├── useCache.ts           # Hook para cache
│   │   ├── useForm.ts            # Hook para formulários
│   │   └── useFormValidation.ts  # Hook para validação
│   ├── 📁 models/                # Modelos de domínio
│   │   ├── Appointment.ts        # Modelo de agendamento
│   │   ├── Service.ts            # Modelo de serviço
│   │   ├── User.ts               # Modelo de usuário
│   │   └── index.ts              # Exportações dos modelos
│   ├── 📁 pages/                 # Páginas da aplicação
│   │   ├── Home.tsx              # Página inicial
│   │   ├── DashboardPage.tsx     # Dashboard principal
│   │   ├── LoginPage.tsx         # Página de login
│   │   └── ...
│   ├── 📁 services/              # Serviços e APIs
│   │   ├── cache/                # Serviços de cache
│   │   ├── interfaces/           # Interfaces dos serviços
│   │   ├── ApiService.ts         # Serviço principal de API
│   │   ├── CacheService.ts       # Serviço de cache
│   │   └── auth.ts               # Serviço de autenticação
│   ├── 📁 stores/                # Estados globais (Zustand)
│   │   ├── authStore.ts          # Estado de autenticação
│   │   ├── appointmentStore.ts   # Estado de agendamentos
│   │   └── commentStore.ts       # Estado de comentários
│   ├── 📁 types/                 # Definições de tipos
│   │   └── index.ts              # Tipos globais
│   ├── 📁 utils/                 # Utilitários
│   │   ├── dateUtils.ts          # Utilitários de data
│   │   ├── formatters.ts         # Formatadores
│   │   ├── validators.ts         # Validadores
│   │   └── logger.ts             # Sistema de logs
│   ├── 📁 validation/            # Schemas de validação
│   │   └── schemas.ts            # Schemas Zod
│   ├── App.tsx                   # Componente principal
│   ├── main.tsx                  # Ponto de entrada
│   └── index.css                 # Estilos globais
├── 📄 package.json               # Dependências e scripts
├── 📄 vite.config.ts             # Configuração do Vite
├── 📄 tsconfig.json              # Configuração TypeScript
├── 📄 tailwind.config.js         # Configuração Tailwind
├── 📄 eslint.config.js           # Configuração ESLint
└── 📄 README.md                  # Documentação
```

### Organização por Responsabilidade

#### 🧩 Components
- **auth/**: Login, registro, recuperação de senha
- **feature/**: Funcionalidades específicas (agendamento, dashboard)
- **ui/**: Componentes reutilizáveis (botões, modais, inputs)

#### 🔧 Services
- **Camada de abstração** para APIs externas
- **Cache inteligente** com estratégias configuráveis
- **Retry automático** com backoff exponencial
- **Health monitoring** da API

#### 🗃️ Stores (Zustand)
- **Estado global** reativo e tipado
- **Persistência** automática quando necessário
- **Middleware** para logging e debugging

#### 🎣 Hooks Customizados
- **useAsync**: Gerenciamento de operações assíncronas
- **useCache**: Interface simplificada para cache
- **useForm**: Formulários com validação integrada
- **useFormValidation**: Validação em tempo real

---


## 🧠 Padrões de Projeto

- **Repository Pattern**
- **Strategy Pattern**
- **Observer Pattern**
- **Factory Pattern**
- **Decorator Pattern**

---

## 🚀 Instalação e Execução

### 📋 Pré-requisitos

- **Node.js** >= 16.0.0
- **npm** >= 8.0.0 ou **yarn** >= 1.22.0
- **Git** para controle de versão

### ⚡ Instalação Rápida

```bash
# 1. Clone o repositório
git clone https://github.com/maiconbre/Barbershop.git

# 2. Acesse o diretório
cd Barbershop

# 3. Instale as dependências
npm install
# ou
yarn install

# 4. Configure o ambiente 
cp .env.development .env

# 5. Inicie o servidor de desenvolvimento
npm run dev
# ou
yarn dev
```

## 📜 Scripts Disponíveis

### 🔧 Desenvolvimento

```bash
# Servidor de desenvolvimento (modo padrão)
npm run dev

# Servidor de desenvolvimento (ambiente local)
npm run dev:local

# Servidor de desenvolvimento (ambiente de produção)
npm run dev:prod
```

### 🏗️ Build

```bash
# Build para produção
npm run build

# Build para desenvolvimento
npm run build:dev

# Build para produção (explícito)
npm run build:prod
```

### 👀 Preview

```bash
# Preview da build (modo padrão)
npm run preview

# Preview da build de desenvolvimento
npm run preview:dev

# Preview da build de produção
npm run preview:prod
```

### 🔍 Qualidade de Código

```bash
# Executar linting
npm run lint

# Teste de conexão com Supabase
npm run test:supabase
```

### 🔄 Utilitários

```bash
# Alternar para ambiente local
npm run env:switch-local

# Alternar para ambiente de produção
npm run env:switch-prod

# Iniciar desenvolvimento (Windows)
npm run start:dev
```

## 👨‍💻 Guia de Desenvolvimento

### 🎯 Fluxo de Desenvolvimento

1. **Setup Inicial**
   ```bash
   git clone <repo>
   cd Barbershop
   npm install
   npm run dev:local
   ```

2. **Desenvolvimento de Features**
   ```bash
   git checkout -b feature/nova-funcionalidade
   # Desenvolver...
   npm run lint
   git commit -m "feat: nova funcionalidade"
   ```

3. **Testes e Validação**
   ```bash
   npm run build:dev
   npm run preview:dev
   npm run test:supabase
   ```

### 🏗️ Criando Novos Componentes

```typescript
// src/components/feature/MeuComponente.tsx
import React from 'react';
import { motion } from 'framer-motion';

interface MeuComponenteProps {
  title: string;
  onAction?: () => void;
}

export const MeuComponente: React.FC<MeuComponenteProps> = ({ 
  title, 
  onAction 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 bg-white rounded-lg shadow-md"
    >
      <h2 className="text-xl font-semibold">{title}</h2>
      {onAction && (
        <button 
          onClick={onAction}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
        >
          Ação
        </button>
      )}
    </motion.div>
  );
};
```

### 🗃️ Criando Stores Zustand

```typescript
// src/stores/meuStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface MeuState {
  dados: any[];
  loading: boolean;
  fetchDados: () => Promise<void>;
  addItem: (item: any) => void;
}

export const useMeuStore = create<MeuState>()()
  persist(
    (set, get) => ({
      dados: [],
      loading: false,
      
      fetchDados: async () => {
        set({ loading: true });
        try {
          // Lógica de fetch...
          set({ dados: resultado, loading: false });
        } catch (error) {
          set({ loading: false });
        }
      },
      
      addItem: (item) => {
        set((state) => ({ 
          dados: [...state.dados, item] 
        }));
      }
    }),
    {
      name: 'meu-store',
      partialize: (state) => ({ dados: state.dados })
    }
  )
);
```

### 🎣 Criando Hooks Customizados

```typescript
// src/hooks/useMeuHook.ts
import { useState, useEffect } from 'react';
import { ApiService } from '@/services';

export const useMeuHook = (id: string) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await ApiService.get(`/endpoint/${id}`);
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);
  
  return { data, loading, error };
};
```

### 🔧 Configuração TypeScript

```json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```


---

### 🔑 Credenciais de Teste

| Função       | Usuário     | Senha     |
|--------------|-------------|-----------|
| Admin        | `admin`     | `123123`  |
| Barbeiro 1   | `gabrielle` | `123123`  |
| Barbeiro 2   | `marcos`    | `123123`  |

---

## 📱 Demonstração

Acesse a versão online:  
🔗 [https://barber.targetweb.tech/](https://barber.targetweb.tech/)

---

## 📸 Capturas de Tela

<div align="center">
  <h4>Página Inicial | Escolha de Horário | Dashboard</h4>
  <img src="./public/screenshots/Img1.PNG" width="200px" />
  <img src="./public/screenshots/Img2.PNG" width="200px" />
  <img src="./public/screenshots/Img3.PNG" width="200px" />

  <h4>Cards de Agendamento | Agenda do Barbeiro | Métricas</h4>
  <img src="./public/screenshots/Img4.PNG" width="200px" />
  <img src="./public/screenshots/Img5.PNG" width="200px" />
  <img src="./public/screenshots/Img6.PNG" width="200px" />
</div>

---

## 🔄 Roadmap

### 🎯 Próximas Funcionalidades

#### 🧪 Prioridade Alta
- [ ] **Testes Automatizados** - Implementação completa de testes unitários e de integração
- [ ] **Error Boundaries** - Tratamento robusto de erros em componentes
- [ ] **Logging Avançado** - Sistema de logs estruturado para produção
- [ ] **Monitoramento** - Métricas de performance e saúde da aplicação

#### 🚀 Prioridade Média
- [ ] **PWA (Progressive Web App)** - Funcionalidades offline e instalação
- [ ] **Notificações Push** - Alertas em tempo real para agendamentos
- [ ] **Integração com Pagamentos** - Stripe, PayPal, PIX
- [ ] **Sistema de Avaliações** - Reviews e ratings dos serviços

#### 🌟 Prioridade Baixa
- [ ] **Aplicativo Mobile** - React Native (iOS e Android)
- [ ] **Suporte Multi-tenant** - Múltiplas barbearias
- [ ] **IA para Recomendações** - Sugestões personalizadas
- [ ] **Integração com Calendários** - Google Calendar, Outlook

### 🔧 Melhorias Técnicas

- [ ] **Micro-frontends** - Arquitetura modular
- [ ] **GraphQL** - API mais eficiente
- [ ] **Server-Side Rendering** - SEO e performance
- [ ] **Docker** - Containerização para deploy

## 🆘 Troubleshooting

### 🐛 Problemas Comuns

#### Erro de Conexão com API
```bash
# Verificar se a API está rodando
curl https://chemical-penelopa-soma-8513fd0f.koyeb.app/health

# Verificar variáveis de ambiente
echo $VITE_API_URL

# Testar conexão
npm run test:supabase
```

#### Problemas de Cache
```typescript
// Limpar cache manualmente
import { CacheService } from '@/services';

// No console do navegador
CacheService.clearCache();
localStorage.clear();
sessionStorage.clear();
```

#### Erro de Build
```bash
# Limpar cache do Vite
rm -rf node_modules/.vite

# Reinstalar dependências
rm -rf node_modules package-lock.json
npm install

# Build limpa
npm run build:prod
```

### 🔍 Debug Mode

```bash
# Ativar modo debug
export VITE_DEBUG_API=true
export VITE_DEV_MODE=true

# Ou no .env
VITE_DEBUG_API=true
VITE_DEV_MODE=true
```

## ❓ FAQ

### 🤔 Perguntas Frequentes

**Q: Como alterar a URL da API?**
A: Modifique a variável `VITE_API_URL` no arquivo `.env` ou use os scripts `npm run env:switch-local` / `npm run env:switch-prod`.

**Q: Por que o cache não está funcionando?**
A: Verifique se o `CacheService` está inicializado e se as configurações de TTL estão corretas no `apiConfig.ts`.

**Q: Como adicionar um novo ambiente?**
A: Adicione a configuração em `src/config/environmentConfig.ts` e crie o arquivo `.env` correspondente.

**Q: O projeto funciona offline?**
A: Atualmente não. PWA está no roadmap para implementação futura.

**Q: Como contribuir com o projeto?**
A: Siga o [Guia de Contribuição](#-contribuindo) e abra um Pull Request.

### 🔧 Configurações Avançadas

#### Personalizar Cache
```typescript
// src/config/apiConfig.ts
export const CUSTOM_CACHE_CONFIG = {
  comments: { ttl: 15 * 60 * 1000 },  // 15 minutos
  services: { ttl: 10 * 60 * 1000 },  // 10 minutos
  // ...
};
```

#### Configurar Retry
```typescript
// src/config/apiConfig.ts
export const RETRY_CONFIG = {
  maxAttempts: 5,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2
};
```

## 📊 Métricas e Analytics

### 📈 Performance Atual

- **Lighthouse Score**: 95+
- **Bundle Size**: ~450KB (gzipped)
- **First Load**: ~1.2s
- **Cache Hit Rate**: ~85%


## 🔐 Segurança

### 🛡️ Práticas Implementadas

- **Validação de Input** - Zod schemas em todas as entradas
- **Sanitização** - Prevenção de XSS
- **HTTPS** - Comunicação criptografada
- **Autenticação JWT** - Tokens seguros
- **Rate Limiting** - Proteção contra spam

### 🔒 Melhorias

- [ ] Implementar CSP (Content Security Policy)
- [ ] Adicionar CSRF protection
- [ ] Configurar CORS 
- [ ] Implementar 2FA (Two-Factor Authentication)


---

## 🤝 Contribuindo

### 🚀 Como Contribuir

Contribuições são sempre bem-vindas! Siga este guia para contribuir de forma efetiva:

####  🍴 Fork e Clone
```bash
# Fork o repositório no GitHub
# Clone seu fork
git clone https://github.com/SEU_USERNAME/Barbershop.git
cd Barbershop

# Adicione o repositório original como upstream
git remote add upstream https://github.com/maiconbre/Barbershop.git
```


####  💻 Desenvolva
```bash
# Instale dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev:local

# Faça suas alterações...
# Teste suas alterações
npm run lint
npm run build:dev
```

####  📤 Push e Pull Request
```bash
# Push para seu fork
git push origin feature/nome-da-feature

# Abra um Pull Request no GitHub
# Preencha o template de PR
```

### 🐛 Reportando Bugs

Para reportar bugs, abra uma [issue](https://github.com/maiconbre/Barbershop/issues) com:

1. **Descrição** do problema
2. **Passos para reproduzir**
3. **Comportamento esperado**
4. **Screenshots** (se aplicável)
5. **Ambiente** (OS, browser, versão)

### 💡 Sugerindo Funcionalidades

Para sugerir novas funcionalidades:

1. Verifique se já não existe uma issue similar
2. Abra uma nova issue com label `enhancement`
3. Descreva detalhadamente a funcionalidade
4. Explique o valor que ela agregaria
5. Considere a complexidade de implementação

### 👥 Código de Conduta

- 🤝 Seja respeitoso e inclusivo
- 💬 Comunique-se de forma clara e construtiva
- 🎯 Foque no problema, não na pessoa
- 📚 Esteja aberto a aprender e ensinar
- 🌟 Celebre as contribuições de outros


### 🎯 Áreas que Precisam de Ajuda

1. **🧪 Testes** - Implementação de testes automatizados
2. **📱 Responsividade** - Melhorias desktop
3. **♿ Acessibilidade** - ARIA labels, navegação por teclado
4. **🌐 Internacionalização** - Suporte a múltiplos idiomas
5. **📊 Performance** - Otimizações e métricas

### 🚀 Processo de Review

1. **Automated Checks** - CI/CD executa automaticamente
2. **Code Review** - Eu reviso o código
3. **Testing** - Funcionalidade é testada
4. **Approval** - PR é aprovado
5. **Merge** - Código é integrado à main

### 📞 Contato

Dúvidas sobre contribuição?

- 📧 Email: [maiconbre277@gmail.com](mailto:maiconbre277@gmail.com)

---

**Obrigado por contribuir! 🙏**

---

## 📄 Licença

Este projeto está licenciado sob a [MIT License](LICENSE).

---

Desenvolvido com ❤️ por [Maicon Brendon](https://github.com/maiconbre)
