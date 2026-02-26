Boa. Agora estamos falando de **produto de verdade**, não só sistema 👀✂️
Vou estruturar isso como **projeto robusto + regras claras**, do jeito que dá pra virar documentação, backlog e argumento comercial.

Vou separar em 4 blocos:

1. Visão geral do app
2. Planos e limites
3. Funcionalidades por módulo (sem notificações)
4. **Regra de prioridade (o coração do sistema)**

---

# 🧱 PROJETO DO APP — PLATAFORMA DE AGENDAMENTO PARA BARBEARIAS

## 🎯 Objetivo do Produto

Oferecer uma plataforma de agendamento **simples para o barbeiro**, **rápida para o cliente** e **escalável para o negócio**, com planos bem definidos e upgrade natural conforme crescimento da barbearia.

---

## 1️⃣ VISÃO GERAL DO APP

### Tipo

* App Web (Admin + Página pública)
* Responsivo (desktop e mobile)

### Perfis de Usuário

* Dono da barbearia
* Barbeiro (profissional)
* Cliente final (não logado)

---

## 2️⃣ PLANOS E LIMITES (REGRA DE NEGÓCIO)

| Plano   | Barbeiros | Agendamentos/mês | Preço   |
| ------- | --------- | ---------------- | ------- |
| Free    | 1         | 15               | R$0     |
| Start   | 1         | 60               | R$19,90 |
| Premium | Até 6     | 1000             | R$49,90 |

### Regras globais

* Contador mensal reinicia automaticamente
* Ao atingir limite:

  * Cliente **não consegue agendar**
  * Barbeiro vê aviso + CTA de upgrade
* Agendamentos cancelados **não retornam ao saldo** (regra simples e segura)

---

## 3️⃣ FUNCIONALIDADES POR MÓDULO (ROBUSTO, SEM NOTIFICAÇÕES)

---

## 🧠 MÓDULO 1 — Conta & Plano

### Funções

* Visualizar plano atual
* Visualizar limites:

  * Agendamentos usados
  * Barbeiros ativos
* Histórico de uso mensal
* Upgrade / downgrade de plano
* Bloqueio automático de funções conforme plano

---

## 🏪 MÓDULO 2 — Barbearia

### Funções

* Dados da barbearia
* Identidade visual (logo/capa)
* Horários de funcionamento
* Dias não trabalhados
* Página pública (slug única)

### Regra

* Slug é única e imutável após criação
* Alterações refletem em tempo real na página pública

---

## ✂️ MÓDULO 3 — Serviços

### Funções

* CRUD de serviços
* Definir:

  * Nome
  * Preço
  * Duração
  * Ativo / inativo
* Ordem de exibição

### Regras

* Serviço inativo não aparece no agendamento
* Duração impacta disponibilidade de horários

---

## 👤 MÓDULO 4 — Barbeiros (Profissionais)

### Funções

* Criar / editar barbeiros
* Definir serviços atendidos
* Definir agenda individual
* Ativar / desativar barbeiro

### Regras por plano

* Free / Start: apenas 1 barbeiro
* Premium: até 6 barbeiros
* Barbeiro inativo:

  * Não aparece para novos agendamentos
  * Mantém histórico

---

## 📆 MÓDULO 5 — Agenda

### Funções

* Visualização:

  * Diária
  * Semanal
* Bloqueio manual de horários
* Exceções de agenda
* Ajustes pontuais

### Regras

* Agenda respeita:

  * Horário da barbearia
  * Agenda do barbeiro
  * Duração do serviço
* Sem conflito de horários

---

## 🧾 MÓDULO 6 — Agendamentos (CORE DO SISTEMA)

### Funções

* Criar agendamento (cliente)
* Listar agendamentos
* Detalhes do agendamento
* Alterar status:

  * Confirmado
  * Concluído
  * Cancelado

### Regras

* Agendamento conta no limite **no momento da criação**
* Não pode ultrapassar limite mensal
* Cancelamentos não devolvem saldo
* Histórico sempre preservado

---

## 👥 MÓDULO 7 — Clientes

### Funções

* Cadastro automático
* Histórico por cliente
* Visualização simples

### Regras

* Cliente não possui login
* Dados mínimos (nome + telefone)

---

## 🌐 MÓDULO 8 — Página Pública + Modal de Agendamento

### Funções

* Exibição pública da barbearia
* Modal dinâmico:

  * Serviço
  * Barbeiro
  * Data
  * Horário
* Validação em tempo real

### Regras

* Bloqueio automático ao atingir limite
* Horários sempre sincronizados com agenda

---

## 4️⃣ REGRA DE PRIORIDADE (ARQUITETURA DE DECISÃO)

### 🔥 ORDEM DE PRIORIDADE DO SISTEMA

Essa ordem **nunca pode ser quebrada**:

### 1️⃣ Plano do Usuário

Tudo começa aqui
⬇️

### 2️⃣ Limites do Plano

* Agendamentos
* Barbeiros
  ⬇️

### 3️⃣ Estado da Barbearia

* Ativa
* Horários configurados
  ⬇️

### 4️⃣ Estado do Barbeiro

* Ativo
* Agenda disponível
  ⬇️

### 5️⃣ Serviço

* Ativo
* Duração válida
  ⬇️

### 6️⃣ Agenda

* Horário livre
* Sem conflito
  ⬇️

### 7️⃣ Criação do Agendamento

---

## 🧠 REGRA DE OURO

> **Se qualquer nível falhar, o fluxo para imediatamente.**

Exemplo:

* Plano ok ❌ Limite estourado → **bloqueia**
* Limite ok ❌ barbeiro inativo → **não exibe**
* Tudo ok → **agendamento permitido**

---

## 🔌 NOTIFICAÇÕES (SEPARADAS — CONFORME PEDIDO)

Tudo relacionado a:

* Email
* WhatsApp
* SMS
* Integrações externas

👉 **Fora do core do sistema**
👉 Consumindo eventos do tipo:

* `AGENDAMENTO_CRIADO`
* `AGENDAMENTO_CANCELADO`
* `AGENDAMENTO_CONCLUIDO`

---

