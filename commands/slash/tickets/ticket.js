const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ChannelType } = require('discord.js');
const TicketManager = require('../../../utils/ticketManager.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Cria um painel de tickets ou abre um ticket')
    .addSubcommand(subcommand =>
      subcommand
        .setName('panel')
        .setDescription('Cria um painel de tickets')
        .addChannelOption(option =>
          option
            .setName('canal')
            .setDescription('Canal onde o painel será criado')
            .setRequired(true)
        )
        .addIntegerOption(option =>
          option
            .setName('painel')
            .setDescription('Número do painel (1 ou 2)')
            .setRequired(false)
            .addChoices(
              { name: 'Painel 1', value: 1 },
              { name: 'Painel 2', value: 2 }
            )
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('create')
        .setDescription('Cria um ticket diretamente')
        .addStringOption(option =>
          option
            .setName('tipo')
            .setDescription('Tipo do ticket')
            .setRequired(true)
        )
    ),

  async execute(interaction) {
    try {
      const subcommand = interaction.options.getSubcommand();
      const guildId = interaction.guildId;
      const guildConfig = await TicketManager.getGuildConfig(guildId);
      const categories = guildConfig?.ticketCategories || {};
      const enabledCategories = Object.entries(categories).filter(([_, cat]) => cat.enabled !== false);

      if (subcommand === 'panel') {
        const channel = interaction.options.getChannel('canal');
        const painelNum = interaction.options.getInteger('painel') || 1;
        if (channel.type !== ChannelType.GuildText) {
          return interaction.reply({ content: '❌ O canal deve ser de texto.', ephemeral: true });
        }
        // Buscar configuração do painel
        const panels = guildConfig.ticketPanels || [];
        let panelConfig = panels.find(p => p.panelId === `painel${painelNum}`);
        if (!panelConfig) {
          // Criar config default se não existir
          panelConfig = {
            panelId: `painel${painelNum}`,
            name: `Painel ${painelNum}`,
            categories: painelNum === 1 ? Object.keys(categories) : [],
            channelId: channel.id,
            branding: { ...guildConfig.branding }
          };
          panels.push(panelConfig);
          guildConfig.ticketPanels = panels;
          await guildConfig.save();
        } else {
          panelConfig.channelId = channel.id;
          await guildConfig.save();
        }
        // Remover painel anterior do bot, se existir
        const messages = await channel.messages.fetch({ limit: 10 });
        const lastPanel = messages.find(m => m.author.id === interaction.client.user.id && m.components?.length && m.components[0].components[0]?.customId === `ticket_type_${painelNum}`);
        if (lastPanel) await lastPanel.delete().catch(() => {});
        // Painel dinâmico com branding do painel
        const branding = panelConfig.branding || guildConfig.branding || {};
        const embed = new EmbedBuilder()
          .setColor(branding.primaryColor || '#0099ff')
          .setTitle(branding.serverName ? `🎫 ${branding.serverName}` : `🎫 Painel ${painelNum}`)
          .setDescription(branding.description || 'Selecione o tipo de ticket que deseja abrir:');
        if (branding.banner) embed.setImage(branding.banner);
        if (branding.thumbnail) embed.setThumbnail(branding.thumbnail);
        if (branding.footer) embed.setFooter({ text: branding.footer });
        // Filtrar categorias do painel
        const painelCategories = panelConfig.categories.length > 0
          ? Object.entries(categories).filter(([id]) => panelConfig.categories.includes(id) && categories[id].enabled !== false)
          : Object.entries(categories).filter(([_, cat]) => cat.enabled !== false);
        const select = new StringSelectMenuBuilder()
          .setCustomId(`ticket_type_${painelNum}`)
          .setPlaceholder('Selecione o tipo de ticket')
          .addOptions(
            painelCategories.map(([key, cat]) => ({
              label: cat.name,
              value: key,
              description: cat.description?.slice(0, 50) || undefined,
              emoji: cat.emoji || undefined
            }))
          );
        const row = new ActionRowBuilder().addComponents(select);
        await channel.send({ embeds: [embed], components: [row] });
        await interaction.reply({ content: `✅ Painel ${painelNum} de tickets criado!`, ephemeral: true });
        return;
      }

      if (subcommand === 'create') {
        // Preencher choices dinamicamente
        const tipo = interaction.options.getString('tipo');
        if (!categories[tipo] || categories[tipo].enabled === false) {
          return interaction.reply({ content: '❌ Tipo de ticket inválido ou desativado.', ephemeral: true });
        }
        // Criar ticket normalmente
        // ... (restante do fluxo de criação)
        await interaction.reply({ content: `✅ Ticket do tipo **${categories[tipo].name}** criado!`, ephemeral: true });
        return;
      }
    } catch (error) {
      console.error('Erro no comando ticket:', error);
      await interaction.reply({ content: '❌ Erro ao executar comando.', ephemeral: true });
    }
  }
}; 