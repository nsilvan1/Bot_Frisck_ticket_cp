const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const TicketManager = require('../../../utils/ticketManager.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Configura o sistema de tickets')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    try {
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        const embed = new EmbedBuilder()
          .setColor('Red')
          .setTitle('❌ | Permissão Negada')
          .setDescription('Você precisa ser administrador para usar este comando.');

        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      await this.showMainPanel(interaction);

    } catch (error) {
      console.error('Erro no comando setup:', error);
      
      const errorEmbed = new EmbedBuilder()
        .setColor('Red')
        .setDescription(`❌ Ocorreu um erro ao executar o comando: ${error.message}`);

      if (interaction.replied || interaction.deferred) {
        await interaction.editReply({ embeds: [errorEmbed] });
      } else {
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
    }
  },

  async showMainPanel(interaction) {
    const guildId = interaction.guildId;
    const config = await TicketManager.getGuildConfig(guildId);
    const settings = config?.ticketSettings || {};

    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('⚙️ Painel de Configuração - Sistema de Tickets')
      .setDescription('Configure seu sistema de tickets usando as opções abaixo:')
      .addFields(
        { 
          name: '📊 Status Atual', 
          value: settings.enabled ? '✅ Sistema Ativo' : '❌ Sistema Inativo', 
          inline: true 
        },
        { 
          name: '📁 Categoria', 
          value: settings.categoryId ? `<#${settings.categoryId}>` : '❌ Não definida', 
          inline: true 
        },
        { 
          name: '👥 Cargo Suporte', 
          value: settings.supportRoleIds?.length > 0 ? settings.supportRoleIds.map(id => `<@&${id}>`).join(', ') : '❌ Não definido', 
          inline: true 
        },
        { 
          name: '📝 Canal Logs', 
          value: settings.logsChannelId ? `<#${settings.logsChannelId}>` : '❌ Não definido', 
          inline: true 
        },
        { 
          name: '🔢 Máx. Tickets', 
          value: settings.maxTicketsPerUser?.toString() || '1', 
          inline: true 
        },
        { 
          name: '⏰ Auto-fechamento', 
          value: settings.autoCloseAfter ? `${settings.autoCloseAfter}h` : 'Desabilitado', 
          inline: true 
        },
        { 
          name: '🔒 Fechar Ticket',
          value: settings.closeByStaffOnly ? 'Apenas Staff pode fechar tickets' : 'Qualquer um pode fechar tickets',
          inline: false
        }
      );

    const configRow = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('setup_category')
          .setLabel('📁 Categoria')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('setup_support')
          .setLabel('👥 Cargo Suporte')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('setup_logs')
          .setLabel('📝 Canal Logs')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('setup_limits')
          .setLabel('🔢 Limites')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('setup_auto_close')
          .setLabel('⏰ Auto-fechamento')
          .setStyle(ButtonStyle.Secondary)
      );

    const configRow2 = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('setup_close_by_staff')
          .setLabel('🔒 Permissão Fechar Ticket')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('setup_toggle')
          .setLabel(settings.enabled ? '❌ Desativar' : '✅ Ativar')
          .setStyle(settings.enabled ? ButtonStyle.Danger : ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('setup_reset')
          .setLabel('🔄 Resetar')
          .setStyle(ButtonStyle.Danger)
      );

    const configRow3 = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('setup_config_categorias')
          .setLabel('⚙️ Config Categorias')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('setup_branding')
          .setLabel('🎨 Personalizar Painel')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('setup_config_painel2')
          .setLabel('⚙️ Config Painel 2')
          .setStyle(ButtonStyle.Primary)
      );

    if (interaction.replied || interaction.deferred) {
      await interaction.editReply({ 
        embeds: [embed], 
        components: [configRow, configRow2, configRow3]
      });
    } else {
      await interaction.reply({ 
        embeds: [embed], 
        components: [configRow, configRow2, configRow3],
        ephemeral: true
      });
    }
  },

  async handleComponent(interaction) {
    try {
      const { customId } = interaction;

      switch (customId) {
        case 'setup_category':
          await this.showCategorySetup(interaction);
          break;
        case 'setup_support':
          await this.showSupportSetup(interaction);
          break;
        case 'setup_logs':
          await this.showLogsSetup(interaction);
          break;
        case 'setup_limits':
          await this.showLimitsSetup(interaction);
          break;
        case 'setup_auto_close':
          await this.showAutoCloseSetup(interaction);
          break;
        case 'setup_toggle':
          await this.toggleSystem(interaction);
          break;
        case 'setup_reset':
          await this.resetSystem(interaction);
          break;
        case 'setup_confirm_reset':
          await this.confirmReset(interaction);
          break;
        case 'setup_back':
          await this.showMainPanel(interaction);
          break;
        case 'setup_select_category':
          await this.saveCategory(interaction);
          break;
        case 'setup_select_support':
          await this.saveSupport(interaction);
          break;
        case 'setup_select_logs':
          await this.saveLogs(interaction);
          break;
        case 'setup_select_limits':
          await this.saveLimits(interaction);
          break;
        case 'setup_select_auto_close':
          await this.saveAutoClose(interaction);
          break;
        case 'setup_close_by_staff':
          await this.showCloseByStaffSetup(interaction);
          break;
        case 'setup_select_close_by_staff':
          await this.saveCloseByStaff(interaction);
          break;
        case 'setup_config_categorias':
          await this.showCategoriesPanel(interaction);
          break;
        case 'setup_add_categoria':
          await this.showAddCategoryModal(interaction);
          break;
        case 'setup_edit_categoria':
          await this.showEditCategorySelect(interaction);
          break;
        case 'setup_remove_categoria':
          await this.showRemoveCategorySelect(interaction);
          break;
        case 'setup_default_categories':
          await this.createDefaultCategories(interaction);
          break;
        case 'setup_branding':
          await this.showBrandingPanel(interaction);
          break;
        case 'branding_edit_name':
          await this.showBrandingModal(interaction, 'serverName', 'Nome do Servidor', 'Ex: Aztlan City', false, true);
          break;
        case 'branding_edit_colors':
          await this.showBrandingModal(interaction, 'colors', 'Cores do Painel', 'Ex: #0099ff,#000000', false, false);
          break;
        case 'branding_edit_banner':
          await this.showBrandingModal(interaction, 'banner', 'URL do Banner', 'URL de uma imagem', false, false);
          break;
        case 'branding_edit_thumbnail':
          await this.showBrandingModal(interaction, 'thumbnail', 'URL do Thumbnail', 'URL de uma imagem', false, false);
          break;
        case 'branding_edit_description':
          await this.showBrandingModal(interaction, 'description', 'Descrição do Painel', 'Texto de descrição', true, true);
          break;
        case 'branding_edit_footer':
          await this.showBrandingModal(interaction, 'footer', 'Rodapé do Painel', 'Texto do rodapé', false, false);
          break;
        case 'setup_config_painel2':
          await this.showPainel2Panel(interaction);
          break;
        case 'painel2_add_categoria':
          await this.showPainel2AddCategoria(interaction);
          break;
        case 'painel2_remover_categoria':
          await this.showPainel2RemoveCategoria(interaction);
          break;
        case 'painel2_branding':
          await this.showPainel2Branding(interaction);
          break;
        case 'painel2_edit_name':
          await this.showPainel2BrandingModal(interaction, 'name', 'Nome do Painel', 'Ex: Roleplay', false, true);
          break;
        case 'painel2_edit_colors':
          await this.showPainel2BrandingModal(interaction, 'colors', 'Cores do Painel', 'Ex: #0099ff,#000000', false, false);
          break;
        case 'painel2_edit_banner':
          await this.showPainel2BrandingModal(interaction, 'banner', 'URL do Banner', 'URL de uma imagem', false, false);
          break;
        case 'painel2_edit_thumbnail':
          await this.showPainel2BrandingModal(interaction, 'thumbnail', 'URL do Thumbnail', 'URL de uma imagem', false, false);
          break;
        case 'painel2_edit_description':
          await this.showPainel2BrandingModal(interaction, 'description', 'Descrição do Painel', 'Texto de descrição', true, true);
          break;
        case 'painel2_edit_footer':
          await this.showPainel2BrandingModal(interaction, 'footer', 'Rodapé do Painel', 'Texto do rodapé', false, false);
          break;
        case 'branding_preview':
          await this.showBrandingPreview(interaction);
          break;
        case 'painel2_preview':
          await this.showPainel2Preview(interaction);
          break;
        default:
          await interaction.reply({ content: '❌ Opção não reconhecida.', ephemeral: true });
      }
    } catch (error) {
      console.error('Erro no handleComponent:', error);
      await interaction.reply({ 
        content: `❌ Erro: ${error.message}`, 
        ephemeral: true 
      });
    }
  },

  async showCategorySetup(interaction) {
    const guildId = interaction.guildId;
    const config = await TicketManager.getGuildConfig(guildId);
    const categories = config?.ticketCategories || {};
    
    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('📁 Configurar Categoria dos Tickets')
      .setDescription('Selecione a categoria onde os tickets serão criados:');

    if (Object.keys(categories).length === 0) {
      embed.setDescription('❌ Nenhuma categoria encontrada no servidor.\n\nCrie uma categoria primeiro e tente novamente.');
      const backButton = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('setup_back')
            .setLabel('⬅️ Voltar')
            .setStyle(ButtonStyle.Secondary)
        );
      
      await interaction.update({ embeds: [embed], components: [backButton] });
      return;
    }

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('setup_select_category')
      .setPlaceholder('Selecione uma categoria')
      .addOptions(
        Object.entries(categories).map(([key, cat]) => ({
          label: cat.name || key,
          value: key,
          description: `Categoria: ${cat.name || key}`
        }))
      );

    const row = new ActionRowBuilder().addComponents(selectMenu);
    const backButton = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('setup_back')
          .setLabel('⬅️ Voltar')
          .setStyle(ButtonStyle.Secondary)
      );

    await interaction.update({ embeds: [embed], components: [row, backButton] });
  },

  async showSupportSetup(interaction) {
    const guildId = interaction.guildId;
    const config = await TicketManager.getGuildConfig(guildId);
    const roles = config.ticketSettings.supportRoleIds?.map(id => interaction.guild.roles.cache.get(id)) || [];
    
    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('👥 Configurar Cargo de Suporte')
      .setDescription('Selecione o(s) cargo(s) que terão acesso aos tickets:');

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('setup_select_support')
      .setPlaceholder('Selecione um ou mais cargos')
      .setMinValues(1)
      .setMaxValues(5)
      .addOptions(
        roles.map(role => ({
          label: role.name,
          value: role.id,
          description: `Cargo: ${role.name}`
        })).slice(0, 25)
      );

    const row = new ActionRowBuilder().addComponents(selectMenu);
    const backButton = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('setup_back')
          .setLabel('⬅️ Voltar')
          .setStyle(ButtonStyle.Secondary)
      );

    await interaction.update({ embeds: [embed], components: [row, backButton] });
  },

  async showLogsSetup(interaction) {
    const guildId = interaction.guildId;
    const config = await TicketManager.getGuildConfig(guildId);
    const textChannels = interaction.guild.channels.cache.filter(c => c.type === ChannelType.GuildText);
    
    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('📝 Configurar Canal de Logs')
      .setDescription('Selecione o canal onde os logs dos tickets serão enviados:');

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('setup_select_logs')
      .setPlaceholder('Selecione um canal')
      .addOptions(
        textChannels.map(ch => ({
          label: ch.name,
          value: ch.id,
          description: `Canal: #${ch.name}`
        })).slice(0, 25)
      );

    const row = new ActionRowBuilder().addComponents(selectMenu);
    const backButton = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('setup_back')
          .setLabel('⬅️ Voltar')
          .setStyle(ButtonStyle.Secondary)
      );

    await interaction.update({ embeds: [embed], components: [row, backButton] });
  },

  async showLimitsSetup(interaction) {
    const guildId = interaction.guildId;
    const config = await TicketManager.getGuildConfig(guildId);
    const maxTickets = config.ticketSettings.maxTicketsPerUser || 1;
    
    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('🔢 Configurar Limites')
      .setDescription('Selecione o número máximo de tickets que um usuário pode ter abertos:');

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('setup_select_limits')
      .setPlaceholder('Selecione o limite')
      .addOptions([
        { label: '1 ticket', value: '1', description: 'Máximo 1 ticket por usuário' },
        { label: '2 tickets', value: '2', description: 'Máximo 2 tickets por usuário' },
        { label: '3 tickets', value: '3', description: 'Máximo 3 tickets por usuário' },
        { label: '4 tickets', value: '4', description: 'Máximo 4 tickets por usuário' },
        { label: '5 tickets', value: '5', description: 'Máximo 5 tickets por usuário' }
      ]);

    const row = new ActionRowBuilder().addComponents(selectMenu);
    const backButton = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('setup_back')
          .setLabel('⬅️ Voltar')
          .setStyle(ButtonStyle.Secondary)
      );

    await interaction.update({ embeds: [embed], components: [row, backButton] });
  },

  async showAutoCloseSetup(interaction) {
    const guildId = interaction.guildId;
    const config = await TicketManager.getGuildConfig(guildId);
    const autoCloseAfter = config.ticketSettings.autoCloseAfter || 0;
    
    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('⏰ Configurar Auto-fechamento')
      .setDescription('Selecione o tempo para auto-fechamento dos tickets (em horas):');

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('setup_select_auto_close')
      .setPlaceholder('Selecione o tempo')
      .addOptions([
        { label: 'Desabilitado', value: '0', description: 'Não fechar automaticamente' },
        { label: '1 hora', value: '1', description: 'Fechar após 1 hora de inatividade' },
        { label: '6 horas', value: '6', description: 'Fechar após 6 horas de inatividade' },
        { label: '12 horas', value: '12', description: 'Fechar após 12 horas de inatividade' },
        { label: '24 horas', value: '24', description: 'Fechar após 24 horas de inatividade' },
        { label: '48 horas', value: '48', description: 'Fechar após 48 horas de inatividade' }
      ]);

    const row = new ActionRowBuilder().addComponents(selectMenu);
    const backButton = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('setup_back')
          .setLabel('⬅️ Voltar')
          .setStyle(ButtonStyle.Secondary)
      );

    await interaction.update({ embeds: [embed], components: [row, backButton] });
  },

  async saveCategory(interaction) {
    const guildId = interaction.guildId;
    const config = await TicketManager.getGuildConfig(guildId);
    const categoryId = interaction.values[0];
    const category = interaction.guild.channels.cache.get(categoryId);
    
    await TicketManager.updateGuildConfig(guildId, { 
      'ticketSettings.categoryId': categoryId 
    });

    const embed = new EmbedBuilder()
      .setColor('Green')
      .setTitle('✅ Categoria Configurada')
      .setDescription(`Categoria definida para: **${category.name}**`);

    const backButton = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('setup_back')
          .setLabel('⬅️ Voltar ao Menu')
          .setStyle(ButtonStyle.Secondary)
      );

    await interaction.update({ embeds: [embed], components: [backButton] });
  },

  async saveSupport(interaction) {
    const guildId = interaction.guildId;
    const config = await TicketManager.getGuildConfig(guildId);
    const roleIds = interaction.values;
    const roles = roleIds.map(id => interaction.guild.roles.cache.get(id));
    
    await TicketManager.updateGuildConfig(guildId, { 
      'ticketSettings.supportRoleIds': roleIds 
    });

    const embed = new EmbedBuilder()
      .setColor('Green')
      .setTitle('✅ Cargos de Suporte Configurados')
      .setDescription(`Cargos definidos: ${roles.map(r => `**${r.name}**`).join(', ')}`);

    const backButton = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('setup_back')
          .setLabel('⬅️ Voltar ao Menu')
          .setStyle(ButtonStyle.Secondary)
      );

    await interaction.update({ embeds: [embed], components: [backButton] });
  },

  async saveLogs(interaction) {
    const guildId = interaction.guildId;
    const config = await TicketManager.getGuildConfig(guildId);
    const channelId = interaction.values[0];
    const channel = interaction.guild.channels.cache.get(channelId);
    
    await TicketManager.updateGuildConfig(guildId, { 
      'ticketSettings.logsChannelId': channelId 
    });

    const embed = new EmbedBuilder()
      .setColor('Green')
      .setTitle('✅ Canal de Logs Configurado')
      .setDescription(`Canal definido: **#${channel.name}**`);

    const backButton = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('setup_back')
          .setLabel('⬅️ Voltar ao Menu')
          .setStyle(ButtonStyle.Secondary)
      );

    await interaction.update({ embeds: [embed], components: [backButton] });
  },

  async saveLimits(interaction) {
    const guildId = interaction.guildId;
    const config = await TicketManager.getGuildConfig(guildId);
    const maxTickets = parseInt(interaction.values[0]);
    
    await TicketManager.updateGuildConfig(guildId, { 
      'ticketSettings.maxTicketsPerUser': maxTickets 
    });

    const embed = new EmbedBuilder()
      .setColor('Green')
      .setTitle('✅ Limite Configurado')
      .setDescription(`Limite definido: **${maxTickets} ticket(s) por usuário**`);

    const backButton = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('setup_back')
          .setLabel('⬅️ Voltar ao Menu')
          .setStyle(ButtonStyle.Secondary)
      );

    await interaction.update({ embeds: [embed], components: [backButton] });
  },

  async saveAutoClose(interaction) {
    const guildId = interaction.guildId;
    const config = await TicketManager.getGuildConfig(guildId);
    const hours = parseInt(interaction.values[0]);
    
    await TicketManager.updateGuildConfig(guildId, { 
      'ticketSettings.autoCloseAfter': hours 
    });

    const embed = new EmbedBuilder()
      .setColor('Green')
      .setTitle('✅ Auto-fechamento Configurado')
      .setDescription(hours === 0 ? 
        'Auto-fechamento **desabilitado**' : 
        `Auto-fechamento definido: **${hours} hora(s)**`
      );

    const backButton = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('setup_back')
          .setLabel('⬅️ Voltar ao Menu')
          .setStyle(ButtonStyle.Secondary)
      );

    await interaction.update({ embeds: [embed], components: [backButton] });
  },

  async toggleSystem(interaction) {
    const guildId = interaction.guildId;
    const config = await TicketManager.getGuildConfig(guildId);
    const newStatus = !config.ticketSettings.enabled;
    
    await TicketManager.updateGuildConfig(guildId, { 
      'ticketSettings.enabled': newStatus 
    });

    const embed = new EmbedBuilder()
      .setColor(newStatus ? 'Green' : 'Red')
      .setTitle(newStatus ? '✅ Sistema Ativado' : '❌ Sistema Desativado')
      .setDescription(newStatus ? 
        'O sistema de tickets foi **ativado** com sucesso!' : 
        'O sistema de tickets foi **desativado**.'
      );

    const backButton = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('setup_back')
          .setLabel('⬅️ Voltar ao Menu')
          .setStyle(ButtonStyle.Secondary)
      );

    await interaction.update({ embeds: [embed], components: [backButton] });
  },

  async resetSystem(interaction) {
    const embed = new EmbedBuilder()
      .setColor('Red')
      .setTitle('⚠️ Confirmar Reset')
      .setDescription('Tem certeza que deseja resetar todas as configurações?\n\n**Esta ação não pode ser desfeita!**');

    const confirmRow = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('setup_confirm_reset')
          .setLabel('✅ Sim, Resetar')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('setup_back')
          .setLabel('❌ Cancelar')
          .setStyle(ButtonStyle.Secondary)
      );

    await interaction.update({ embeds: [embed], components: [confirmRow] });
  },

  async confirmReset(interaction) {
    const guildId = interaction.guildId;
    await TicketManager.resetGuildConfig(guildId);

    const embed = new EmbedBuilder()
      .setColor('Green')
      .setTitle('✅ Sistema Resetado')
      .setDescription('Todas as configurações foram resetadas com sucesso!\n\nConfigure o sistema novamente usando as opções abaixo.');

    const backButton = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('setup_back')
          .setLabel('⬅️ Voltar ao Menu')
          .setStyle(ButtonStyle.Secondary)
      );

    await interaction.update({ embeds: [embed], components: [backButton] });
  },

  async showCloseByStaffSetup(interaction) {
    const guildId = interaction.guildId;
    const config = await TicketManager.getGuildConfig(guildId);
    const current = config.ticketSettings.closeByStaffOnly;
    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('🔒 Permissão para Fechar Ticket')
      .setDescription('Escolha quem pode fechar tickets neste servidor:');
    const select = new StringSelectMenuBuilder()
      .setCustomId('setup_select_close_by_staff')
      .setPlaceholder('Selecione quem pode fechar tickets')
      .addOptions([
        {
          label: 'Apenas Staff pode fechar',
          value: 'staff',
          description: 'Somente membros com cargo de suporte podem fechar tickets',
          default: current === true
        },
        {
          label: 'Qualquer um pode fechar',
          value: 'anyone',
          description: 'Qualquer usuário pode fechar tickets',
          default: current === false
        }
      ]);
    const row = new ActionRowBuilder().addComponents(select);
    await interaction.update({ embeds: [embed], components: [row] });
  },

  async saveCloseByStaff(interaction) {
    const guildId = interaction.guildId;
    const config = await TicketManager.getGuildConfig(guildId);
    const value = interaction.values[0];
    const closeByStaffOnly = value === 'staff';
    await TicketManager.updateGuildConfig(guildId, {
      'ticketSettings.closeByStaffOnly': closeByStaffOnly
    });
    const embed = new EmbedBuilder()
      .setColor('Green')
      .setTitle('🔒 Permissão Atualizada')
      .setDescription(closeByStaffOnly ? 'Agora **apenas a staff** pode fechar tickets.' : 'Agora **qualquer um** pode fechar tickets.');
    const backButton = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('setup_back')
          .setLabel('⬅️ Voltar ao Menu')
          .setStyle(ButtonStyle.Secondary)
      );
    await interaction.update({ embeds: [embed], components: [backButton] });
  },

  async showCategoriesPanel(interaction) {
    const guildId = interaction.guildId;
    const config = await TicketManager.getGuildConfig(guildId);
    const categories = config?.ticketCategories || {};
    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('⚙️ Configuração de Categorias de Ticket')
      .setDescription('Gerencie os tipos de ticket do seu servidor. Você pode adicionar, editar, ativar/desativar ou remover categorias.');

    // Listar categorias
    if (Object.keys(categories).length === 0) {
      embed.addFields({ name: 'Nenhuma categoria configurada', value: 'Clique em "Adicionar Categoria" para criar uma nova.' });
    } else {
      for (const [key, cat] of Object.entries(categories)) {
        embed.addFields({
          name: `${cat.emoji || '📁'} ${cat.name || key} ${cat.enabled === false ? '❌' : '✅'}`,
          value: `*${cat.description || 'Sem descrição'}*\nStaff Only: ${cat.staffOnly ? 'Sim' : 'Não'}\nID: \`${key}\``,
          inline: false
        });
      }
    }

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('setup_add_categoria')
        .setLabel('➕ Adicionar Categoria')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('setup_edit_categoria')
        .setLabel('✏️ Editar Categoria')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(Object.keys(categories).length === 0),
      new ButtonBuilder()
        .setCustomId('setup_remove_categoria')
        .setLabel('🗑️ Remover Categoria')
        .setStyle(ButtonStyle.Danger)
        .setDisabled(Object.keys(categories).length === 0),
      new ButtonBuilder()
        .setCustomId('setup_back')
        .setLabel('⬅️ Voltar')
        .setStyle(ButtonStyle.Secondary)
    );

    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('setup_default_categories')
        .setLabel('📋 Criar Categorias Padrão')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(Object.keys(categories).length > 0)
    );

    await interaction.update({
      embeds: [embed],
      components: [row, row2]
    });
  },

  async createDefaultCategories(interaction) {
    const guildId = interaction.guildId;
    const config = await TicketManager.getGuildConfig(guildId);
    
    // Obter categorias padrão do TicketManager
    const defaultCategories = new TicketManager().getDefaultCategories();
    
    // Salvar categorias no ticketCategories
    config.ticketCategories = { ...config.ticketCategories, ...defaultCategories };
    
    // Adicionar IDs das categorias ao painel1
    const painel1 = config.ticketPanels.find(p => p.panelId === 'painel1');
    if (!painel1) {
      // Criar painel1 se não existir
      config.ticketPanels.push({
        panelId: 'painel1',
        name: 'Painel 1',
        categories: [], // Array de IDs
        branding: { ...config.branding }
      });
      await config.save();
    } else {
      // Adicionar IDs das categorias ao painel1 existente
      painel1.categories = Object.keys(defaultCategories); // Array de IDs
    }
    
    // Salvar configuração
    config.markModified('ticketPanels');
    config.markModified('ticketCategories');
    await config.save();
    
    const embed = new EmbedBuilder()
      .setColor('Green')
      .setTitle('✅ Categorias Padrão Criadas')
      .setDescription('As seguintes categorias foram criadas automaticamente:')
      .addFields(
        { name: '📛 Denúncia', value: 'Denunciar um jogador por quebra de regras', inline: true },
        { name: '🎫 Suporte', value: 'Dúvidas gerais e suporte técnico', inline: true },
        { name: '🐛 Relatar Bugs', value: 'Reportar problemas e bugs encontrados', inline: true },
        { name: '⚖️ Recorrer Banimento', value: 'Solicitar revisão de banimento', inline: true }
      );
    
    const backButton = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('setup_config_categorias')
          .setLabel('⬅️ Voltar às Categorias')
          .setStyle(ButtonStyle.Secondary)
      );
    
    await interaction.update({ embeds: [embed], components: [backButton] });
  },

  async showAddCategoryModal(interaction) {
    const guildId = interaction.guildId;
    const config = await TicketManager.getGuildConfig(guildId);
    // Não precisamos do painel1 aqui, pois vamos salvar no ticketCategories
    const modal = new ModalBuilder()
      .setCustomId('modal_add_categoria')
      .setTitle('➕ Nova Categoria de Ticket')
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('cat_id')
            .setLabel('ID da Categoria (ex: suporte, vip, denuncia)')
            .setStyle(TextInputStyle.Short)
            .setMinLength(2)
            .setMaxLength(20)
            .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('cat_name')
            .setLabel('Nome da Categoria')
            .setStyle(TextInputStyle.Short)
            .setMinLength(2)
            .setMaxLength(32)
            .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('cat_emoji')
            .setLabel('Emoji (ex: 🎫)')
            .setStyle(TextInputStyle.Short)
            .setMaxLength(2)
            .setRequired(false)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('cat_desc')
            .setLabel('Descrição')
            .setStyle(TextInputStyle.Paragraph)
            .setMaxLength(100)
            .setRequired(false)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('cat_staff')
            .setLabel('Apenas staff pode abrir? (sim/não)')
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
        )
      );
    await interaction.showModal(modal);
  },

  async showEditCategorySelect(interaction) {
    const guildId = interaction.guildId;
    const config = await TicketManager.getGuildConfig(guildId);
    const categories = config?.ticketCategories || {};
    const options = Object.entries(categories).map(([key, cat]) => ({
      label: `${cat.emoji || '📁'} ${cat.name || key}`,
      value: key,
      description: cat.description?.slice(0, 50) || undefined
    }));
    const select = new StringSelectMenuBuilder()
      .setCustomId('edit_categoria_select')
      .setPlaceholder('Selecione a categoria para editar')
      .addOptions(options);
    const row = new ActionRowBuilder().addComponents(select);
    await interaction.reply({
      content: 'Selecione a categoria que deseja editar:',
      components: [row],
      ephemeral: true
    });
  },

  async showRemoveCategorySelect(interaction) {
    const guildId = interaction.guildId;
    const config = await TicketManager.getGuildConfig(guildId);
    const categories = config?.ticketCategories || {};
    const options = Object.entries(categories).map(([key, cat]) => ({
      label: `${cat.emoji || '📁'} ${cat.name || key}`,
      value: key,
      description: cat.description?.slice(0, 50) || undefined
    }));
    const select = new StringSelectMenuBuilder()
      .setCustomId('remove_categoria_select')
      .setPlaceholder('Selecione a categoria para remover')
      .addOptions(options);
    const row = new ActionRowBuilder().addComponents(select);
    await interaction.reply({
      content: 'Selecione a categoria que deseja remover:',
      components: [row],
      ephemeral: true
    });
  },

  // Handler para selects
  async handleSelect(interaction) {
    const guildId = interaction.guildId;
    const config = await TicketManager.getGuildConfig(guildId);
    const painel1 = config.ticketPanels.find(p => p.panelId === 'painel1');
    const painel2 = config.ticketPanels.find(p => p.panelId === 'painel2');
    
    // Criar painel1 se não existir
    if (!painel1) {
      if (!config.ticketPanels) config.ticketPanels = [];
      config.ticketPanels.push({
        panelId: 'painel1',
        name: 'Painel 1',
        categories: [], // Array de IDs
        branding: { ...config.branding }
      });
      await config.save();
    }
    if (interaction.customId === 'edit_categoria_select') {
      const catId = interaction.values[0];
      const cat = config.ticketCategories?.[catId];
      // Modal para editar
      const modal = new ModalBuilder()
        .setCustomId(`modal_edit_categoria_${catId}`)
        .setTitle('✏️ Editar Categoria')
        .addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('cat_name')
              .setLabel('Nome da Categoria')
              .setStyle(TextInputStyle.Short)
              .setMinLength(2)
              .setMaxLength(32)
              .setRequired(true)
              .setValue(cat.name || '')
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('cat_emoji')
              .setLabel('Emoji (ex: 🎫)')
              .setStyle(TextInputStyle.Short)
              .setMaxLength(2)
              .setRequired(false)
              .setValue(cat.emoji || '')
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('cat_desc')
              .setLabel('Descrição')
              .setStyle(TextInputStyle.Paragraph)
              .setMaxLength(100)
              .setRequired(false)
              .setValue(cat.description || '')
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('cat_staff')
              .setLabel('Apenas staff pode abrir? (sim/não)')
              .setStyle(TextInputStyle.Short)
              .setRequired(false)
              .setValue(cat.staffOnly ? 'sim' : 'não')
          )
        );
      await interaction.showModal(modal);
      return;
    }
    if (interaction.customId === 'remove_categoria_select') {
      const catId = interaction.values[0];
      const cat = config.ticketCategories?.[catId];
      // Confirmação
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`confirm_remove_categoria_${catId}`)
          .setLabel(`Remover ${cat.emoji || ''} ${cat.name}`)
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('setup_config_categorias')
          .setLabel('Cancelar')
          .setStyle(ButtonStyle.Secondary)
      );
      await interaction.reply({
        content: `Tem certeza que deseja remover a categoria **${cat.emoji || ''} ${cat.name}**?`,
        components: [row],
        ephemeral: true
      });
      return;
    }
    if (interaction.customId === 'painel2_add_categoria_select') {
      const catId = interaction.values[0];
      if (!painel2.categories.includes(catId)) {
        painel2.categories.push(catId);
        config.markModified('ticketPanels');
        await config.save();
      }
      await interaction.reply({ content: '✅ Categoria adicionada ao Painel 2!', ephemeral: true });
      safeShowPanel(this.showPainel2Panel.bind(this), interaction);
      return;
    }
    if (interaction.customId === 'painel2_remove_categoria_select') {
      const catId = interaction.values[0];
      painel2.categories = painel2.categories.filter(id => id !== catId);
      config.markModified('ticketPanels');
      await config.save();
      await interaction.reply({ content: '✅ Categoria removida do Painel 2!', ephemeral: true });
      safeShowPanel(this.showPainel2Panel.bind(this), interaction);
      return;
    }
  },

  // Handler para submit do modal de edição
  async handleEditCategoryModal(interaction) {
    const guildId = interaction.guildId;
    const catId = interaction.customId.replace('modal_edit_categoria_', '');
    const config = await TicketManager.getGuildConfig(guildId);
    
    if (!config.ticketCategories?.[catId]) {
      return interaction.reply({ content: '❌ Categoria não encontrada.', ephemeral: true });
    }
    
    config.ticketCategories[catId].name = interaction.fields.getTextInputValue('cat_name').trim();
    config.ticketCategories[catId].emoji = interaction.fields.getTextInputValue('cat_emoji').trim() || '📁';
    config.ticketCategories[catId].description = interaction.fields.getTextInputValue('cat_desc').trim() || '';
    const catStaff = interaction.fields.getTextInputValue('cat_staff').trim().toLowerCase();
    config.ticketCategories[catId].staffOnly = catStaff === 'sim' || catStaff === 's' || catStaff === 'yes' || catStaff === 'y';
    
    config.markModified('ticketCategories');
    await config.save();
    await interaction.reply({ content: `✅ Categoria **${config.ticketCategories[catId].name}** editada!`, ephemeral: true });
    safeShowPanel(this.showCategoriesPanel.bind(this), interaction);
  },

  // Handler para remover categoria
  async handleRemoveCategory(interaction, catId) {
    const guildId = interaction.guildId;
    const config = await TicketManager.getGuildConfig(guildId);
    const nome = config.ticketCategories?.[catId]?.name || catId;
    
    // Remover categoria do ticketCategories
    if (config.ticketCategories && config.ticketCategories[catId]) {
      delete config.ticketCategories[catId];
    }
    
    // Remover categoria de todos os painéis
    if (config.ticketPanels) {
      config.ticketPanels.forEach(panel => {
        if (panel.categories && Array.isArray(panel.categories)) {
          panel.categories = panel.categories.filter(id => id !== catId);
        }
      });
    }
    
    config.markModified('ticketCategories');
    config.markModified('ticketPanels');
    await config.save();
    
    await interaction.reply({ content: `✅ Categoria **${nome}** removida!`, ephemeral: true });
    safeShowPanel(this.showCategoriesPanel.bind(this), interaction);
  },

  // Handler para submit do modal
  async handleModalSubmit(interaction) {
    if (interaction.customId === 'modal_add_categoria') {
      const guildId = interaction.guildId;
      const catId = interaction.fields.getTextInputValue('cat_id').trim().toLowerCase();
      const catName = interaction.fields.getTextInputValue('cat_name').trim();
      const catEmoji = interaction.fields.getTextInputValue('cat_emoji').trim() || '📁';
      const catDesc = interaction.fields.getTextInputValue('cat_desc').trim() || '';
      const catStaff = interaction.fields.getTextInputValue('cat_staff').trim().toLowerCase();
      const staffOnly = catStaff === 'sim' || catStaff === 's' || catStaff === 'yes' || catStaff === 'y';
      // Validar ID
      if (!/^[a-z0-9_\-]{2,20}$/.test(catId)) {
        return interaction.reply({ content: '❌ ID inválido. Use apenas letras, números, hífen ou underline.', ephemeral: true });
      }
      // Buscar config
      const config = await TicketManager.getGuildConfig(guildId);
      
      // Verificar se categoria já existe
      if (config.ticketCategories && config.ticketCategories[catId]) {
        return interaction.reply({ content: '❌ Já existe uma categoria com esse ID.', ephemeral: true });
      }
      
      // Salvar categoria no ticketCategories
      if (!config.ticketCategories) config.ticketCategories = {};
      config.ticketCategories[catId] = {
        enabled: true,
        name: catName,
        emoji: catEmoji,
        description: catDesc,
        staffOnly
      };
      
      // Adicionar categoria ao painel1 se existir
      let painel1 = config.ticketPanels.find(p => p.panelId === 'painel1');
      if (painel1) {
        if (!painel1.categories) painel1.categories = [];
        if (!painel1.categories.includes(catId)) {
          painel1.categories.push(catId);
        }
      }
      
      config.markModified('ticketCategories');
      config.markModified('ticketPanels');
      await config.save();
      await interaction.reply({ content: `✅ Categoria **${catName}** adicionada!`, ephemeral: true });
      // Atualizar painel
      safeShowPanel(this.showCategoriesPanel.bind(this), interaction);
      return;
    }
    if (interaction.customId.startsWith('branding_modal_')) {
      const field = interaction.customId.replace('branding_modal_', '');
      const value = interaction.fields.getTextInputValue('value').trim();
      const guildId = interaction.guildId;
      const config = await TicketManager.getGuildConfig(guildId);
      let painel1 = config.ticketPanels.find(p => p.panelId === 'painel1');
      
      // Criar painel1 se não existir
      if (!painel1) {
        if (!config.ticketPanels) config.ticketPanels = [];
        painel1 = {
          panelId: 'painel1',
          name: 'Painel 1',
          categories: [], // Array de IDs
          branding: { ...config.branding }
        };
        config.ticketPanels.push(painel1);
      }
      
      // Garantir que branding existe
      if (!painel1.branding) {
        painel1.branding = { ...config.branding };
      }
      
      if (field === 'colors') {
        const [primary, secondary] = value.split(',').map(s => s.trim());
        painel1.branding.primaryColor = primary;
        painel1.branding.secondaryColor = secondary;
      } else {
        painel1.branding[field] = value;
      }
      config.markModified('ticketPanels');
      await config.save();
      await interaction.reply({ content: '✅ Branding atualizado!', ephemeral: true });
      // Atualizar automaticamente a visualização após alteração
      setTimeout(() => {
        this.showBrandingPanel(interaction).catch(console.error);
      }, 1000);
      return;
    }
    if (interaction.customId.startsWith('painel2_edit_')) {
      const field = interaction.customId.replace('painel2_edit_', '');
      const value = interaction.fields.getTextInputValue('value').trim();
      const guildId = interaction.guildId;
      const config = await TicketManager.getGuildConfig(guildId);
      let painel2 = config.ticketPanels.find(p => p.panelId === 'painel2');
      if (!painel2) return interaction.reply({ content: 'Painel 2 não encontrado.', ephemeral: true });
      if (field === 'colors') {
        const [primary, secondary] = value.split(',').map(s => s.trim());
        painel2.branding.primaryColor = primary;
        painel2.branding.secondaryColor = secondary;
      } else if (field === 'name') {
        painel2.branding.serverName = value;
      } else {
        painel2.branding[field] = value;
      }
      config.markModified('ticketPanels');
      await config.save();
      await interaction.reply({ content: '✅ Branding do Painel 2 atualizado!', ephemeral: true });
      // Atualizar automaticamente a visualização após alteração
      setTimeout(() => {
        this.showPainel2Branding(interaction).catch(console.error);
      }, 1000);
      return;
    }
  },

  async showBrandingPanel(interaction) {
    const guildId = interaction.guildId;
    const config = await TicketManager.getGuildConfig(guildId);
    const painel1 = config.ticketPanels.find(p => p.panelId === 'painel1');
    const branding = painel1?.branding || config.branding || {};
    const embed = new EmbedBuilder()
      .setColor(branding.primaryColor || '#0099ff')
      .setTitle('🎨 Personalização do Painel de Tickets')
      .setDescription('Personalize o painel de abertura de tickets do seu servidor!')
      .addFields(
        { name: 'Nome do Servidor', value: branding.serverName || 'Não definido', inline: true },
        { name: 'Cor Primária', value: branding.primaryColor || 'Não definida', inline: true },
        { name: 'Cor Secundária', value: branding.secondaryColor || 'Não definida', inline: true },
        { name: 'Banner', value: branding.banner || 'Não definido', inline: false },
        { name: 'Thumbnail', value: branding.thumbnail || 'Não definido', inline: false },
        { name: 'Descrição', value: branding.description || 'Não definida', inline: false },
        { name: 'Rodapé', value: branding.footer || 'Não definido', inline: false }
      );
    if (branding.banner) embed.setImage(branding.banner);
    if (branding.thumbnail) embed.setThumbnail(branding.thumbnail);
    if (branding.footer) embed.setFooter({ text: branding.footer });
    
    // Botões de edição
    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('branding_edit_name').setLabel('Editar Nome').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('branding_edit_colors').setLabel('Editar Cores').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('branding_edit_banner').setLabel('Editar Banner').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('branding_edit_thumbnail').setLabel('Editar Thumbnail').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('branding_edit_description').setLabel('Editar Descrição').setStyle(ButtonStyle.Secondary)
    );
    
    // Botões de navegação e pré-visualização
    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('branding_edit_footer').setLabel('Editar Rodapé').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('branding_preview').setLabel('👁️ Pré-visualizar').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('setup_back').setLabel('⬅️ Voltar').setStyle(ButtonStyle.Secondary)
    );
    
    if (interaction.replied || interaction.deferred) {
      await interaction.editReply({ embeds: [embed], components: [row1, row2] });
    } else {
      await interaction.reply({ embeds: [embed], components: [row1, row2], ephemeral: true });
    }
  },

  async showBrandingModal(interaction, field, label, placeholder, paragraph, required = false) {
    const guildId = interaction.guildId;
    const config = await TicketManager.getGuildConfig(guildId);
    const painel1 = config.ticketPanels.find(p => p.panelId === 'painel1');
    // Criar painel1 se não existir
    if (!painel1) {
      if (!config.ticketPanels) config.ticketPanels = [];
      config.ticketPanels.push({
        panelId: 'painel1',
        name: 'Painel 1',
        categories: [], // Array de IDs
        branding: { ...config.branding }
      });
      await config.save();
    }
    const modal = new ModalBuilder()
      .setCustomId(`branding_modal_${field}`)
      .setTitle(`Editar ${label}`)
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('value')
            .setLabel(label)
            .setStyle(paragraph ? TextInputStyle.Paragraph : TextInputStyle.Short)
            .setPlaceholder(placeholder)
            .setRequired(required)
        )
      );
    await interaction.showModal(modal);
  },

  async showPainel2Panel(interaction) {
    const guildId = interaction.guildId;
    const config = await TicketManager.getGuildConfig(guildId);
    let painel2 = config.ticketPanels.find(p => p.panelId === 'painel2');
    if (!painel2) {
      painel2 = { panelId: 'painel2', name: 'Painel 2', categories: [], branding: { ...config.branding } };
      config.ticketPanels = [...(config.ticketPanels || []), painel2];
      await config.save();
    }
    const embed = new EmbedBuilder()
      .setColor(painel2.branding?.primaryColor || '#0099ff')
      .setTitle('⚙️ Configuração do Painel 2 de Tickets')
      .setDescription('Escolha quais categorias aparecerão no Painel 2.');
    if (painel2.categories.length === 0) {
      embed.addFields({ name: 'Nenhuma categoria selecionada', value: 'Clique em "Adicionar Categoria" para incluir.' });
    } else {
      for (const catId of painel2.categories) {
        const cat = config.ticketCategories[catId];
        if (cat) {
          embed.addFields({
            name: `${cat.emoji || '📁'} ${cat.name}`,
            value: cat.description || 'Sem descrição',
            inline: false
          });
        }
      }
    }
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('painel2_add_categoria').setLabel('➕ Adicionar Categoria').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('painel2_remover_categoria').setLabel('🗑️ Remover Categoria').setStyle(ButtonStyle.Danger).setDisabled(painel2.categories.length === 0),
      new ButtonBuilder().setCustomId('painel2_branding').setLabel('🎨 Branding Painel 2').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('setup_back').setLabel('⬅️ Voltar').setStyle(ButtonStyle.Secondary)
    );
    if (interaction.replied || interaction.deferred) {
      await interaction.editReply({ embeds: [embed], components: [row] });
    } else {
      await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    }
  },

  async showPainel2AddCategoria(interaction) {
    const guildId = interaction.guildId;
    const config = await TicketManager.getGuildConfig(guildId);
    const categories = config?.ticketCategories || {};
    const painel2 = config.ticketPanels.find(p => p.panelId === 'painel2');
    // Listar apenas categorias que não estão no painel2
    const options = Object.entries(categories)
      .filter(([id]) => !painel2.categories.includes(id))
      .map(([id, cat]) => ({
        label: `${cat.emoji || '📁'} ${cat.name}`,
        value: id,
        description: cat.description?.slice(0, 50) || undefined
      }));
    if (options.length === 0) {
      return interaction.reply({ content: 'Todas as categorias já estão no Painel 2.', ephemeral: true });
    }
    const select = new StringSelectMenuBuilder()
      .setCustomId('painel2_add_categoria_select')
      .setPlaceholder('Selecione a categoria para adicionar')
      .addOptions(options);
    const row = new ActionRowBuilder().addComponents(select);
    await interaction.reply({ content: 'Selecione a categoria para adicionar ao Painel 2:', components: [row], ephemeral: true });
  },

  async showPainel2RemoveCategoria(interaction) {
    const guildId = interaction.guildId;
    const config = await TicketManager.getGuildConfig(guildId);
    const categories = config?.ticketCategories || {};
    const painel2 = config.ticketPanels.find(p => p.panelId === 'painel2');
    const options = painel2.categories.map(id => ({
      label: categories[id]?.name || id,
      value: id,
      description: categories[id]?.description?.slice(0, 50) || undefined
    }));
    const select = new StringSelectMenuBuilder()
      .setCustomId('painel2_remove_categoria_select')
      .setPlaceholder('Selecione a categoria para remover')
      .addOptions(options);
    const row = new ActionRowBuilder().addComponents(select);
    await interaction.reply({ content: 'Selecione a categoria para remover do Painel 2:', components: [row], ephemeral: true });
  },

  async showPainel2Branding(interaction) {
    const guildId = interaction.guildId;
    const config = await TicketManager.getGuildConfig(guildId);
    let painel2 = config.ticketPanels.find(p => p.panelId === 'painel2');
    if (!painel2) return interaction.reply({ content: 'Painel 2 não encontrado.', ephemeral: true });
    const branding = painel2.branding || {};
    const embed = new EmbedBuilder()
      .setColor(branding.primaryColor || '#0099ff')
      .setTitle('🎨 Personalização do Painel 2')
      .setDescription('Personalize o Painel 2 de tickets do seu servidor!')
      .addFields(
        { name: 'Nome do Painel', value: branding.serverName || 'Não definido', inline: true },
        { name: 'Cor Primária', value: branding.primaryColor || 'Não definida', inline: true },
        { name: 'Cor Secundária', value: branding.secondaryColor || 'Não definida', inline: true },
        { name: 'Banner', value: branding.banner || 'Não definido', inline: false },
        { name: 'Thumbnail', value: branding.thumbnail || 'Não definido', inline: false },
        { name: 'Descrição', value: branding.description || 'Não definida', inline: false },
        { name: 'Rodapé', value: branding.footer || 'Não definido', inline: false }
      );
    if (branding.banner) embed.setImage(branding.banner);
    if (branding.thumbnail) embed.setThumbnail(branding.thumbnail);
    if (branding.footer) embed.setFooter({ text: branding.footer });
    
    // Botões de edição
    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('painel2_edit_name').setLabel('Editar Nome').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('painel2_edit_colors').setLabel('Editar Cores').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('painel2_edit_banner').setLabel('Editar Banner').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('painel2_edit_thumbnail').setLabel('Editar Thumbnail').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('painel2_edit_description').setLabel('Editar Descrição').setStyle(ButtonStyle.Secondary)
    );
    
    // Botões de navegação e pré-visualização
    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('painel2_edit_footer').setLabel('Editar Rodapé').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('painel2_preview').setLabel('👁️ Pré-visualizar').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('setup_config_painel2').setLabel('⬅️ Voltar').setStyle(ButtonStyle.Secondary)
    );
    
    if (interaction.replied || interaction.deferred) {
      await interaction.editReply({ embeds: [embed], components: [row1, row2] });
    } else {
      await interaction.reply({ embeds: [embed], components: [row1, row2], ephemeral: true });
    }
  },

  async showPainel2BrandingModal(interaction, field, label, placeholder, paragraph, required = false) {
    console.log('[DEBUG] Chamando showPainel2BrandingModal para', field, 'Tipo:', interaction.constructor.name, 'Tem showModal:', typeof interaction.showModal);
    if (typeof interaction.showModal !== 'function') {
      await interaction.reply({ content: '❌ Não é possível abrir o modal a partir desta interação. Clique diretamente no botão de edição.', ephemeral: true });
      return;
    }
    const modal = new ModalBuilder()
      .setCustomId(`painel2_edit_${field}`)
      .setTitle(`Editar ${label}`)
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('value')
            .setLabel(label)
            .setStyle(paragraph ? TextInputStyle.Paragraph : TextInputStyle.Short)
            .setPlaceholder(placeholder)
            .setRequired(required)
        )
      );
    await interaction.showModal(modal);
  },

  async showBrandingPreview(interaction) {
    const guildId = interaction.guildId;
    const config = await TicketManager.getGuildConfig(guildId);
    const painel1 = config.ticketPanels.find(p => p.panelId === 'painel1');
    const branding = painel1?.branding || config.branding || {};
    const categories = config?.ticketCategories || {};
    // Criar embed de pré-visualização do painel final
    const previewEmbed = new EmbedBuilder()
      .setColor(branding.primaryColor || '#0099ff')
      .setTitle(branding.serverName || 'Sistema de Tickets')
      .setDescription(branding.description || 'Clique nos botões abaixo para abrir um ticket.')
      .setTimestamp();
    if (branding.banner) previewEmbed.setImage(branding.banner);
    if (branding.thumbnail) previewEmbed.setThumbnail(branding.thumbnail);
    if (branding.footer) previewEmbed.setFooter({ text: branding.footer });
    // Criar botões para as categorias disponíveis
    const categoryButtons = [];
    const painel1Categories = painel1?.categories || [];
    for (const catId of painel1Categories) {
      const category = categories[catId];
      if (category && category.enabled) {
        categoryButtons.push(
          new ButtonBuilder()
            .setCustomId(`preview_${catId}`)
            .setLabel(`${category.emoji || '📁'} ${category.name}`)
            .setStyle(ButtonStyle.Primary)
        );
      }
    }
    // Organizar botões em rows (máximo 5 por row)
    const rows = [];
    for (let i = 0; i < categoryButtons.length; i += 5) {
      const row = new ActionRowBuilder().addComponents(categoryButtons.slice(i, i + 5));
      rows.push(row);
    }
    // Botão para voltar
    const backRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('setup_branding')
        .setLabel('⬅️ Voltar ao Editor')
        .setStyle(ButtonStyle.Secondary)
    );
    rows.push(backRow);
    const embed = new EmbedBuilder()
      .setColor('#00ff00')
      .setTitle('👁️ Pré-visualização do Painel Principal')
      .setDescription('Esta é como seu painel de tickets aparecerá para os usuários:');
    await interaction.reply({ 
      embeds: [embed, previewEmbed], 
      components: rows, 
      ephemeral: true 
    });
  },

  async showPainel2Preview(interaction) {
    const guildId = interaction.guildId;
    const config = await TicketManager.getGuildConfig(guildId);
    const painel2 = config.ticketPanels.find(p => p.panelId === 'painel2');
    if (!painel2) return interaction.reply({ content: 'Painel 2 não encontrado.', ephemeral: true });
    const branding = painel2.branding || {};
    const categories = config?.ticketCategories || {};
    // Criar embed de pré-visualização do painel final
    const previewEmbed = new EmbedBuilder()
      .setColor(branding.primaryColor || '#0099ff')
      .setTitle(branding.serverName || 'Painel 2 - Sistema de Tickets')
      .setDescription(branding.description || 'Clique nos botões abaixo para abrir um ticket.')
      .setTimestamp();
    if (branding.banner) previewEmbed.setImage(branding.banner);
    if (branding.thumbnail) previewEmbed.setThumbnail(branding.thumbnail);
    if (branding.footer) previewEmbed.setFooter({ text: branding.footer });
    // Criar botões para as categorias do painel 2
    const categoryButtons = [];
    for (const catId of painel2.categories) {
      const category = categories[catId];
      if (category && category.enabled) {
        categoryButtons.push(
          new ButtonBuilder()
            .setCustomId(`preview_painel2_${catId}`)
            .setLabel(`${category.emoji || '📁'} ${category.name}`)
            .setStyle(ButtonStyle.Primary)
        );
      }
    }
    // Organizar botões em rows (máximo 5 por row)
    const rows = [];
    for (let i = 0; i < categoryButtons.length; i += 5) {
      const row = new ActionRowBuilder().addComponents(categoryButtons.slice(i, i + 5));
      rows.push(row);
    }
    // Botão para voltar
    const backRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('setup_config_painel2')
        .setLabel('⬅️ Voltar ao Editor')
        .setStyle(ButtonStyle.Secondary)
    );
    rows.push(backRow);
    const embed = new EmbedBuilder()
      .setColor('#00ff00')
      .setTitle('👁️ Pré-visualização do Painel 2')
      .setDescription('Esta é como seu Painel 2 de tickets aparecerá para os usuários:');
    await interaction.reply({ 
      embeds: [embed, previewEmbed], 
      components: rows, 
      ephemeral: true 
    });
  },
};

function safeShowPanel(panelFn, interaction) {
  setTimeout(async () => {
    try {
      if (interaction.replied || interaction.deferred) {
        await panelFn({
          ...interaction,
          reply: (data) => interaction.followUp({ ...data, ephemeral: true }),
          update: (data) => interaction.followUp({ ...data, ephemeral: true })
        });
      } else {
        await panelFn(interaction);
      }
    } catch (e) { /* ignore */ }
  }, 1500);
} 