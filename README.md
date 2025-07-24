# 💈 BarberShop - Sistema de Agendamento para Barbearias

<p align="center">
  <img src="./public/img/tela-inicial.png" alt="BarberShop" />
</p>

O **BarberShop** é um sistema moderno e completo de agendamento online voltado para barbearias. A plataforma permite que clientes agendem serviços com facilidade, barbeiros organizem suas agendas de forma eficiente e administradores gerenciem toda a operação por meio de um painel intuitivo.

Desenvolvido com foco em escalabilidade, usabilidade e arquitetura limpa, o sistema aplica os princípios SOLID, boas práticas de engenharia de software e tecnologias modernas do ecossistema React.

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

### Frontend
- **React.js**
- **TypeScript**
- **Tailwind CSS**
- **Framer Motion**
- **Zustand**
- **React Router**
- **Zod**
- **Recharts**
- **React Window**

### Ferramentas
- **Vite**
- **ESLint**
- **PostCSS**

---

### Estrutura de Diretórios

```
src/
├── components/
│   ├── feature/
│   └── ui/
├── contexts/
├── hooks/
├── models/
├── pages/
├── services/
├── stores/
├── types/
├── utils/
└── validation/
```

---


## 🚀 Instalação e Execução Local

### Requisitos
- Node.js (v16+)
- npm ou yarn

### Passo a passo

```bash
# Clone o repositório
git clone https://github.com/maiconbre/BarberShop.git

# Acesse o diretório
cd BarberShop

# Instale as dependências
npm install
# ou
yarn install

# Inicie o servidor
npm run dev
# ou
yarn dev
```

Abra [http://localhost:5173](http://localhost:5173) no navegador.

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

- [ ] PWA (Progressive Web App)
- [ ] Integração com sistemas de pagamento
- [ ] Notificações por e-mail e SMS
- [ ] Aplicativo mobile (iOS e Android)
- [ ] Suporte a múltiplas unidades

---

## 🤝 Contribuindo

1. Faça um fork do projeto  
2. Crie sua branch (`git checkout -b feature/nome-da-feature`)  
3. Commit suas alterações (`git commit -m 'feat: nova funcionalidade'`)  
4. Push para o seu fork (`git push origin feature/nome-da-feature`)  
5. Crie um Pull Request 🚀

---

## 📄 Licença

Este projeto está licenciado sob a [MIT License](LICENSE).

---

Desenvolvido com ❤️ por [Maicon Brendon](https://github.com/maiconbre)
