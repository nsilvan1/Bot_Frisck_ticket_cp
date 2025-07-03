require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const TicketManager = require('./utils/ticketManager.js');
const database = require('./database/connection.js');

async function testLogs() {
  console.log('🧪 Testando sistema de logs...\n');

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

    // Testar com o servidor TESTES
    const guildId = '842060941511229482';
    const guild = client.guilds.cache.get(guildId);
    
    if (!guild) {
      console.log('❌ Servidor TESTES não encontrado');
      return;
    }

    console.log(`🔍 Testando com servidor: ${guild.name} (${guildId})`);

    // Obter configuração
    const guildConfig = await TicketManager.getGuildConfig(guildId);
    console.log(`📊 Configuração encontrada: ${guildConfig ? 'Sim' : 'Não'}`);
    
    if (guildConfig) {
      console.log(`📝 Canal de logs: ${guildConfig.ticketSettings.logsChannelId}`);
      
      const logsChannel = guild.channels.cache.get(guildConfig.ticketSettings.logsChannelId);
      console.log(`📝 Canal encontrado: ${logsChannel ? logsChannel.name : 'Não'}`);
      
      if (logsChannel) {
        // Testar envio de log
        console.log('\n📤 Testando envio de log...');
        
        const testTicket = {
          ticketId: 'TEST-0001',
          userId: client.user.id,
          channelId: logsChannel.id,
          type: 'denuncia',
          status: 'test',
          updatedAt: new Date()
        };

        try {
          await TicketManager.sendTicketLog(guild, testTicket, 'created', guildConfig);
          console.log('✅ Log de teste enviado com sucesso!');
        } catch (error) {
          console.error('❌ Erro ao enviar log de teste:', error);
        }
      }
    }

    // Testar função getGuild
    console.log('\n🧪 Testando getGuild...');
    const testGuild = await TicketManager.getGuild(guildId, client);
    console.log(`✅ getGuild resultado: ${testGuild ? testGuild.name : 'null'}`);

    // Desconectar
    await client.destroy();
    await database.disconnect();
    console.log('\n✅ Teste concluído!');

  } catch (error) {
    console.error('❌ Erro durante teste:', error);
  }
}

// Executar teste
testLogs(); 