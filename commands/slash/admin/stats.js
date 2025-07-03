const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const TicketManager = require('../../../utils/ticketManager.js');
const moment = require('moment');
require('moment/locale/pt-br');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Mostra estatísticas dos tickets')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option =>
      option
        .setName('periodo')
        .setDescription('Período das estatísticas')
        .setRequired(false)
        .addChoices(
          { name: 'Hoje', value: 'today' },
          { name: 'Esta Semana', value: 'week' },
          { name: 'Este Mês', value: 'month' },
          { name: 'Todos', value: 'all' }
        )
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

      const period = interaction.options.getString('periodo') || 'all';
      const guildId = interaction.guildId;

      // Obter estatísticas
      const stats = await TicketManager.getTicketStats(guildId, period);

      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('📊 | Estatísticas de Tickets')
        .setFooter({ text: `Período: ${getPeriodText(period)}` })
        .setTimestamp();

      // Adicionar campos baseados no período
      if (period === 'all') {
        embed.addFields(
          { name: '🎫 Total de Tickets', value: stats.total.toString(), inline: true },
          { name: '⏳ Abertos', value: stats.open.toString(), inline: true },
          { name: '❌ Fechados', value: stats.closed.toString(), inline: true },
          { name: '✅ Resolvidos', value: stats.resolved.toString(), inline: true },
          { name: '📈 Taxa de Resolução', value: `${stats.resolutionRate}%`, inline: true },
          { name: '⏱️ Tempo Médio', value: stats.avgTime || 'N/A', inline: true }
        );

        // Adicionar distribuição por tipo se houver dados
        if (stats.typeDistribution && Object.keys(stats.typeDistribution).length > 0) {
          let typeText = '';
          for (const [type, count] of Object.entries(stats.typeDistribution)) {
            typeText += `• ${getTypeEmoji(type)} ${type}: ${count}\n`;
          }
          embed.addFields({ name: '📋 Distribuição por Tipo', value: typeText, inline: false });
        }

        // Adicionar top staff se houver dados
        if (stats.topStaff && stats.topStaff.length > 0) {
          let staffText = '';
          stats.topStaff.slice(0, 5).forEach((staff, index) => {
            staffText += `${index + 1}. <@${staff.staffId}> - ${staff.tickets} tickets\n`;
          });
          embed.addFields({ name: '👥 Top Staff', value: staffText, inline: false });
        }

      } else {
        // Estatísticas por período
        embed.addFields(
          { name: '🎫 Tickets Criados', value: stats.created.toString(), inline: true },
          { name: '✅ Resolvidos', value: stats.resolved.toString(), inline: true },
          { name: '❌ Fechados', value: stats.closed.toString(), inline: true },
          { name: '📈 Taxa de Resolução', value: `${stats.resolutionRate}%`, inline: true },
          { name: '⏱️ Tempo Médio', value: stats.avgTime || 'N/A', inline: true },
          { name: '📊 Atividade', value: getActivityLevel(stats.created), inline: true }
        );

        // Adicionar comparação com período anterior se disponível
        if (stats.previousPeriod) {
          const change = stats.created - stats.previousPeriod.created;
          const changeText = change > 0 ? `+${change}` : change.toString();
          const changeEmoji = change > 0 ? '📈' : change < 0 ? '📉' : '➡️';
          
          embed.addFields({
            name: '🔄 Comparação',
            value: `${changeEmoji} ${changeText} tickets vs período anterior`,
            inline: false
          });
        }
      }

      // Adicionar informações gerais
      if (stats.oldestTicket || stats.newestTicket) {
        embed.addFields({
          name: '📅 Período de Atividade',
          value: `${stats.oldestTicket ? moment(stats.oldestTicket).format('DD/MM/YYYY') : 'N/A'} - ${stats.newestTicket ? moment(stats.newestTicket).format('DD/MM/YYYY') : 'N/A'}`,
          inline: false
        });
      }

      await interaction.reply({ embeds: [embed], ephemeral: true });

    } catch (error) {
      console.error('Erro no comando stats:', error);
      
      const errorEmbed = new EmbedBuilder()
        .setColor('Red')
        .setDescription('❌ Ocorreu um erro ao obter as estatísticas.');

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
      } else {
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
    }
  }
};

function getPeriodText(period) {
  switch (period) {
    case 'today': return 'Hoje';
    case 'week': return 'Esta Semana';
    case 'month': return 'Este Mês';
    case 'all': return 'Todos os Tempos';
    default: return 'Todos os Tempos';
  }
}

function getTypeEmoji(type) {
  const emojis = {
    'denuncia': '📛',
    'denuncia_staff': '⚠️',
    'faccoes': '💀',
    'bugs': '🐌',
    'corregedoria': '🕵️',
    'vips': '💰',
    'imobiliaria': '🏘️'
  };
  return emojis[type] || '🎫';
}

function getActivityLevel(tickets) {
  if (tickets === 0) return '🔴 Nenhuma';
  if (tickets <= 5) return '🟡 Baixa';
  if (tickets <= 15) return '🟢 Média';
  if (tickets <= 30) return '🔵 Alta';
  return '🟣 Muito Alta';
} 