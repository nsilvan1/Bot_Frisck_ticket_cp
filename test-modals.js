require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const TicketManager = require('./utils/ticketManager.js');
const database = require('./database/connection.js');

async function testModals() {
  console.log('🧪 Testando modais e botões...\n');

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

    // Testar busca de membros
    console.log('\n🔍 Testando busca de membros...');
    try {
      const members = await guild.members.search({
        query: 'test',
        limit: 5
      });
      
      console.log(`✅ Busca de membros funcionando: ${members.size} resultados`);
      members.forEach(member => {
        console.log(`  - ${member.user.username} (${member.user.tag})`);
      });
    } catch (error) {
      console.error('❌ Erro na busca de membros:', error);
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
testModals(); 