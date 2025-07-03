# 🎯 Exemplos Práticos de Configuração Individual

## 📋 Cenários de Uso Real

Aqui estão exemplos práticos de como diferentes tipos de servidores configuram o sistema de tickets de forma individual e independente.

## 🎮 Servidor de Gaming (Aztlan City)

### **Configuração Específica:**
```bash
# 1. Configuração básica
/setup category #🎫・tickets
/setup support @Suporte
/setup logs #📝・logs-tickets

# 2. Configurações específicas para gaming
/setup max 1          # Apenas 1 ticket por usuário (evita spam)
/setup auto 12        # Auto-fechamento em 12 horas (resposta rápida)

# 3. Ativar sistema
/setup enable
```

### **Resultado no Banco de Dados:**
```javascript
{
  guildId: "123456789012345678",
  name: "Aztlan City",
  ticketSettings: {
    enabled: true,
    categoryId: "987654321098765432",
    supportRoleId: "555666777888999",
    logsChannelId: "111222333444555",
    maxTicketsPerUser: 1,        // Restritivo para gaming
    autoCloseAfter: 12,          // Resposta rápida esperada
    welcomeMessage: "Bem-vindo ao seu ticket! Aguarde um membro da staff.",
    closeMessage: "Ticket fechado. Obrigado por usar nosso sistema!"
  }
}
```

### **Tipos de Tickets Configurados:**
- 📛 **Denúncia** - Para denunciar jogadores
- ⚠️ **Denúncia Staff** - Para denunciar membros da staff
- 💀 **Facções** - Para assumir facções/organizações
- 🐌 **Bugs** - Para reportar problemas na cidade
- 🕵️ **Corregedoria** - Para assuntos da corregedoria
- 💰 **Vips** - Para problemas relacionados a VIPs
- 🏘️ **Imobiliária** - Para dúvidas sobre propriedades

---

## 🏢 Servidor Corporativo (Tech Solutions)

### **Configuração Específica:**
```bash
# 1. Configuração básica
/setup category #suporte-técnico
/setup support @Suporte-Técnico
/setup logs #logs-suporte

# 2. Configurações específicas para empresa
/setup max 3          # Até 3 tickets por usuário (diferentes assuntos)
/setup auto 72        # Auto-fechamento em 72 horas (processo mais longo)

# 3. Ativar sistema
/setup enable
```

### **Resultado no Banco de Dados:**
```javascript
{
  guildId: "222222222222222222",
  name: "Tech Solutions",
  ticketSettings: {
    enabled: true,
    categoryId: "AAAAAAAAAAAAAAAA",
    supportRoleId: "BBBBBBBBBBBBBBBB",
    logsChannelId: "CCCCCCCCCCCCCCCC",
    maxTicketsPerUser: 3,        // Mais flexível para empresa
    autoCloseAfter: 72,          // Processo mais longo
    welcomeMessage: "Olá! Nossa equipe de suporte técnico irá atendê-lo em breve.",
    closeMessage: "Ticket encerrado. Agradecemos seu contato!"
  }
}
```

### **Tipos de Tickets Configurados:**
- 🔧 **Suporte Técnico** - Problemas com produtos
- 💳 **Faturamento** - Questões de pagamento
- 📱 **Aplicativo** - Problemas com app
- 🌐 **Website** - Problemas no site
- 📧 **Email** - Problemas de comunicação

---

## 🎓 Servidor Educacional (Universidade Online)

### **Configuração Específica:**
```bash
# 1. Configuração básica
/setup category #atendimento-acadêmico
/setup support @Secretaria-Acadêmica
/setup logs #logs-acadêmicos

# 2. Configurações específicas para educação
/setup max 2          # Até 2 tickets por aluno
/setup auto 168       # Auto-fechamento em 1 semana (processo acadêmico)

# 3. Ativar sistema
/setup enable
```

### **Resultado no Banco de Dados:**
```javascript
{
  guildId: "333333333333333333",
  name: "Universidade Online",
  ticketSettings: {
    enabled: true,
    categoryId: "DDDDDDDDDDDDDDDD",
    supportRoleId: "EEEEEEEEEEEEEEEE",
    logsChannelId: "FFFFFFFFFFFFFFFF",
    maxTicketsPerUser: 2,        // Equilibrado para estudantes
    autoCloseAfter: 168,         // 1 semana (processo acadêmico)
    welcomeMessage: "Bem-vindo ao atendimento acadêmico! Nossa equipe irá ajudá-lo.",
    closeMessage: "Atendimento encerrado. Boa sorte em seus estudos!"
  }
}
```

### **Tipos de Tickets Configurados:**
- 📚 **Matrícula** - Questões de matrícula
- 📝 **Notas** - Problemas com notas
- 🎓 **Diploma** - Solicitação de diploma
- 💰 **Mensalidade** - Questões financeiras
- 📖 **Biblioteca** - Acesso à biblioteca

---

## 🎨 Servidor de Comunidade (Artistas Unidos)

### **Configuração Específica:**
```bash
# 1. Configuração básica
/setup category #suporte-comunidade
/setup support @Moderadores
/setup logs #logs-moderacao

# 2. Configurações específicas para comunidade
/setup max 5          # Até 5 tickets por usuário (comunidade ativa)
/setup auto 48        # Auto-fechamento em 48 horas

# 3. Ativar sistema
/setup enable
```

### **Resultado no Banco de Dados:**
```javascript
{
  guildId: "444444444444444444",
  name: "Artistas Unidos",
  ticketSettings: {
    enabled: true,
    categoryId: "GGGGGGGGGGGGGGGG",
    supportRoleId: "HHHHHHHHHHHHHHHH",
    logsChannelId: "IIIIIIIIIIIIIIII",
    maxTicketsPerUser: 5,        // Muito flexível para comunidade
    autoCloseAfter: 48,          // 2 dias
    welcomeMessage: "Olá artista! Nossa equipe de moderação irá ajudá-lo.",
    closeMessage: "Ticket encerrado. Continue criando arte incrível!"
  }
}
```

### **Tipos de Tickets Configurados:**
- 🎨 **Exposição** - Solicitar exposição de arte
- 🚫 **Denúncia** - Denunciar comportamento inadequado
- 🤝 **Colaboração** - Propor colaborações
- 📢 **Evento** - Sugerir eventos
- 💡 **Sugestão** - Sugestões para a comunidade

---

## 🔧 Processo de Configuração Individual

### **Passo a Passo para Cada Servidor:**

#### **1. Primeira Configuração (Automática)**
```javascript
// Quando o bot é adicionado ao servidor
const defaultConfig = {
  guildId: interaction.guildId,
  name: interaction.guild.name,
  ticketSettings: {
    enabled: false,              // Sistema desabilitado por padrão
    categoryId: null,            // Ainda não configurado
    supportRoleId: null,         // Ainda não configurado
    logsChannelId: null,         // Ainda não configurado
    maxTicketsPerUser: 1,        // Valor padrão
    autoCloseAfter: 24,          // Valor padrão
    welcomeMessage: "Mensagem padrão...",
    closeMessage: "Mensagem padrão..."
  }
};
```

#### **2. Configuração Manual pelo Administrador**
```bash
# Exemplo: Servidor de Gaming
/setup category #tickets-gaming
/setup support @Suporte-Gaming
/setup logs #logs-gaming
/setup max 1
/setup auto 12
/setup enable

# Exemplo: Servidor Corporativo
/setup category #suporte-empresa
/setup support @Suporte-Empresa
/setup logs #logs-empresa
/setup max 3
/setup auto 72
/setup enable
```

#### **3. Validação Automática**
```javascript
// Para cada servidor individualmente
const validation = await TicketManager.validateGuildSetup(guild);

if (validation.valid) {
  console.log(`✅ Servidor ${guild.name} configurado corretamente`);
} else {
  console.log(`❌ Servidor ${guild.name} tem problemas: ${validation.errors.join(', ')}`);
}
```

---

## 📊 Comparação de Configurações

### **Tabela Comparativa:**

| Servidor | Max Tickets | Auto-Fechamento | Categoria | Cargo Suporte |
|----------|-------------|-----------------|-----------|---------------|
| **Gaming** | 1 | 12h | #🎫・tickets | @Suporte |
| **Corporativo** | 3 | 72h | #suporte-técnico | @Suporte-Técnico |
| **Educacional** | 2 | 168h | #atendimento-acadêmico | @Secretaria-Acadêmica |
| **Comunidade** | 5 | 48h | #suporte-comunidade | @Moderadores |

### **Análise das Diferenças:**

1. **Gaming**: Configuração restritiva (1 ticket, 12h) - foco em resposta rápida
2. **Corporativo**: Configuração equilibrada (3 tickets, 72h) - processo estruturado
3. **Educacional**: Configuração lenta (2 tickets, 168h) - processo acadêmico
4. **Comunidade**: Configuração flexível (5 tickets, 48h) - comunidade ativa

---

## 🔍 Monitoramento Individual

### **Logs Específicos por Servidor:**

```javascript
// Logs do servidor Gaming
console.log(`🔍 [Gaming] Buscando configuração para servidor: 123456789012345678`);
console.log(`✅ [Gaming] Configuração encontrada - Max: 1, Auto: 12h`);

// Logs do servidor Corporativo
console.log(`🔍 [Corporativo] Buscando configuração para servidor: 222222222222222222`);
console.log(`✅ [Corporativo] Configuração encontrada - Max: 3, Auto: 72h`);
```

### **Estatísticas por Servidor:**

```bash
# Ver configuração do servidor Gaming
/servers info 123456789012345678

# Ver configuração do servidor Corporativo
/servers info 222222222222222222

# Ver configuração do servidor Educacional
/servers info 333333333333333333
```

---

## 🎯 Vantagens da Configuração Individual

### **✅ Benefícios Demonstrados:**

1. **Flexibilidade Total**: Cada servidor adapta às suas necessidades
2. **Isolamento Completo**: Configurações não interferem entre servidores
3. **Escalabilidade**: Sistema suporta centenas de servidores diferentes
4. **Personalização**: Mensagens, cores e comportamentos específicos
5. **Monitoramento**: Logs e estatísticas individuais
6. **Manutenção**: Fácil gerenciamento por servidor

### **📈 Exemplo de Crescimento:**

```javascript
// Mês 1: 1 servidor
const servidor1 = { guildId: "111111111111111111", name: "Gaming" };

// Mês 6: 10 servidores
const servidores = [
  { guildId: "111111111111111111", name: "Gaming" },
  { guildId: "222222222222222222", name: "Corporativo" },
  { guildId: "333333333333333333", name: "Educacional" },
  // ... mais 7 servidores
];

// Mês 12: 50 servidores
// Cada um com configuração única e independente
```

---

## 🚀 Como Implementar

### **Para Administradores de Servidor:**

1. **Adicionar o bot ao servidor**
2. **Configurar permissões necessárias**
3. **Executar configuração inicial:**
   ```bash
   /setup category #sua-categoria
   /setup support @seu-cargo-suporte
   /setup logs #seu-canal-logs
   /setup max [1-5]
   /setup auto [0-168]
   /setup enable
   ```
4. **Verificar configuração:**
   ```bash
   /setup
   ```

### **Para Administradores Globais:**

1. **Monitorar todos os servidores:**
   ```bash
   /servers list
   /servers stats
   ```

2. **Verificar configurações específicas:**
   ```bash
   /servers info [guild-id]
   /servers search "nome-do-servidor"
   ```

3. **Manutenção automática:**
   ```bash
   /servers cleanup
   ```

---

**🎯 Cada servidor tem controle total sobre sua configuração, permitindo personalização completa e funcionamento independente!** 