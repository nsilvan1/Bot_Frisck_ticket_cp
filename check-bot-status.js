require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const TicketManager = require('./utils/ticketManager.js');
const database = require('./database/connection.js');

async function checkBotStatus() {
  console.log('🔍 Verificando status do bot...\n');

  try {
    // Conectar ao banco de dados
    await database.connect();
    console.log('✅ Banco de dados conectado');

    // Criar client temporário para verificar
    const client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.DirectMessages
      ]
    });

    // Conectar ao Discord
    await client.login(process.env.BOT_TOKEN);
    console.log('✅ Bot conectado ao Discord');

    // Aguardar bot estar pronto
    await new Promise(resolve => {
      client.once('ready', resolve);
    });

    console.log(`✅ Bot está pronto! Logado como: ${client.user.tag}`);
    console.log(`📊 Servidores conectados: ${client.guilds.cache.size}`);

    // Verificar configurações dos servidores
    for (const [guildId, guild] of client.guilds.cache) {
      console.log(`\n🔍 Verificando servidor: ${guild.name} (${guildId})`);
      
      const config = await TicketManager.getGuildConfig(guildId);
      if (config) {
        console.log(`  ✅ Configuração encontrada`);
        console.log(`  📊 Sistema ativo: ${config.ticketSettings.enabled ? 'Sim' : 'Não'}`);
        console.log(`  📁 Categoria: ${config.ticketSettings.categoryId ? 'Configurada' : 'Não configurada'}`);
        console.log(`  👥 Cargos suporte: ${config.ticketSettings.supportRoleIds?.length || 0}`);
        console.log(`  📝 Canal logs: ${config.ticketSettings.logsChannelId ? 'Configurado' : 'Não configurado'}`);
        
        if (config.ticketSettings.logsChannelId) {
          const logsChannel = guild.channels.cache.get(config.ticketSettings.logsChannelId);
          console.log(`  📝 Canal logs encontrado: ${logsChannel ? logsChannel.name : 'Não encontrado'}`);
        }
      } else {
        console.log(`  ❌ Configuração não encontrada`);
      }
    }

    // Testar função getGuild
    console.log('\n🧪 Testando função getGuild...');
    for (const [guildId, guild] of client.guilds.cache) {
      const testGuild = await TicketManager.getGuild(guildId, client);
      if (testGuild) {
        console.log(`  ✅ getGuild funcionando para: ${testGuild.name}`);
      } else {
        console.log(`  ❌ getGuild falhou para: ${guildId}`);
      }
    }

    // Desconectar
    await client.destroy();
    await database.disconnect();
    console.log('\n✅ Verificação concluída!');

  } catch (error) {
    console.error('❌ Erro durante verificação:', error);
  }
}

// Executar verificação
checkBotStatus(); 