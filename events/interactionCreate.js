const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, UserSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, PermissionsBitField, ButtonBuilder, ButtonStyle } = require('discord.js');
const TicketManager = require('../utils/ticketManager.js');
const setupPanel = require('../commands/slash/admin/setup.js');
const setup = require('../commands/slash/admin/setup.js'); // Alias para facilitar

module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    try {
      // Comandos slash já são tratados no index.js
      if (interaction.isChatInputCommand()) return;

      // Integração do painel de configuração
      if ((interaction.isButton() || interaction.isStringSelectMenu() || interaction.isModalSubmit()) && (
        interaction.customId.startsWith('setup_') ||
        interaction.customId.startsWith('branding_') ||
        interaction.customId.startsWith('painel2_')
      )) {
        if (interaction.isModalSubmit()) {
          await setupPanel.handleModalSubmit(interaction);
        } else if (interaction.isStringSelectMenu()) {
          await setupPanel.handleSelect(interaction);
        } else {
          await setupPanel.handleComponent(interaction);
        }
        return;
      }

      // Selects de categoria
      if (interaction.isStringSelectMenu() && (interaction.customId === 'edit_categoria_select' || interaction.customId === 'remove_categoria_select')) {
        await setup.handleSelect(interaction);
        return;
      }

      // Modal de adicionar categoria
      if (interaction.isModalSubmit() && interaction.customId === 'modal_add_categoria') {
        await setup.handleModalSubmit(interaction);
        return;
      }

      // Modal de editar categoria
      if (interaction.isModalSubmit() && interaction.customId.startsWith('modal_edit_categoria_')) {
        await setup.handleEditCategoryModal(interaction);
        return;
      }

      // Botão de confirmação de remoção de categoria
      if (interaction.isButton() && interaction.customId.startsWith('confirm_remove_categoria_')) {
        const catId = interaction.customId.replace('confirm_remove_categoria_', '');
        await setup.handleRemoveCategory(interaction, catId);
        return;
      }

      // Interações de modais
      if (interaction.isModalSubmit()) {
        await handleModalSubmit(interaction);
        return;
      }

      // Interações de botões
      if (interaction.isButton()) {
        await handleButtonInteraction(interaction);
        return;
      }

      // Interações de menus
      if (interaction.isStringSelectMenu()) {
        await handleMenuInteraction(interaction);
        return;
      }

    } catch (error) {
      console.error('Erro no evento interactionCreate:', error);
      
      const errorMessage = {
        content: '❌ Ocorreu um erro ao processar esta interação!',
        ephemeral: true
      };

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(errorMessage);
      } else {
        await interaction.reply(errorMessage);
      }
    }
  }
};

async function handleButtonInteraction(interaction) {
  const { customId } = interaction;

  if (customId.startsWith('add_user_')) {
    const userId = customId.replace('add_user_', '');
    try {
      await TicketManager.addUserToTicket(interaction.channel, userId);
      await interaction.reply({ content: `<@${userId}> adicionado ao ticket!`, ephemeral: true });
      await TicketManager.sendTicketLog(interaction.guild, { channelId: interaction.channel.id, userId }, 'user_added', await TicketManager.getGuildConfig(interaction.guildId));
    } catch (e) {
      await interaction.reply({ content: `Erro ao adicionar: ${e.message}`, ephemeral: true });
    }
    return;
  }
  if (customId.startsWith('remove_user_')) {
    const userId = customId.replace('remove_user_', '');
    try {
      await TicketManager.removeUserFromTicket(interaction.channel, userId);
      await interaction.reply({ content: `<@${userId}> removido do ticket!`, ephemeral: true });
      await TicketManager.sendTicketLog(interaction.guild, { channelId: interaction.channel.id, userId }, 'user_removed', await TicketManager.getGuildConfig(interaction.guildId));
    } catch (e) {
      await interaction.reply({ content: `Erro ao remover: ${e.message}`, ephemeral: true });
    }
    return;
  }

  switch (customId) {
    case 'create_ticket':
      await handleCreateTicket(interaction);
      break;
    case 'close_ticket':
      await handleCloseTicket(interaction);
      break;
    case 'claim_ticket':
      await handleClaimTicket(interaction);
      break;
    case 'resolve_ticket':
      await handleResolveTicket(interaction);
      break;
    case 'delete_ticket':
      await handleDeleteTicket(interaction);
      break;
    case 'transfer_ticket':
      await handleTransferTicket(interaction);
      break;
    case 'manage_users':
      await handleManageUsers(interaction);
      break;
    case 'mention_user':
      await handleMentionUser(interaction);
      break;
    case 'mark_urgent':
      await handleMarkUrgent(interaction);
      break;
    case 'cancel_manage_user':
      await handleCancelManageUser(interaction);
      break;
    default:
      // Verificar se é um botão de adicionar/remover usuário
      if (customId.startsWith('add_user_')) {
        await handleAddUser(interaction, customId.replace('add_user_', ''));
      } else if (customId.startsWith('remove_user_')) {
        await handleRemoveUser(interaction, customId.replace('remove_user_', ''));
      } else {
        await interaction.reply({
          content: '❌ Botão não reconhecido.',
          ephemeral: true
        });
      }
  }
}

async function handleMenuInteraction(interaction) {
  const { customId, values } = interaction;

  switch (customId) {
    case 'ticket_type':
      await handleTicketTypeSelection(interaction, values[0]);
      break;
    case 'manage_user_select': {
      // Usuário selecionado, mostrar botões para adicionar/remover
      const userId = values[0];
      const user = await interaction.client.users.fetch(userId);
      
      const embed = new EmbedBuilder()
        .setColor('Blue')
        .setTitle('👥 Gerenciar Usuário')
        .setDescription(`O que deseja fazer com **${user.username}**?`)
        .setThumbnail(user.displayAvatarURL())
        .addFields(
          { name: 'Usuário', value: `${user.tag}`, inline: true },
          { name: 'ID', value: userId, inline: true }
        )
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`add_user_${userId}`)
          .setLabel('➕ Adicionar ao Ticket')
          .setStyle(ButtonStyle.Success)
          .setEmoji('➕'),
        new ButtonBuilder()
          .setCustomId(`remove_user_${userId}`)
          .setLabel('➖ Remover do Ticket')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('➖'),
        new ButtonBuilder()
          .setCustomId('cancel_manage_user')
          .setLabel('❌ Cancelar')
          .setStyle(ButtonStyle.Secondary)
      );

      await interaction.update({
        embeds: [embed],
        components: [row]
      });
      break;
    }
    case 'transfer_ticket_user_select': {
      const userId = values[0];
      const ticket = await TicketManager.getTicketByChannel(interaction.channel.id);
      if (!ticket) {
        await interaction.reply({ content: '❌ Ticket não encontrado.', ephemeral: true });
        return;
      }
      // Atualizar ticket
      ticket.assignedTo = userId;
      ticket.assignedAt = new Date();
      ticket.updatedAt = new Date();
      await ticket.save();
      // Renomear canal
      const tipo = ticket.type || 'ticket';
      const numero = ticket.ticketId ? ticket.ticketId.split('-')[1] : '';
      let nomeResponsavel = userId;
      try {
        const user = await interaction.client.users.fetch(userId);
        nomeResponsavel = user.username.replace(/\s+/g, '').toLowerCase();
      } catch {}
      let newName = `${tipo}-${nomeResponsavel}-${numero}`.toLowerCase().slice(0, 100);
      if (ticket.priority === 'urgent') {
        newName = `URG-${tipo}-${nomeResponsavel}-${numero}`.toLowerCase().slice(0, 100);
      }
      if (interaction.channel.name !== newName) {
        await interaction.channel.setName(newName).catch(() => {});
      }
      // Atualizar embed
      const guildConfig = await TicketManager.getGuildConfig(interaction.guildId);
      await TicketManager.updateTicketMessage(interaction.channel, ticket, guildConfig);
      // Mensagem de confirmação
      const embed = new EmbedBuilder()
        .setColor('Blue')
        .setTitle('🔄 Ticket Transferido')
        .setDescription(`Ticket transferido para <@${userId}>`)
        .addFields(
          { name: 'Novo Responsável', value: `<@${userId}>`, inline: true },
          { name: 'Transferido por', value: interaction.user.tag, inline: true }
        )
        .setTimestamp();
      await interaction.update({
        content: null,
        embeds: [embed],
        components: []
      });
      break;
    }
    case 'manage_users_user_select': {
      const userId = values[0];
      const user = await interaction.client.users.fetch(userId);
      const embed = new EmbedBuilder()
        .setColor('Blue')
        .setTitle('👥 Gerenciar Usuário')
        .setDescription(`O que deseja fazer com **${user.username}**?`)
        .setThumbnail(user.displayAvatarURL())
        .addFields(
          { name: 'Usuário', value: `${user.tag}`, inline: true },
          { name: 'ID', value: userId, inline: true }
        )
        .setTimestamp();
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`add_user_${userId}`)
          .setLabel('➕ Adicionar ao Ticket')
          .setStyle(ButtonStyle.Success)
          .setEmoji('➕'),
        new ButtonBuilder()
          .setCustomId(`remove_user_${userId}`)
          .setLabel('➖ Remover do Ticket')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('➖'),
        new ButtonBuilder()
          .setCustomId('cancel_manage_user')
          .setLabel('❌ Cancelar')
          .setStyle(ButtonStyle.Secondary)
      );
      await interaction.update({
        embeds: [embed],
        components: [row]
      });
      break;
    }
    default:
      await interaction.reply({
        content: '❌ Menu não reconhecido.',
        ephemeral: true
      });
  }
}

async function handleCreateTicket(interaction) {
  try {
    // Verificar se o sistema está configurado
    const guildConfig = await TicketManager.getGuildConfig(interaction.guildId);
    
    if (!guildConfig || !guildConfig.ticketSettings.enabled) {
      return interaction.reply({
        content: '❌ Sistema de tickets não está configurado.',
        ephemeral: true
      });
    }

    // Verificar se o usuário já tem tickets abertos
    const userTickets = await TicketManager.getUserTickets(interaction.user.id, interaction.guildId);
    const maxTickets = guildConfig.ticketSettings.maxTicketsPerUser || 1;

    if (userTickets.length >= maxTickets) {
      return interaction.reply({
        content: `❌ Você já tem ${userTickets.length} ticket(s) aberto(s). Máximo permitido: ${maxTickets}`,
        ephemeral: true
      });
    }

    // Criar menu de seleção de tipo
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('ticket_type')
      .setPlaceholder('Escolha o tipo de ticket')
      .addOptions([
        {
          label: 'Denúncia',
          description: 'Denunciar um jogador',
          value: 'denuncia',
          emoji: '📛'
        },
        {
          label: 'Denúncia Staff',
          description: 'Denunciar um membro da staff',
          value: 'denuncia_staff',
          emoji: '⚠️'
        },
        {
          label: 'Facções',
          description: 'Assumir facções/organizações',
          value: 'faccoes',
          emoji: '💀'
        },
        {
          label: 'Bugs',
          description: 'Reportar problemas na cidade',
          value: 'bugs',
          emoji: '🐌'
        },
        {
          label: 'Corregedoria',
          description: 'Assuntos da corregedoria',
          value: 'corregedoria',
          emoji: '🕵️'
        },
        {
          label: 'Vips',
          description: 'Problemas relacionados a VIPs',
          value: 'vips',
          emoji: '💰'
        },
        {
          label: 'Imobiliária',
          description: 'Dúvidas sobre propriedades',
          value: 'imobiliaria',
          emoji: '🏘️'
        }
      ]);

    const row = new ActionRowBuilder().addComponents(selectMenu);

    await interaction.reply({
      content: '🎫 Escolha o tipo de ticket que deseja abrir:',
      components: [row],
      ephemeral: true
    });

  } catch (error) {
    console.error('Erro ao criar ticket:', error);
    await interaction.reply({
      content: '❌ Erro ao criar ticket.',
      ephemeral: true
    });
  }
}

async function handleTicketTypeSelection(interaction, ticketType) {
  try {
    // Verificar se o tipo de ticket é válido
    if (!TicketManager.ticketTypes[ticketType]) {
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('Red')
            .setDescription('❌ | Tipo de ticket inválido!')
        ],
        ephemeral: true
      });
      return;
    }

    // Defer reply para dar tempo de processar
    await interaction.deferReply({ ephemeral: true });

    // Preparar dados do ticket
    const ticketData = {
      userId: interaction.user.id,
      guildId: interaction.guildId,
      type: ticketType,
      userInfo: {
        username: interaction.user.username,
        tag: interaction.user.tag,
        avatar: interaction.user.displayAvatarURL()
      }
    };

    // Criar ticket
    const ticket = await TicketManager.createTicket(ticketData, interaction.client);

    // Responder com o resultado
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor('Green')
          .setDescription(`✅ Ticket criado com sucesso!\n🎫 ID: ${ticket.ticketId}\n📝 Tipo: ${TicketManager.ticketTypes[ticketType].name}\n🔗 Canal: <#${ticket.channelId}>`)
      ]
    });

  } catch (error) {
    console.error('Erro ao selecionar tipo de ticket:', error);
    
    const errorMessage = {
      embeds: [
        new EmbedBuilder()
          .setColor('Red')
          .setDescription(`❌ Erro ao criar ticket: ${error.message}`)
      ],
      ephemeral: true
    };

    if (interaction.replied || interaction.deferred) {
      await interaction.editReply(errorMessage);
    } else {
      await interaction.reply(errorMessage);
    }
  }
}

async function handleCloseTicket(interaction) {
  try {
    const channel = interaction.channel;
    const guildConfig = await TicketManager.getGuildConfig(interaction.guildId);

    // Permissão: só staff se configurado
    const onlyStaff = guildConfig.ticketSettings.closeByStaffOnly;
    const supportRoles = Array.isArray(guildConfig.ticketSettings.supportRoleIds) ? guildConfig.ticketSettings.supportRoleIds : [guildConfig.ticketSettings.supportRoleIds].filter(Boolean);
    const isStaff = interaction.member.roles.cache.hasAny(...supportRoles);
    if (onlyStaff && !isStaff) {
      return interaction.reply({
        content: '❌ Apenas a staff pode fechar tickets neste servidor.',
        ephemeral: true
      });
    }

    await interaction.deferReply();

    // Fechar ticket - passar o client
    await TicketManager.closeTicket(channel.id, interaction.user.id, interaction.client);

    const embed = new EmbedBuilder()
      .setColor('Yellow')
      .setDescription('🔒 Ticket fechado com sucesso!')
      .setFooter({ text: `Fechado por ${interaction.user.tag}` })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });

    // Deletar canal após 5 segundos
    setTimeout(async () => {
      try {
        await channel.delete();
      } catch (error) {
        console.error('Erro ao deletar canal:', error);
      }
    }, 5000);

  } catch (error) {
    console.error('Erro ao fechar ticket:', error);
    
    const errorMessage = {
      content: '❌ Erro ao fechar ticket.',
      ephemeral: true
    };

    if (interaction.replied || interaction.deferred) {
      await interaction.editReply(errorMessage);
    } else {
      await interaction.reply(errorMessage);
    }
  }
}

async function handleClaimTicket(interaction) {
  try {
    const channel = interaction.channel;
    const TicketManager = require('../utils/ticketManager.js');
    const ticket = await TicketManager.getTicketByChannel(channel.id);
    const guildConfig = await TicketManager.getGuildConfig(interaction.guildId);

    // Verificar permissões
    const supportRoles = Array.isArray(guildConfig.ticketSettings.supportRoleIds) ? guildConfig.ticketSettings.supportRoleIds : [guildConfig.ticketSettings.supportRoleIds].filter(Boolean);
    if (!interaction.member.roles.cache.hasAny(...supportRoles)) {
      return interaction.reply({
        content: '❌ Você não tem permissão para assumir tickets.',
        ephemeral: true
      });
    }

    await interaction.deferReply();

    // Assumir ticket
    await TicketManager.assignTicket(channel.id, interaction.user.id);

    // Renomear canal ao assumir
    if (ticket) {
      const tipo = ticket.type || 'ticket';
      const numero = ticket.ticketId ? ticket.ticketId.split('-')[1] : '';
      const nomeAssumiu = interaction.user.username.replace(/\s+/g, '').toLowerCase();
      let newName = `${tipo}-${nomeAssumiu}-${numero}`.toLowerCase().slice(0, 100);
      if (ticket.priority === 'urgent') {
        newName = `URG-${tipo}-${nomeAssumiu}-${numero}`.toLowerCase().slice(0, 100);
      }
      if (channel.name !== newName) {
        await channel.setName(newName).catch(() => {});
      }
    }

    // Atualizar embed
    const updatedTicket = await TicketManager.getTicketByChannel(channel.id);
    await TicketManager.updateTicketMessage(channel, updatedTicket, guildConfig);

    const embed = new EmbedBuilder()
      .setColor('Blue')
      .setDescription(`👤 Ticket assumido por ${interaction.user}`)
      .setFooter({ text: `Assumido por ${interaction.user.tag}` })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });

  } catch (error) {
    console.error('Erro ao assumir ticket:', error);
    const errorMessage = {
      content: '❌ Erro ao assumir ticket.',
      ephemeral: true
    };
    if (interaction.replied || interaction.deferred) {
      await interaction.editReply(errorMessage);
    } else {
      await interaction.reply(errorMessage);
    }
  }
}

async function handleResolveTicket(interaction) {
  try {
    const channel = interaction.channel;
    const guildConfig = await TicketManager.getGuildConfig(interaction.guildId);

    // Verificar permissões
    const supportRoles = Array.isArray(guildConfig.ticketSettings.supportRoleIds) ? guildConfig.ticketSettings.supportRoleIds : [guildConfig.ticketSettings.supportRoleIds].filter(Boolean);
    if (!interaction.member.roles.cache.hasAny(...supportRoles)) {
      return interaction.reply({
        content: '❌ Você não tem permissão para resolver tickets.',
        ephemeral: true
      });
    }

    await interaction.deferReply();

    // Resolver ticket - passar o client
    await TicketManager.resolveTicket(channel.id, interaction.user.id, interaction.client);

    const embed = new EmbedBuilder()
      .setColor('Green')
      .setDescription('✅ Ticket resolvido com sucesso!')
      .setFooter({ text: `Resolvido por ${interaction.user.tag}` })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });

    // Deletar canal após 10 segundos
    setTimeout(async () => {
      try {
        await channel.delete();
      } catch (error) {
        console.error('Erro ao deletar canal:', error);
      }
    }, 10000);

  } catch (error) {
    console.error('Erro ao resolver ticket:', error);
    
    const errorMessage = {
      content: '❌ Erro ao resolver ticket.',
      ephemeral: true
    };

    if (interaction.replied || interaction.deferred) {
      await interaction.editReply(errorMessage);
    } else {
      await interaction.reply(errorMessage);
    }
  }
}

async function handleDeleteTicket(interaction) {
  try {
    const channel = interaction.channel;
    const guildConfig = await TicketManager.getGuildConfig(interaction.guildId);

    // Verificar permissões
    const supportRoles = Array.isArray(guildConfig.ticketSettings.supportRoleIds) ? guildConfig.ticketSettings.supportRoleIds : [guildConfig.ticketSettings.supportRoleIds].filter(Boolean);
    if (!interaction.member.roles.cache.hasAny(...supportRoles)) {
      return interaction.reply({
        content: '❌ Você não tem permissão para deletar tickets.',
        ephemeral: true
      });
    }

    await interaction.deferReply();

    // Deletar ticket - passar o client
    await TicketManager.deleteTicket(channel.id, interaction.user.id, interaction.client);

    const embed = new EmbedBuilder()
      .setColor('Red')
      .setDescription('🗑️ Ticket deletado com sucesso!')
      .setFooter({ text: `Deletado por ${interaction.user.tag}` })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });

    // Deletar canal após 3 segundos
    setTimeout(async () => {
      try {
        await channel.delete();
      } catch (error) {
        console.error('Erro ao deletar canal:', error);
      }
    }, 3000);

  } catch (error) {
    console.error('Erro ao deletar ticket:', error);
    
    const errorMessage = {
      content: '❌ Erro ao deletar ticket.',
      ephemeral: true
    };

    if (interaction.replied || interaction.deferred) {
      await interaction.editReply(errorMessage);
    } else {
      await interaction.reply(errorMessage);
    }
  }
}

// Handler para transferir ticket
async function handleTransferTicket(interaction) {
  try {
    // Verificar permissões
    const guildConfig = await TicketManager.getGuildConfig(interaction.guildId);
    const supportRoles = Array.isArray(guildConfig.ticketSettings.supportRoleIds) ? guildConfig.ticketSettings.supportRoleIds : [guildConfig.ticketSettings.supportRoleIds].filter(Boolean);
    
    if (!interaction.member.roles.cache.hasAny(...supportRoles)) {
      return interaction.reply({
        content: '❌ Você não tem permissão para transferir tickets.',
        ephemeral: true
      });
    }

    // Select menu de usuário
    const userSelect = new UserSelectMenuBuilder()
      .setCustomId('transfer_ticket_user_select')
      .setPlaceholder('Selecione o novo responsável pelo ticket')
      .setMinValues(1)
      .setMaxValues(1);

    const row = new ActionRowBuilder().addComponents(userSelect);

    await interaction.reply({
      content: 'Selecione o novo responsável pelo ticket:',
      components: [row],
      ephemeral: true
    });
  } catch (error) {
    console.error('Erro ao abrir select de transferência:', error);
    await interaction.reply({
      content: '❌ Erro ao abrir select de transferência.',
      ephemeral: true
    });
  }
}

// Handler para adicionar/remover usuários
async function handleManageUsers(interaction) {
  try {
    // Verificar permissões
    const guildConfig = await TicketManager.getGuildConfig(interaction.guildId);
    const supportRoles = Array.isArray(guildConfig.ticketSettings.supportRoleIds) ? guildConfig.ticketSettings.supportRoleIds : [guildConfig.ticketSettings.supportRoleIds].filter(Boolean);
    
    if (!interaction.member.roles.cache.hasAny(...supportRoles)) {
      return interaction.reply({
        content: '❌ Você não tem permissão para gerenciar usuários.',
        ephemeral: true
      });
    }

    // Select menu de usuário
    const userSelect = new UserSelectMenuBuilder()
      .setCustomId('manage_users_user_select')
      .setPlaceholder('Selecione o usuário para adicionar/remover')
      .setMinValues(1)
      .setMaxValues(1);

    const row = new ActionRowBuilder().addComponents(userSelect);

    await interaction.reply({
      content: 'Selecione o usuário para adicionar ou remover do ticket:',
      components: [row],
      ephemeral: true
    });
  } catch (error) {
    console.error('Erro ao abrir select de gerenciamento de usuários:', error);
    await interaction.reply({
      content: '❌ Erro ao abrir select de gerenciamento de usuários.',
      ephemeral: true
    });
  }
}

// Handler para mencionar usuário (e enviar DM)
async function handleMentionUser(interaction) {
  const TicketManager = require('../utils/ticketManager.js');
  const ticket = await TicketManager.getTicketByChannel(interaction.channel.id);
  if (!ticket) {
    await interaction.reply({ content: '❌ Ticket não encontrado.', ephemeral: true });
    return;
  }
  // Mencionar no canal
  await interaction.channel.send({ content: `<@${ticket.userId}> você foi mencionado pela staff!` });
  // Enviar DM
  try {
    const user = await interaction.client.users.fetch(ticket.userId);
    await user.send(`Você foi mencionado no seu ticket: ${interaction.channel.toString()}!`);
  } catch (e) {
    // Ignorar erro de DM
  }
  await interaction.reply({ content: 'Usuário mencionado no canal e notificado por DM!', ephemeral: true });
}

// Handler para marcar como urgente
async function handleMarkUrgent(interaction) {
  const TicketManager = require('../utils/ticketManager.js');
  const ticket = await TicketManager.getTicketByChannel(interaction.channel.id);
  if (!ticket) {
    await interaction.reply({ content: '❌ Ticket não encontrado.', ephemeral: true });
    return;
  }
  ticket.priority = 'urgent';
  await ticket.save();
  // Renomear canal para URG-{categoria}-{numero}
  const tipo = ticket.type || 'ticket';
  const numero = ticket.ticketId ? ticket.ticketId.split('-')[1] : '';
  const newName = `URG-${tipo}-${numero}`.toLowerCase().slice(0, 100);
  if (interaction.channel.name !== newName) {
    await interaction.channel.setName(newName).catch(() => {});
  }
  // Atualizar embed do ticket
  const guildConfig = await TicketManager.getGuildConfig(interaction.guildId);
  await TicketManager.updateTicketMessage(interaction.channel, ticket, guildConfig);
  await interaction.reply({ content: 'Ticket marcado como urgente!', ephemeral: true });
}

// Modal submit handler
async function handleModalSubmit(interaction) {
  try {
    const { customId } = interaction;

    if (customId === 'modal_transfer_ticket') {
      await handleTransferTicketSubmit(interaction);
    } else if (customId === 'modal_manage_users_search') {
      await handleManageUsersSearchSubmit(interaction);
    } else {
      await interaction.reply({
        content: '❌ Modal não reconhecido.',
        ephemeral: true
      });
    }
  } catch (error) {
    console.error('Erro ao processar modal:', error);
    await interaction.reply({
      content: '❌ Erro ao processar modal.',
      ephemeral: true
    });
  }
}

async function handleTransferTicketSubmit(interaction) {
  try {
    const newId = interaction.fields.getTextInputValue('transfer_user_id');
    const reason = interaction.fields.getTextInputValue('transfer_reason') || 'Não especificado';

    // Validar ID
    if (!/^\d{17,20}$/.test(newId)) {
      return interaction.reply({
        content: '❌ ID inválido. Digite um ID válido de usuário ou cargo.',
        ephemeral: true
      });
    }

    const ticket = await TicketManager.getTicketByChannel(interaction.channel.id);
    if (!ticket) {
      return interaction.reply({
        content: '❌ Ticket não encontrado.',
        ephemeral: true
      });
    }

    // Verificar se o usuário/cargo existe
    let targetName = newId;
    try {
      const user = await interaction.client.users.fetch(newId);
      if (user) {
        targetName = user.username;
      } else {
        const role = await interaction.guild.roles.fetch(newId);
        if (role) {
          targetName = role.name;
        }
      }
    } catch (error) {
      console.log('Usuário/cargo não encontrado, usando ID como nome');
    }

    // Atualizar ticket
    ticket.assignedTo = newId;
    ticket.assignedAt = new Date();
    ticket.updatedAt = new Date();
    await ticket.save();

    // Renomear canal para refletir novo responsável
    const tipo = ticket.type || 'ticket';
    const numero = ticket.ticketId ? ticket.ticketId.split('-')[1] : '';
    let nomeResponsavel = targetName.replace(/\s+/g, '').toLowerCase();
    let newName = `${tipo}-${nomeResponsavel}-${numero}`.toLowerCase().slice(0, 100);
    
    if (ticket.priority === 'urgent') {
      newName = `URG-${tipo}-${nomeResponsavel}-${numero}`.toLowerCase().slice(0, 100);
    }

    if (interaction.channel.name !== newName) {
      await interaction.channel.setName(newName).catch(() => {});
    }

    // Atualizar embed do ticket
    const guildConfig = await TicketManager.getGuildConfig(interaction.guildId);
    await TicketManager.updateTicketMessage(interaction.channel, ticket, guildConfig);

    // Enviar mensagem de confirmação
    const embed = new EmbedBuilder()
      .setColor('Blue')
      .setTitle('🔄 Ticket Transferido')
      .setDescription(`Ticket transferido para <@${newId}>`)
      .addFields(
        { name: 'Responsável Anterior', value: ticket.assignedTo ? `<@${ticket.assignedTo}>` : 'Ninguém', inline: true },
        { name: 'Novo Responsável', value: `<@${newId}>`, inline: true },
        { name: 'Transferido por', value: interaction.user.tag, inline: true },
        { name: 'Motivo', value: reason, inline: false }
      )
      .setTimestamp();

    await interaction.channel.send({ embeds: [embed] });
    await interaction.reply({
      content: `✅ Ticket transferido com sucesso para <@${newId}>!`,
      ephemeral: true
    });

  } catch (error) {
    console.error('Erro ao transferir ticket:', error);
    await interaction.reply({
      content: '❌ Erro ao transferir ticket.',
      ephemeral: true
    });
  }
}

async function handleManageUsersSearchSubmit(interaction) {
  try {
    const query = interaction.fields.getTextInputValue('user_search_term');
    
    await interaction.deferReply({ ephemeral: true });

    // Buscar membros do servidor
    const members = await interaction.guild.members.search({
      query: query,
      limit: 10
    });

    if (!members.size) {
      await interaction.editReply({
        content: '❌ Nenhum usuário encontrado com esse termo.',
        ephemeral: true
      });
      return;
    }

    // Montar select menu com os resultados
    const options = members.map(member => ({
      label: `${member.user.username}`,
      description: `${member.user.tag} - ${member.displayName}`,
      value: member.id
    })).slice(0, 25);

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('manage_user_select')
      .setPlaceholder('Selecione o usuário para adicionar ou remover do ticket:')
      .addOptions(options);

    const row = new ActionRowBuilder().addComponents(selectMenu);

    await interaction.editReply({
      content: `🔍 Encontrados ${options.length} usuário(s). Selecione um para adicionar ou remover do ticket:`,
      components: [row],
      ephemeral: true
    });

  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    await interaction.editReply({
      content: '❌ Erro ao buscar usuários.',
      ephemeral: true
    });
  }
}

async function handleCancelManageUser(interaction) {
  try {
    const embed = new EmbedBuilder()
      .setColor('Gray')
      .setTitle('❌ Operação Cancelada')
      .setDescription('Gerenciamento de usuário cancelado.')
      .setTimestamp();

    await interaction.update({
      embeds: [embed],
      components: []
    });
  } catch (error) {
    console.error('Erro ao cancelar gerenciamento de usuário:', error);
    await interaction.reply({
      content: '❌ Erro ao cancelar operação.',
      ephemeral: true
    });
  }
}

async function handleAddUser(interaction, userId) {
  try {
    const user = await interaction.client.users.fetch(userId);
    const channel = interaction.channel;

    // Verificar se o usuário já está no canal
    const member = await interaction.guild.members.fetch(userId);
    if (channel.permissionsFor(member).has('ViewChannel')) {
      await interaction.update({
        content: `❌ **${user.username}** já tem acesso ao ticket.`,
        embeds: [],
        components: []
      });
      return;
    }

    // Adicionar usuário ao canal
    await channel.permissionOverwrites.create(member, {
      ViewChannel: true,
      SendMessages: true,
      ReadMessageHistory: true
    });

    const embed = new EmbedBuilder()
      .setColor('Green')
      .setTitle('✅ Usuário Adicionado')
      .setDescription(`**${user.username}** foi adicionado ao ticket!`)
      .setThumbnail(user.displayAvatarURL())
      .addFields(
        { name: 'Usuário', value: `${user.tag}`, inline: true },
        { name: 'Adicionado por', value: interaction.user.tag, inline: true }
      )
      .setTimestamp();

    // Enviar mensagem no canal
    await channel.send({ embeds: [embed] });

    // Atualizar a interação
    await interaction.update({
      content: `✅ **${user.username}** foi adicionado ao ticket!`,
      embeds: [],
      components: []
    });

    // Enviar log
    const ticket = await TicketManager.getTicketByChannel(channel.id);
    if (ticket) {
      const guildConfig = await TicketManager.getGuildConfig(interaction.guildId);
      await TicketManager.sendTicketLog(interaction.guild, ticket, 'user_added', guildConfig);
    }

  } catch (error) {
    console.error('Erro ao adicionar usuário:', error);
    await interaction.update({
      content: '❌ Erro ao adicionar usuário ao ticket.',
      embeds: [],
      components: []
    });
  }
}

async function handleRemoveUser(interaction, userId) {
  try {
    const user = await interaction.client.users.fetch(userId);
    const channel = interaction.channel;

    // Verificar se é o criador do ticket
    const ticket = await TicketManager.getTicketByChannel(channel.id);
    if (ticket && ticket.userId === userId) {
      await interaction.update({
        content: `❌ Não é possível remover o criador do ticket (**${user.username}**).`,
        embeds: [],
        components: []
      });
      return;
    }

    // Verificar se o usuário está no canal
    const member = await interaction.guild.members.fetch(userId);
    if (!channel.permissionsFor(member).has('ViewChannel')) {
      await interaction.update({
        content: `❌ **${user.username}** não tem acesso ao ticket.`,
        embeds: [],
        components: []
      });
      return;
    }

    // Remover usuário do canal
    await channel.permissionOverwrites.delete(member);

    const embed = new EmbedBuilder()
      .setColor('Red')
      .setTitle('❌ Usuário Removido')
      .setDescription(`**${user.username}** foi removido do ticket!`)
      .setThumbnail(user.displayAvatarURL())
      .addFields(
        { name: 'Usuário', value: `${user.tag}`, inline: true },
        { name: 'Removido por', value: interaction.user.tag, inline: true }
      )
      .setTimestamp();

    // Enviar mensagem no canal
    await channel.send({ embeds: [embed] });

    // Atualizar a interação
    await interaction.update({
      content: `❌ **${user.username}** foi removido do ticket!`,
      embeds: [],
      components: []
    });

    // Enviar log
    if (ticket) {
      const guildConfig = await TicketManager.getGuildConfig(interaction.guildId);
      await TicketManager.sendTicketLog(interaction.guild, ticket, 'user_removed', guildConfig);
    }

  } catch (error) {
    console.error('Erro ao remover usuário:', error);
    await interaction.update({
      content: '❌ Erro ao remover usuário do ticket.',
      embeds: [],
      components: []
    });
  }
}
