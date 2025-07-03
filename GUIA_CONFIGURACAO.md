# 🎯 Guia de Configuração Individual por Servidor

## 📋 Visão Geral

Cada servidor no sistema de tickets tem sua **configuração completamente independente** armazenada no banco de dados MongoDB. Isso permite que o bot funcione em múltiplos servidores com configurações diferentes, sem interferência entre eles.

## 🏗️ Estrutura de Configuração Individual

### 📊 **Como Funciona**

1. **Identificação Única**: Cada servidor é identificado pelo seu `guildId` único
2. **Configuração Isolada**: Todas as configurações são armazenadas separadamente
3. **Carregamento Dinâmico**: Configurações são carregadas do banco em tempo real
4. **Validação Automática**: Sistema verifica configurações antes de executar ações

### 🗄️ **Estrutura no Banco de Dados**

```javascript
// Coleção: guilds
{
  guildId: "123456789012345678",        // ID único do servidor
  name: "Aztlan City",                  // Nome do servidor
  ticketSettings: {
    enabled: true,                      // Sistema ativo/inativo
    categoryId: "987654321098765432",   // Categoria para tickets
    supportRoleId: "555666777888999",   // Cargo de suporte
    logsChannelId: "111222333444555",   // Canal de logs
    maxTicketsPerUser: 1,               // Máximo de tickets por usuário
    autoCloseAfter: 24,                 // Auto-fechamento em horas
    welcomeMessage: "Mensagem personalizada...",
    closeMessage: "Mensagem de fechamento...",
    colors: {
      primary: '#0099ff',
      success: '#00ff00',
      warning: '#ffff00',
      error: '#ff0000'
    }
  },
  ticketTypes: { /* Tipos de tickets configurados */ },
  staffRoles: [ /* Cargos da staff */ ],
  blacklistedUsers: [ /* Usuários banidos */ ],
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-15T12:30:00.000Z"
}
```

## 🔧 Processo de Configuração Individual

### **Passo 1: Primeira Execução**
Quando um servidor usa o bot pela primeira vez:

```javascript
// O sistema automaticamente cria uma configuração padrão
const config = new Guild({
  guildId: interaction.guildId,  // ID único do servidor
  name: interaction.guild.name,  // Nome do servidor
  ticketSettings: {
    enabled: false,              // Sistema desabilitado por padrão
    categoryId: null,            // Ainda não configurado
    supportRoleId: null,         // Ainda não configurado
    logsChannelId: null,         // Ainda não configurado
    maxTicketsPerUser: 1,        // Valor padrão
    autoCloseAfter: 24,          // Valor padrão
    // ... outras configurações padrão
  }
});
```

### **Passo 2: Configuração Manual**
O administrador do servidor deve configurar usando comandos:

```bash
# 1. Definir categoria para tickets
/setup category #categoria-tickets

# 2. Definir cargo de suporte
/setup support @Suporte

# 3. Definir canal de logs
/setup logs #logs-tickets

# 4. Configurar limites
/setup max 3

# 5. Configurar auto-fechamento
/setup auto 48

# 6. Ativar o sistema
/setup enable
```

### **Passo 3: Validação Automática**
O sistema valida automaticamente:

```javascript
async validateGuildSetup(guild) {
  const config = await this.getGuildConfig(guild.id);
  
  // Verificar se categoria existe
  const category = guild.channels.cache.get(config.ticketSettings.categoryId);
  
  // Verificar se cargo existe
  const role = guild.roles.cache.get(config.ticketSettings.supportRoleId);
  
  // Verificar permissões do bot
  const botMember = guild.members.me;
  const hasPermissions = category.permissionsFor(botMember).has([
    'ManageChannels',
    'ViewChannel',
    'SendMessages'
  ]);
  
  return { valid: true/false, errors: [], warnings: [] };
}
```

## 🎯 Comandos de Configuração Individual

### **Comando Principal: `/setup`**

#### **Subcomandos Disponíveis:**

```bash
# Configurações Básicas
/setup category <categoria>    # Define categoria para tickets
/setup support <cargo>         # Define cargo de suporte
/setup logs <canal>            # Define canal de logs

# Configurações Avançadas
/setup max <1-5>               # Máximo de tickets por usuário
/setup auto <0-168>            # Auto-fechamento em horas

# Controle do Sistema
/setup enable                  # Ativa o sistema
/setup disable                 # Desativa o sistema
/setup reset                   # Reseta todas as configurações

# Visualização
/setup                         # Mostra configuração atual
```

#### **Exemplo de Configuração Completa:**

```bash
# Servidor A
/setup category #tickets-servidor-a
/setup support @Suporte-A
/setup logs #logs-servidor-a
/setup max 2
/setup auto 24
/setup enable

# Servidor B (configuração diferente)
/setup category #suporte-servidor-b
/setup support @Staff-B
/setup logs #logs-servidor-b
/setup max 5
/setup auto 72
/setup enable
```

## 📊 Visualização da Configuração

### **Comando `/setup` (sem subcomandos)**

Mostra a configuração atual do servidor:

```
⚙️ | Configuração Atual

📊 Status: ✅ Ativo
📁 Categoria: #tickets-servidor-a
👥 Cargo Suporte: @Suporte-A
📝 Canal Logs: #logs-servidor-a
🔢 Máx. Tickets: 2
⏰ Auto-fechamento: 24h
```

### **Comando `/servers info <id>`**

Para administradores globais verem configurações de qualquer servidor:

```
📊 | Informações do Servidor

🏠 Nome: Aztlan City
🆔 ID: 123456789012345678
⚙️ Status: ✅ Ativo
🎫 Total de Tickets: 45
🔧 Configurado: ✅ Sim
📅 Última Atividade: 15/01/2024 12:30
🔗 Status no Discord: ✅ Servidor encontrado
```

## 🔄 Processo de Carregamento Dinâmico

### **Como o Sistema Carrega Configurações:**

```javascript
// 1. Quando um comando é executado
async execute(interaction) {
  const guildId = interaction.guildId;  // ID do servidor atual
  
  // 2. Buscar configuração específica do servidor
  const config = await TicketManager.getGuildConfig(guildId);
  
  // 3. Aplicar configurações específicas
  if (config.ticketSettings.enabled) {
    // Sistema ativo para este servidor
  }
  
  // 4. Usar configurações específicas
  const maxTickets = config.ticketSettings.maxTicketsPerUser;
  const categoryId = config.ticketSettings.categoryId;
}
```

### **Exemplo de Configurações Diferentes:**

```javascript
// Servidor A
{
  guildId: "111111111111111111",
  ticketSettings: {
    enabled: true,
    maxTicketsPerUser: 1,
    autoCloseAfter: 24,
    categoryId: "AAAAAAA"
  }
}

// Servidor B
{
  guildId: "222222222222222222", 
  ticketSettings: {
    enabled: true,
    maxTicketsPerUser: 3,
    autoCloseAfter: 72,
    categoryId: "BBBBBBB"
  }
}
```

## 🛡️ Validações e Segurança

### **Validações Automáticas por Servidor:**

1. **Existência de Elementos**:
   - Categoria existe no servidor
   - Cargo de suporte existe
   - Canal de logs existe

2. **Permissões do Bot**:
   - Pode gerenciar canais na categoria
   - Pode enviar mensagens no canal de logs
   - Pode ver e gerenciar cargos

3. **Configurações Válidas**:
   - Limites dentro dos parâmetros aceitáveis
   - IDs válidos do Discord
   - Sistema habilitado/desabilitado

### **Exemplo de Validação:**

```javascript
// Para cada servidor individualmente
const validation = await TicketManager.validateGuildSetup(guild);

if (!validation.valid) {
  // Mostrar erros específicos do servidor
  const errors = validation.errors.join(', ');
  return `❌ Configuração inválida: ${errors}`;
}
```

## 📈 Monitoramento Individual

### **Logs por Servidor:**

```javascript
// Logs específicos de cada servidor
console.log(`🔍 Buscando configuração para servidor: ${guildId}`);
console.log(`✅ Configuração encontrada para servidor: ${guildId}`);
console.log(`🔄 Atualizando configuração para servidor: ${guildId}`);
```

### **Estatísticas por Servidor:**

```bash
# Ver estatísticas de um servidor específico
/servers info 123456789012345678

# Ver estatísticas de todos os servidores
/servers stats
```

## 🔧 Comandos de Gerenciamento Global

### **Para Administradores Globais:**

```bash
# Listar todos os servidores
/servers list

# Buscar servidor por nome
/servers search "Aztlan"

# Estatísticas gerais
/servers stats

# Limpeza automática
/servers cleanup
```

## 🎯 Vantagens da Configuração Individual

### ✅ **Benefícios:**

1. **Isolamento**: Configurações não interferem entre servidores
2. **Flexibilidade**: Cada servidor pode ter configurações diferentes
3. **Escalabilidade**: Sistema suporta centenas de servidores
4. **Segurança**: Validações específicas por servidor
5. **Monitoramento**: Logs e estatísticas individuais
6. **Manutenção**: Fácil gerenciamento e troubleshooting

### 📊 **Exemplo de Uso Real:**

```javascript
// Servidor de Gaming
{
  guildId: "gaming-server",
  ticketSettings: {
    maxTicketsPerUser: 1,
    autoCloseAfter: 12,
    categoryId: "gaming-tickets"
  }
}

// Servidor de Suporte
{
  guildId: "support-server", 
  ticketSettings: {
    maxTicketsPerUser: 3,
    autoCloseAfter: 72,
    categoryId: "support-tickets"
  }
}

// Servidor de Comunidade
{
  guildId: "community-server",
  ticketSettings: {
    maxTicketsPerUser: 2,
    autoCloseAfter: 48,
    categoryId: "community-tickets"
  }
}
```

## 🚀 Como Iniciar a Configuração

### **Para um Novo Servidor:**

1. **Adicionar o bot ao servidor**
2. **Dar permissões necessárias ao bot**
3. **Executar configuração inicial:**
   ```bash
   /setup category #categoria-tickets
   /setup support @Cargo-Suporte
   /setup logs #canal-logs
   /setup enable
   ```
4. **Verificar configuração:**
   ```bash
   /setup
   ```
5. **Criar painel de tickets:**
   ```bash
   /ticket
   ```

### **Para Verificar Configuração:**

```bash
# Ver configuração atual
/setup

# Ver estatísticas
/stats

# Ver informações detalhadas (se for admin global)
/servers info <id-do-servidor>
```

---

**🎯 Cada servidor tem controle total sobre sua configuração, permitindo personalização completa e funcionamento independente!** 