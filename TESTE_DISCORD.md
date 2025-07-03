# 🧪 Guia de Testes no Discord - Produção

## 🎯 Objetivo
Testar todas as funcionalidades do sistema de tickets diretamente no Discord, identificando problemas e melhorias necessárias.

---

## 📋 Checklist de Testes

### 1. **Testes de Configuração Inicial**

#### ✅ Pré-requisitos
- [ ] Bot está online no servidor
- [ ] Bot tem permissões de administrador
- [ ] Arquivo `.env` configurado corretamente
- [ ] MongoDB conectado

#### 🔧 Comandos de Setup
```bash
# 1. Testar se o bot responde
/setup

# 2. Verificar status atual
/setup status

# 3. Configurar categoria de tickets
/setup category #categoria-tickets

# 4. Configurar cargo de suporte
/setup support @Suporte

# 5. Configurar canal de logs
/setup logs #logs-tickets

# 6. Ativar sistema
/setup enable
```

---

### 2. **Testes de Criação de Tickets**

#### 🎫 Teste do Painel
```bash
# 1. Criar painel de tickets
/ticket panel #canal-tickets

# 2. Verificar se o painel foi criado
# - Deve aparecer embed com descrição
# - Deve ter menu dropdown com tipos
# - Deve ter botões funcionais
```

#### 📝 Teste de Abertura de Tickets
```bash
# 1. Testar cada tipo de ticket:
# - 📛 Denúncia
# - ⚠️ Denúncia Staff  
# - 💀 Facções
# - 🐌 Bugs
# - 🕵️ Corregedoria
# - 💰 Vips
# - 🏘️ Imobiliária

# 2. Verificar se canal é criado
# 3. Verificar permissões do canal
# 4. Verificar mensagem de boas-vindas
```

#### ⚠️ Testes de Limites
```bash
# 1. Abrir máximo de tickets permitidos
# 2. Tentar abrir ticket extra (deve ser bloqueado)
# 3. Fechar um ticket e tentar abrir novo
```

---

### 3. **Testes de Gerenciamento de Tickets**

#### 🔧 Ações de Staff
```bash
# 1. Testar botão "Assumir Ticket"
# 2. Testar botão "Fechar Ticket"
# 3. Testar botão "Resolver Ticket"
# 4. Testar botão "Deletar Ticket"
# 5. Testar botão "Transferir Ticket"
```

#### 📊 Verificações
- [ ] Status do ticket muda corretamente
- [ ] Logs são enviados no canal de logs
- [ ] Permissões são atualizadas
- [ ] Mensagens de confirmação aparecem

---

### 4. **Testes de Comandos Administrativos**

#### 📈 Estatísticas
```bash
# 1. Ver estatísticas gerais
/stats

# 2. Ver estatísticas por período
/stats today
/stats week
/stats month

# 3. Verificar se números estão corretos
```

#### 🗄️ Banco de Dados
```bash
# 1. Verificar status do banco
/database status

# 2. Ver informações do banco
/database info

# 3. Testar backup (se disponível)
/database backup
```

#### 🔄 Reload e Limpeza
```bash
# 1. Recarregar comandos
/reload

# 2. Limpar canais antigos
/clear old-tickets

# 3. Verificar se limpeza funcionou
```

---

### 5. **Testes de Interface e UX**

#### 🎨 Embeds e Mensagens
- [ ] Verificar se embeds estão formatados corretamente
- [ ] Testar caracteres especiais (ç, ã, é, etc.)
- [ ] Verificar se URLs e imagens carregam
- [ ] Testar limites de caracteres

#### 🔘 Botões e Menus
- [ ] Testar todos os botões em diferentes dispositivos
- [ ] Verificar se menus dropdown funcionam
- [ ] Testar timeouts de interação
- [ ] Verificar respostas ephemeral

#### 📱 Responsividade
- [ ] Testar no Discord Desktop
- [ ] Testar no Discord Mobile
- [ ] Testar no Discord Web
- [ ] Verificar se elementos se adaptam

---

### 6. **Testes de Performance**

#### ⚡ Velocidade de Resposta
```bash
# Medir tempo de resposta dos comandos:
# - /setup (deve ser < 2s)
# - /ticket create (deve ser < 3s)
# - /stats (deve ser < 1s)
# - Botões (deve ser < 1s)
```

#### 🔄 Carga
- [ ] Abrir 10+ tickets simultaneamente
- [ ] Usar múltiplos comandos rapidamente
- [ ] Verificar se sistema não trava
- [ ] Monitorar uso de memória

---

### 7. **Testes de Segurança**

#### 🔐 Permissões
```bash
# 1. Testar sem permissões de administrador
# 2. Testar com cargo de suporte
# 3. Testar com usuário normal
# 4. Verificar se restrições funcionam
```

#### 🛡️ Validações
- [ ] Tentar usar comandos com dados inválidos
- [ ] Testar IDs de canais inexistentes
- [ ] Verificar se erros são tratados graciosamente
- [ ] Testar rate limiting (se implementado)

---

### 8. **Testes de Cenários Reais**

#### 👥 Simulação de Atendimento
```bash
# 1. Usuário abre ticket de denúncia
# 2. Staff assume o ticket
# 3. Troca mensagens
# 4. Staff resolve o ticket
# 5. Usuário avalia o atendimento
```

#### 🔄 Fluxo Completo
```bash
# 1. Configurar sistema do zero
# 2. Criar painel de tickets
# 3. Abrir diferentes tipos de tickets
# 4. Gerenciar tickets como staff
# 5. Verificar logs e estatísticas
# 6. Fechar e limpar dados de teste
```

---

## 🚨 Problemas a Identificar

### ❌ Problemas Críticos
- [ ] Bot não responde a comandos
- [ ] Canais não são criados
- [ ] Permissões não funcionam
- [ ] Banco de dados não conecta
- [ ] Sistema trava ou trava

### ⚠️ Problemas de UX
- [ ] Mensagens confusas
- [ ] Botões não funcionam
- [ ] Embeds mal formatados
- [ ] Tempo de resposta lento
- [ ] Falta de feedback

### 🔧 Problemas Técnicos
- [ ] Erros no console
- [ ] Logs não são enviados
- [ ] Estatísticas incorretas
- [ ] Dados não são salvos
- [ ] Memory leaks

---

## 📝 Como Reportar Problemas

### Para cada problema encontrado, documentar:

1. **Descrição**: O que aconteceu?
2. **Passos**: Como reproduzir?
3. **Esperado**: O que deveria acontecer?
4. **Real**: O que realmente aconteceu?
5. **Severidade**: Crítico/Importante/Baixo
6. **Screenshots**: Se aplicável

### Exemplo:
```
PROBLEMA: Bot não cria canal de ticket

DESCRIÇÃO: Ao clicar no menu de tipo de ticket, nada acontece

PASSOS:
1. Ir para canal de tickets
2. Clicar no menu dropdown
3. Selecionar "Denúncia"

ESPERADO: Canal deveria ser criado

REAL: Nada acontece, sem erro visível

SEVERIDADE: Crítico

SCREENSHOT: [anexar]
```

---

## 🎯 Próximos Passos

### Fase 1: Testes Básicos (30 min)
- [ ] Verificar se bot está online
- [ ] Testar comando /setup
- [ ] Configurar sistema básico
- [ ] Criar painel de tickets

### Fase 2: Testes de Funcionalidade (45 min)
- [ ] Abrir tickets de cada tipo
- [ ] Testar ações de staff
- [ ] Verificar logs e estatísticas
- [ ] Testar comandos administrativos

### Fase 3: Testes de Carga (15 min)
- [ ] Abrir múltiplos tickets
- [ ] Usar comandos rapidamente
- [ ] Verificar performance
- [ ] Monitorar erros

### Fase 4: Documentação (15 min)
- [ ] Listar problemas encontrados
- [ ] Priorizar correções
- [ ] Criar plano de melhorias
- [ ] Documentar soluções

---

## 🚀 Começar Agora!

1. **Verifique se o bot está online**
2. **Execute `/setup` para configurar**
3. **Crie um painel de tickets**
4. **Comece a testar cada funcionalidade**
5. **Documente qualquer problema encontrado**

**Tempo estimado total: 1h 45min**

---

## 📞 Suporte

Se encontrar problemas críticos:
1. Verificar logs do console
2. Verificar status do MongoDB
3. Verificar permissões do bot
4. Reiniciar o bot se necessário
5. Documentar para correção posterior 