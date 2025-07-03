# �� Sistema de Tickets para Discord

Um sistema completo de tickets para Discord com MongoDB, desenvolvido para servidores de FiveM e outros tipos de comunidades.

## ✨ Características

- **🎨 Branding Personalizável**: Configure cores, logos, banners e textos do seu servidor
- **📋 Categorias de Tickets**: Múltiplos tipos de tickets (denúncias, suporte, bugs, etc.)
- **👥 Sistema de Staff**: Controle de permissões e cargos de suporte
- **📊 Estatísticas**: Acompanhe métricas de tickets e performance
- **🔧 Configuração Flexível**: Todas as configurações salvas no banco de dados
- **📝 Logs Detalhados**: Registro completo de todas as ações
- **⚡ Performance**: Otimizado para servidores grandes

## 🚀 Instalação

### Pré-requisitos

- Node.js 16.9.0 ou superior
- MongoDB (local ou Atlas)
- Bot do Discord configurado

### 1. Clone o repositório

```bash
git clone <url-do-repositorio>
cd Bot_Frisck-Ticket
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

Copie o arquivo `.env.example` para `.env` e configure:

```env
# Token do bot (obrigatório)
BOT_TOKEN=seu_token_aqui

# String de conexão MongoDB (obrigatório)
MONGODB_URI=mongodb+srv://usuario:senha@cluster.mongodb.net/ticket-bot

# Configurações opcionais
READY_MESSAGE=Sistema de ticket ativo!
LOGS_CHANNEL_ID=123456789
CATEGORIA_ID=123456789
SUPORTE_ROLE_ID=123456789
BOT_OWNER_ID=123456789
```

### 4. Inicialize o banco de dados

```bash
npm run init-db
```

### 5. Execute a migração (se necessário)

```bash
npm run migrate
```

### 6. Inicie o bot

```bash
npm start
```

## ⚙️ Configuração

### Comandos de Configuração

Todos os comandos de configuração são feitos através do comando `/setup`:

#### Configurações Básicas
- `/setup category #categoria` - Define categoria para tickets
- `/setup support @cargo` - Define cargo de suporte
- `/setup logs #canal` - Define canal de logs
- `/setup max 3` - Define máximo de tickets por usuário
- `/setup auto 24` - Define auto-fechamento (horas)

#### Branding e Personalização
- `/setup branding nome:"Meu Servidor" cor:#ff0000` - Configura branding
- `/setup branding thumbnail:https://exemplo.com/logo.gif` - Define logo
- `/setup branding banner:https://exemplo.com/banner.jpg` - Define banner
- `/setup branding footer:"© 2024 Meu Servidor"` - Define footer

#### Mensagens Personalizadas
- `/setup mensagem tipo:welcome texto:"Olá {user}, bem-vindo ao seu ticket!"`
- `/setup mensagem tipo:ticketCreated texto:"Seu ticket foi criado em {channel}!"`

#### Controle do Sistema
- `/setup enable` - Ativa o sistema
- `/setup disable` - Desativa o sistema
- `/setup reset` - Reseta todas as configurações

### Categorias de Tickets Padrão

O sistema vem com 4 categorias pré-definidas que são criadas automaticamente:

- **📛 Denúncia** - Denunciar um jogador por quebra de regras
- **🎫 Suporte** - Dúvidas gerais e suporte técnico
- **🐛 Relatar Bugs** - Reportar problemas e bugs encontrados
- **⚖️ Recorrer Banimento** - Solicitar revisão de banimento

#### Categorias Personalizadas

Você pode adicionar, editar ou remover categorias através do painel de configuração:

1. Use `/setup` para abrir o painel de configuração
2. Clique em "⚙️ Config Categorias"
3. Use "📋 Criar Categorias Padrão" para adicionar as categorias padrão
4. Use "➕ Adicionar Categoria" para criar categorias personalizadas

## 📊 Comandos Disponíveis

### Para Administradores
- `/setup` - Configurar sistema
- `/ticket` - Criar painel de tickets
- `/stats` - Ver estatísticas
- `/database` - Gerenciar banco de dados

### Para Staff
- `/tickets` - Listar tickets abertos
- `/assign` - Assumir ticket
- `/close` - Fechar ticket
- `/resolve` - Resolver ticket

### Para Usuários
- Clicar no botão "Abrir Ticket" no painel
- Selecionar tipo de ticket
- Aguardar atendimento da staff

## 🗄️ Estrutura do Banco de Dados

### Coleção: Guilds
Armazena configurações de cada servidor:
- Configurações de tickets
- Branding e personalização
- Mensagens customizadas
- Categorias de tickets
- Cargos de staff

### Coleção: Tickets
Armazena todos os tickets:
- Informações do usuário
- Tipo e categoria
- Status e histórico
- Mensagens e logs
- Avaliações

## 🔧 Desenvolvimento

### Scripts Disponíveis

```bash
npm start                    # Inicia o bot
npm run dev                  # Modo desenvolvimento com nodemon
npm run init-db              # Inicializa banco de dados
npm run migrate              # Executa migrações
npm run setup                # Setup completo
npm run add-default-categories # Adiciona categorias padrão a servidores existentes
```

### Estrutura do Projeto

```
├── commands/          # Comandos slash
│   ├── admin/        # Comandos administrativos
│   ├── tickets/      # Comandos de tickets
│   └── utils/        # Utilitários
├── events/           # Eventos do Discord
├── models/           # Modelos do MongoDB
├── utils/            # Utilitários e gerenciadores
├── database/         # Configuração do banco
├── scripts/          # Scripts de migração
└── config.json       # Configurações antigas (deprecated)
```

## 🚨 Migração do config.json

Se você estava usando o arquivo `config.json`, execute a migração:

```bash
npm run migrate
```

Isso moverá todas as configurações para o banco de dados, permitindo configurações por servidor.

## 📝 Logs e Monitoramento

O sistema registra automaticamente:
- Criação de tickets
- Fechamento de tickets
- Atribuição de staff
- Ações administrativas
- Erros e problemas

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença ISC.

## 🆘 Suporte

Para suporte, abra uma issue no GitHub ou entre em contato através do Discord.

---

**Desenvolvido com ❤️ para a comunidade FiveM**

# Bot de Tickets Dinâmico

Agora os tipos de ticket são **totalmente personalizáveis** por servidor, diretamente pelo painel de configuração do bot (botão "Config Categorias" no /setup). Não há mais tipos fixos ou comandos extras para adicionar/remover tipos de ticket.

- Adicione, edite ou remova categorias de ticket pelo painel interativo.
- O painel de abertura de ticket e o comando /help refletem as categorias dinâmicas.
- Persistência garantida no banco de dados.

Consulte o painel `/setup` para gerenciar as categorias do seu servidor! 