const mongoose = require('mongoose');
const Guild = require('../models/Guild.js');
const TicketManager = require('../utils/ticketManager.js');

// Configuração do MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ticketbot';

async function addDefaultCategories() {
  try {
    console.log('🔌 Conectando ao MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado ao MongoDB');

    // Buscar todos os servidores
    const guilds = await Guild.find({});
    console.log(`📊 Encontrados ${guilds.length} servidores`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const guild of guilds) {
      try {
        // Verificar se o servidor já tem categorias configuradas
        const hasCategories = guild.ticketPanels && 
          guild.ticketPanels.length > 0 && 
          guild.ticketPanels[0].categories && 
          Object.keys(guild.ticketPanels[0].categories).length > 0;

        if (hasCategories) {
          console.log(`⏭️ Servidor ${guild.name} (${guild.guildId}) já tem categorias configuradas`);
          skippedCount++;
          continue;
        }

        // Obter categorias padrão
        const ticketManager = new TicketManager();
        const defaultCategories = ticketManager.getDefaultCategories();

        // Criar ou atualizar painel1
        if (!guild.ticketPanels) {
          guild.ticketPanels = [];
        }

        let painel1 = guild.ticketPanels.find(p => p.panelId === 'painel1');
        if (!painel1) {
          painel1 = {
            panelId: 'painel1',
            name: 'Painel 1',
            categories: defaultCategories,
            branding: { ...guild.branding }
          };
          guild.ticketPanels.push(painel1);
        } else {
          painel1.categories = defaultCategories;
        }

        // Salvar alterações
        guild.markModified('ticketPanels');
        await guild.save();

        console.log(`✅ Categorias padrão adicionadas ao servidor ${guild.name} (${guild.guildId})`);
        updatedCount++;

      } catch (error) {
        console.error(`❌ Erro ao processar servidor ${guild.name} (${guild.guildId}):`, error.message);
      }
    }

    console.log('\n📈 Resumo:');
    console.log(`✅ Servidores atualizados: ${updatedCount}`);
    console.log(`⏭️ Servidores ignorados: ${skippedCount}`);
    console.log(`📊 Total processado: ${guilds.length}`);

  } catch (error) {
    console.error('❌ Erro geral:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado do MongoDB');
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  addDefaultCategories();
}

module.exports = { addDefaultCategories }; 