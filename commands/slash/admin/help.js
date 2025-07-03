const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const TicketManager = require('../../../utils/ticketManager.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Mostra informações sobre o sistema de tickets'),

  async execute(interaction) {
    try {
      const guildId = interaction.guildId;
      const guildConfig = await TicketManager.getGuildConfig(guildId);
      const categories = guildConfig?.ticketCategories || {};
      
      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('🎫 Sistema de Tickets - Ajuda')
        .setDescription('Guia completo para configurar e usar o sistema de tickets.')
        .addFields(
          {
            name: '⚙️ Configuração Inicial',
            value: '**Para administradores:**\n' +
              '1. `/setup quick` - Configuração rápida e completa\n' +
              '2. `/setup status` - Ver status atual da configuração\n' +
              '3. `/setup reset` - Resetar todas as configurações\n\n' +
              '**Configurações necessárias:**\n' +
              '• Categoria para tickets\n' +
              '• Cargo de suporte\n' +
              '• Canal de logs',
            inline: false
          },
          {
            name: '🎯 Comandos Principais',
            value: '**Para administradores:**\n' +
              '• `/setup` - Configurar o sistema\n' +
              '• `/stats` - Ver estatísticas\n' +
              '• `/servers` - Gerenciar servidores\n' +
              '• `/database` - Gerenciar banco de dados\n\n' +
              '**Para usuários:**\n' +
              '• `/ticket panel` - Criar painel de tickets\n' +
              '• `/ticket create` - Criar ticket diretamente',
            inline: false
          },
          {
            name: '📋 Tipos de Tickets Padrão',
            value: '• 📛 **Denúncia** - Denunciar um jogador por quebra de regras\n' +
              '• 🎫 **Suporte** - Dúvidas gerais e suporte técnico\n' +
              '• 🐛 **Relatar Bugs** - Reportar problemas e bugs encontrados\n' +
              '• ⚖️ **Recorrer Banimento** - Solicitar revisão de banimento',
            inline: false
          },
          {
            name: '🔧 Configurações Avançadas',
            value: '**Setup individual:**\n' +
              '• `/setup category` - Definir categoria\n' +
              '• `/setup support` - Definir cargo de suporte\n' +
              '• `/setup logs` - Definir canal de logs\n' +
              '• `/setup max` - Máximo de tickets por usuário\n' +
              '• `/setup auto` - Auto-fechamento\n' +
              '• `/setup branding` - Personalizar aparência\n' +
              '• `/setup mensagem` - Personalizar mensagens',
            inline: false
          },
          {
            name: 'Tipos de Ticket',
            value: Object.values(categories).length > 0
              ? Object.values(categories).map(cat => `${cat.emoji || '📁'} **${cat.name}**: ${cat.description || 'Sem descrição'}`).join('\n')
              : 'Nenhuma categoria configurada.'
          }
        );

      // Adicionar status atual se configurado
      if (guildConfig && guildConfig.ticketSettings) {
        const settings = guildConfig.ticketSettings;
        const isComplete = settings.categoryId && settings.supportRoleId && settings.logsChannelId;
        
        embed.addFields({
          name: '📊 Status Atual',
          value: `**Sistema:** ${settings.enabled ? '✅ Ativo' : '❌ Inativo'}\n` +
            `**Configuração:** ${isComplete ? '✅ Completa' : '⚠️ Incompleta'}\n` +
            `**Categoria:** ${settings.categoryId ? '✅' : '❌'}\n` +
            `**Cargo Suporte:** ${settings.supportRoleId ? '✅' : '❌'}\n` +
            `**Canal Logs:** ${settings.logsChannelId ? '✅' : '❌'}`,
          inline: false
        });
      }

      embed.setFooter({ text: 'Sistema de Tickets v2.0' })
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: true });

    } catch (error) {
      console.error('Erro no comando help:', error);
      
      const errorEmbed = new EmbedBuilder()
        .setColor('Red')
        .setDescription('❌ Ocorreu um erro ao executar o comando.');

      await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
  }
}; 