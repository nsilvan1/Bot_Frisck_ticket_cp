require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const database = require('./database/connection.js');

// Criar cliente com intents necessários
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.DirectMessages
  ]
});

// Tornar o client disponível globalmente
global.client = client;

// Coleção para comandos slash
client.commands = new Collection();

// Carregar comandos slash
const commandsPath = path.join(__dirname, 'commands', 'slash');
const commandFolders = fs.readdirSync(commandsPath);

for (const folder of commandFolders) {
  const folderPath = path.join(commandsPath, folder);
  const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
  
  for (const file of commandFiles) {
    const filePath = path.join(folderPath, file);
    const command = require(filePath);
    
    if ('data' in command && 'execute' in command) {
      client.commands.set(command.data.name, command);
      console.log(`✅ Comando slash carregado: ${command.data.name}`);
    } else {
      console.log(`⚠️ Comando em ${filePath} está faltando propriedades obrigatórias "data" ou "execute"`);
    }
  }
}

// Carregar eventos
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);
  
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
  
  console.log(`✅ Evento carregado: ${event.name}`);
}

// Evento para comandos slash
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`❌ Comando ${interaction.commandName} não encontrado.`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`❌ Erro ao executar comando ${interaction.commandName}:`, error);
    
    const errorMessage = {
      content: '❌ Houve um erro ao executar este comando!',
      ephemeral: true
    };

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(errorMessage);
    } else {
      await interaction.reply(errorMessage);
    }
  }
});

// Função para registrar comandos slash
async function registerCommands() {
  try {
    console.log('🔄 Registrando comandos slash...');
    
    const commands = [];
    const commandsPath = path.join(__dirname, 'commands', 'slash');
    const commandFolders = fs.readdirSync(commandsPath);

    for (const folder of commandFolders) {
      const folderPath = path.join(commandsPath, folder);
      const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
      
      for (const file of commandFiles) {
        const filePath = path.join(folderPath, file);
        const command = require(filePath);
        
        if ('data' in command) {
          commands.push(command.data.toJSON());
        }
      }
    }

    // Registrar comandos globalmente
    await client.application.commands.set(commands);
    console.log(`✅ ${commands.length} comandos slash registrados globalmente`);
    
  } catch (error) {
    console.error('❌ Erro ao registrar comandos slash:', error);
  }
}

// Conectar ao banco de dados
async function connectDatabase() {
  try {
    await database.connect();
    console.log('✅ Banco de dados conectado com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao conectar ao banco de dados:', error);
    process.exit(1);
  }
}

// Inicializar bot
async function initializeBot() {
  try {
    console.log('🚀 Iniciando bot...');
    
    // Conectar ao Discord
    await client.login(process.env.BOT_TOKEN);
    
    // Aguardar bot estar pronto
    await new Promise(resolve => {
      client.once('ready', resolve);
    });
    
    // Conectar ao banco de dados
    await connectDatabase();
    
    // Registrar comandos slash
    await registerCommands();
    
    console.log('🎉 Bot inicializado com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao inicializar bot:', error);
    process.exit(1);
  }
}

// Tratamento de erros não capturados
process.on('unhandledRejection', error => {
  console.error('❌ Erro não tratado:', error);
});

process.on('uncaughtException', error => {
  console.error('❌ Exceção não capturada:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🔄 Desligando bot...');
  
  try {
    await database.disconnect();
    client.destroy();
    console.log('✅ Bot desligado com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao desligar bot:', error);
    process.exit(1);
  }
});

// Inicializar bot
initializeBot();

// Exportar o client
module.exports = { client };
