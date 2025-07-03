const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const database = require('../../../database/connection.js');
const Ticket = require('../../../models/Ticket.js');
const Guild = require('../../../models/Guild.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('database')
    .setDescription('Gerencia o banco de dados')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
      subcommand
        .setName('status')
        .setDescription('Mostra o status do banco de dados')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('info')
        .setDescription('Mostra informações detalhadas do banco')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('stats')
        .setDescription('Mostra estatísticas dos dados armazenados')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('backup')
        .setDescription('Cria backup do banco de dados')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('cleanup')
        .setDescription('Limpa dados antigos')
    ),

  async execute(interaction) {
    try {
      // Verificar permissões
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        const embed = new EmbedBuilder()
          .setColor('Red')
          .setTitle('❌ | Permissão Negada')
          .setDescription('Você precisa ser administrador para usar este comando.');

        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      const subcommand = interaction.options.getSubcommand();

      switch (subcommand) {
        case 'status':
          await showDatabaseStatus(interaction);
          break;
        case 'info':
          await showDatabaseInfo(interaction);
          break;
        case 'stats':
          await showDatabaseStats(interaction);
          break;
        case 'backup':
          await createBackup(interaction);
          break;
        case 'cleanup':
          await cleanupDatabase(interaction);
          break;
        default:
          await showHelp(interaction);
      }

    } catch (error) {
      console.error('Erro no comando database:', error);
      
      const errorEmbed = new EmbedBuilder()
        .setColor('Red')
        .setDescription('❌ Ocorreu um erro ao executar o comando.');

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
      } else {
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
    }
  }
};

async function showDatabaseStatus(interaction) {
  const isConnected = database.isConnected();
  
  const embed = new EmbedBuilder()
    .setColor(isConnected ? 'Green' : 'Red')
    .setTitle('🗄️ | Status do Banco de Dados')
    .addFields(
      { 
        name: '🔗 Conexão', 
        value: isConnected ? '✅ Conectado' : '❌ Desconectado', 
        inline: true 
      },
      { 
        name: '📊 Banco', 
        value: database.getDatabaseName(), 
        inline: true 
      },
      { 
        name: '🕒 Última Verificação', 
        value: new Date().toLocaleString('pt-BR'), 
        inline: true 
      }
    );

  if (isConnected) {
    try {
      const dbInfo = await database.getDatabaseInfo();
      if (dbInfo) {
        embed.addFields(
          { 
            name: '📋 Coleções', 
            value: dbInfo.collections.toString(), 
            inline: true 
          },
          { 
            name: '💾 Tamanho', 
            value: formatBytes(dbInfo.dataSize), 
            inline: true 
          },
          { 
            name: '🗂️ Índices', 
            value: dbInfo.indexes.toString(), 
            inline: true 
          }
        );
      }
    } catch (error) {
      embed.addFields({
        name: '⚠️ Aviso',
        value: 'Não foi possível obter informações detalhadas',
        inline: false
      });
    }
  }

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function showDatabaseInfo(interaction) {
  if (!database.isConnected()) {
    const embed = new EmbedBuilder()
      .setColor('Red')
      .setDescription('❌ Banco de dados não está conectado.');
    
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }

  try {
    const dbInfo = await database.getDatabaseInfo();
    
    if (!dbInfo) {
      const embed = new EmbedBuilder()
        .setColor('Red')
        .setDescription('❌ Não foi possível obter informações do banco.');
      
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setColor('Blue')
      .setTitle('📊 | Informações do Banco de Dados')
      .addFields(
        { name: '🏷️ Nome', value: dbInfo.name, inline: true },
        { name: '📋 Coleções', value: dbInfo.collections.toString(), inline: true },
        { name: '🗂️ Índices', value: dbInfo.indexes.toString(), inline: true },
        { name: '💾 Tamanho dos Dados', value: formatBytes(dbInfo.dataSize), inline: true },
        { name: '💿 Espaço em Disco', value: formatBytes(dbInfo.storageSize), inline: true },
        { name: '📈 Eficiência', value: `${((dbInfo.dataSize / dbInfo.storageSize) * 100).toFixed(1)}%`, inline: true }
      )
      .setFooter({ text: 'Última atualização: ' + new Date().toLocaleString('pt-BR') });

    await interaction.reply({ embeds: [embed], ephemeral: true });

  } catch (error) {
    console.error('Erro ao obter informações do banco:', error);
    const embed = new EmbedBuilder()
      .setColor('Red')
      .setDescription('❌ Erro ao obter informações do banco de dados.');
    
    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
}

async function showDatabaseStats(interaction) {
  if (!database.isConnected()) {
    const embed = new EmbedBuilder()
      .setColor('Red')
      .setDescription('❌ Banco de dados não está conectado.');
    
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }

  try {
    // Contar documentos em cada coleção
    const ticketCount = await Ticket.countDocuments();
    const guildCount = await Guild.countDocuments();
    
    // Estatísticas de tickets
    const openTickets = await Ticket.countDocuments({ status: 'open' });
    const closedTickets = await Ticket.countDocuments({ status: 'closed' });
    const resolvedTickets = await Ticket.countDocuments({ status: 'resolved' });
    
    // Ticket mais antigo e mais recente
    const oldestTicket = await Ticket.findOne().sort({ createdAt: 1 });
    const newestTicket = await Ticket.findOne().sort({ createdAt: -1 });

    const embed = new EmbedBuilder()
      .setColor('Blue')
      .setTitle('📈 | Estatísticas do Banco de Dados')
      .addFields(
        { name: '🎫 Total de Tickets', value: ticketCount.toString(), inline: true },
        { name: '🏠 Total de Servidores', value: guildCount.toString(), inline: true },
        { name: '⏳ Tickets Abertos', value: openTickets.toString(), inline: true },
        { name: '❌ Tickets Fechados', value: closedTickets.toString(), inline: true },
        { name: '✅ Tickets Resolvidos', value: resolvedTickets.toString(), inline: true },
        { name: '📊 Taxa de Resolução', value: `${((resolvedTickets / ticketCount) * 100).toFixed(1)}%`, inline: true }
      );

    if (oldestTicket && newestTicket) {
      embed.addFields(
        { 
          name: '📅 Ticket Mais Antigo', 
          value: oldestTicket.createdAt.toLocaleDateString('pt-BR'), 
          inline: true 
        },
        { 
          name: '📅 Ticket Mais Recente', 
          value: newestTicket.createdAt.toLocaleDateString('pt-BR'), 
          inline: true 
        }
      );
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });

  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    const embed = new EmbedBuilder()
      .setColor('Red')
      .setDescription('❌ Erro ao obter estatísticas do banco de dados.');
    
    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
}

async function createBackup(interaction) {
  const embed = new EmbedBuilder()
    .setColor('Yellow')
    .setDescription('🔄 Funcionalidade de backup será implementada em breve.');
  
  await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function cleanupDatabase(interaction) {
  const embed = new EmbedBuilder()
    .setColor('Yellow')
    .setDescription('🔄 Funcionalidade de limpeza será implementada em breve.');
  
  await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function showHelp(interaction) {
  const embed = new EmbedBuilder()
    .setColor('Blue')
    .setTitle('📖 | Ajuda - Comandos de Banco de Dados')
    .setDescription('Comandos disponíveis para gerenciar o banco de dados:')
    .addFields(
      { name: '`/database status`', value: 'Mostra o status atual do banco', inline: false },
      { name: '`/database info`', value: 'Informações detalhadas do banco', inline: false },
      { name: '`/database stats`', value: 'Estatísticas dos dados armazenados', inline: false },
      { name: '`/database backup`', value: 'Criar backup do banco (em breve)', inline: false },
      { name: '`/database cleanup`', value: 'Limpar dados antigos (em breve)', inline: false }
    )
    .setFooter({ text: 'Apenas administradores podem usar estes comandos' });

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
} 