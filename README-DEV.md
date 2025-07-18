# Guia de Desenvolvimento - BarberGR

Este guia contém instruções para configurar e executar o ambiente de desenvolvimento local do BarberGR.

## Pré-requisitos

- Node.js (v16 ou superior)
- npm (v7 ou superior)
- PostgreSQL (ou acesso ao banco de dados Supabase)
- PowerShell (para Windows)

## Configuração do Ambiente Local

### 1. Clone o Repositório

```bash
git clone https://github.com/seu-usuario/BarberGR.git
cd BarberGR
```

### 2. Configuração do Arquivo .env.local

O arquivo `.env.local` já foi criado com as configurações básicas para desenvolvimento local. Verifique se as configurações estão corretas, especialmente a URL do banco de dados Supabase.

```
# Configurações de ambiente local

# URL da API local
VITE_API_URL=http://localhost:6543

# URL do banco de dados Supabase
DATABASE_URL=postgresql://postgres:rDazZ1zCjD3PkOKJ@db.xxxsgvqbnkftoswascds.supabase.co:5432/postgres

# Configurações JWT
JWT_SECRET=seu_jwt_secret_local
JWT_EXPIRES_IN=1d
REFRESH_TOKEN_SECRET=seu_refresh_token_secret_local
REFRESH_TOKEN_EXPIRES_IN=7d

# Porta do servidor
PORT=6543
```

**Importante:** Substitua os valores de `JWT_SECRET` e `REFRESH_TOKEN_SECRET` por valores seguros para seu ambiente local.

### 3. Instalação de Dependências

#### Backend

```bash
cd backend
npm install
cd ..
```

#### Frontend

```bash
npm install
```

### 4. Iniciar o Ambiente de Desenvolvimento

Utilize o script `start-dev.ps1` para iniciar automaticamente o ambiente de desenvolvimento:

```powershell
.\start-dev.ps1
```

Este script irá:
1. Verificar e aplicar as configurações locais
2. Iniciar o backend na porta 6543
3. Iniciar o frontend na porta 5173

Alternativamente, você pode iniciar manualmente os serviços:

#### Backend

```bash
cd backend
npm run dev
```

#### Frontend

```bash
npm run dev
```

## Estrutura do Projeto

```
BarberGR/
├── backend/           # Código do servidor Express
│   ├── controllers/   # Controladores da API
│   ├── middleware/    # Middlewares Express
│   ├── models/        # Modelos Sequelize
│   ├── routes/        # Rotas da API
│   └── server.js      # Ponto de entrada do servidor
├── public/            # Arquivos estáticos
├── src/               # Código fonte do frontend React
│   ├── components/    # Componentes React
│   ├── constants/     # Constantes e configurações
│   ├── contexts/      # Contextos React
│   ├── hooks/         # Hooks personalizados
│   ├── models/        # Modelos de dados
│   ├── pages/         # Páginas da aplicação
│   ├── services/      # Serviços (API, cache, etc.)
│   ├── stores/        # Stores Zustand
│   └── utils/         # Utilitários
└── .env.local         # Variáveis de ambiente locais
```

## Banco de Dados

O projeto utiliza o Supabase como banco de dados PostgreSQL. A conexão já está configurada no arquivo `backend/models/database.js`.

### Modelos de Dados

Os principais modelos de dados são:

- **User**: Usuários do sistema
- **Barber**: Barbeiros disponíveis
- **Service**: Serviços oferecidos
- **Appointment**: Agendamentos

## Fluxo de Desenvolvimento

1. Crie uma branch para sua feature: `git checkout -b feature/nome-da-feature`
2. Implemente suas alterações
3. Execute os testes (quando disponíveis)
4. Faça commit das alterações: `git commit -m "Descrição da alteração"`
5. Envie para o repositório: `git push origin feature/nome-da-feature`
6. Crie um Pull Request

## Solução de Problemas

### Erro de Conexão com o Banco de Dados

Verifique se as credenciais do Supabase estão corretas no arquivo `.env.local`.

### Erro de CORS

O backend está configurado para aceitar requisições de `http://localhost:5173`. Se você estiver executando o frontend em uma porta diferente, atualize a configuração CORS no arquivo `backend/server.js`.

### Outros Problemas

Se encontrar outros problemas, verifique os logs do console do backend e do frontend para identificar a causa.

## Recursos Adicionais

- [Documentação do Express](https://expressjs.com/)
- [Documentação do React](https://reactjs.org/docs/getting-started.html)
- [Documentação do Sequelize](https://sequelize.org/)
- [Documentação do Supabase](https://supabase.io/docs)