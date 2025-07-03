const { EmbedBuilder, ActionRowBuilder, ChannelType, PermissionsBitField, ButtonBuilder, ButtonStyle } = require('discord.js');
const Ticket = require('../models/Ticket.js');
const Guild = require('../models/Guild.js');
const moment = require('moment');
require('moment/locale/pt-br');
const discordTranscripts = require('discord-html-transcripts');

class TicketManager {
  constructor() {
    // Remover qualquer enum ou lista fixa de tipos de ticket
  }

  // ===== CATEGORIAS PADRÃO =====

  getDefaultCategories() {
    return {
      denuncia: {
        enabled: true,
        name: 'Denúncia',
        description: 'Denunciar um jogador por quebra de regras',
        emoji: '📛',
        staffOnly: false
      },
      suporte: {
        enabled: true,
        name: 'Suporte',
        description: 'Dúvidas gerais e suporte técnico',
        emoji: '🎫',
        staffOnly: false
      },
      bugs: {
        enabled: true,
        name: 'Relatar Bugs',
        description: 'Reportar problemas e bugs encontrados',
        emoji: '🐛',
        staffOnly: false
      },
      banimento: {
        enabled: true,
        name: 'Recorrer Banimento',
        description: 'Solicitar revisão de banimento',
        emoji: '⚖️',
        staffOnly: false
      }
    };
  }

  // ===== CONFIGURAÇÕES DE SERVIDOR =====

  async getGuildConfig(guildId, client = null) {
    try {
      if (!guildId) {
        console.error('❌ guildId não fornecido para getGuildConfig');
        return null;
      }

      console.log(`🔍 Buscando configuração para servidor: ${guildId}`);
      
      let config = await Guild.findOne({ guildId });
      
      if (!config) {
        console.log(`📝 Configuração não encontrada para ${guildId}, criando padrão...`);
        let guildName = 'Servidor Desconhecido';
        // Tentar obter o nome real do servidor
        try {
          if (!client) {
            const { client: indexClient } = require('../index.js');
            client = indexClient;
          }
          if (client && client.guilds) {
            const guildObj = client.guilds.cache.get(guildId);
            if (guildObj) {
              guildName = guildObj.name;
            }
          }
        } catch (e) {
          console.log('⚠️ Não foi possível obter o nome real do servidor:', e.message);
        }
        // Criar configuração padrão se não existir
        config = new Guild({
          guildId,
          name: guildName,
          ticketSettings: {
            enabled: false,
            categoryId: null,
            supportRoleIds: [],
            logsChannelId: null,
            maxTicketsPerUser: 1,
            autoCloseAfter: 24,
            requireReason: false
          },
          messages: {
            welcome: 'Bem-vindo ao seu ticket! Aguarde um membro da staff.',
            close: 'Ticket fechado. Obrigado por usar nosso sistema!',
            resolve: 'Ticket resolvido com sucesso!',
            delete: 'Ticket deletado permanentemente.'
          },
          branding: {
            thumbnail: null,
            footer: 'Sistema de Tickets',
            color: '#0099ff'
          },
          ticketCategories: this.getDefaultCategories(),
          createdAt: new Date(),
          updatedAt: new Date()
        });
        await config.save();
        console.log(`✅ Configuração criada para servidor: ${guildId} (${guildName})`);
      } else {
        console.log(`✅ Configuração encontrada para servidor: ${guildId}`);
      }
      
      return config;
    } catch (error) {
      console.error('❌ Erro ao obter configuração do servidor:', error);
      return null;
    }
  }

  async getGuildName(guildId) {
    try {
      const guild = await this.getGuild(guildId);
      return guild ? guild.name : null;
    } catch (error) {
      console.error('Erro ao obter nome do servidor:', error);
      return null;
    }
  }

  async updateGuildConfig(guildId, updates) {
    try {
      if (!guildId) {
        console.error('❌ guildId não fornecido para updateGuildConfig');
        return null;
      }

      console.log(`🔄 Atualizando configuração para servidor: ${guildId}`);
      
      const result = await Guild.findOneAndUpdate(
        { guildId },
        { 
          $set: { 
            ...updates,
            updatedAt: new Date()
          }
        },
        { new: true, upsert: true }
      );
      
      console.log(`✅ Configuração atualizada para servidor: ${guildId}`);
      return result;
    } catch (error) {
      console.error('❌ Erro ao atualizar configuração do servidor:', error);
      return null;
    }
  }

  async resetGuildConfig(guildId) {
    try {
      if (!guildId) {
        console.error('❌ guildId não fornecido para resetGuildConfig');
        return false;
      }

      console.log(`🔄 Resetando configuração para servidor: ${guildId}`);
      
      await Guild.findOneAndDelete({ guildId });
      console.log(`✅ Configuração resetada para servidor: ${guildId}`);
      return true;
    } catch (error) {
      console.error('❌ Erro ao resetar configuração do servidor:', error);
      return false;
    }
  }

  // ===== VERIFICAÇÕES DE CANAIS E CARGOS =====

  async validateGuildSetup(guild) {
    if (!guild || !guild.id) {
      console.error('❌ Guild inválido para validação');
      return { valid: false, errors: ['Servidor inválido'], warnings: [] };
    }

    console.log(`🔍 Validando configuração do servidor: ${guild.id} (${guild.name})`);
    
    const config = await this.getGuildConfig(guild.id);
    const errors = [];
    const warnings = [];

    if (!config) {
      errors.push('Configuração do servidor não encontrada');
      return { valid: false, errors, warnings };
    }

    const settings = config.ticketSettings;

    // Verificar se o sistema está habilitado
    if (!settings.enabled) {
      warnings.push('Sistema de tickets está desabilitado');
    }

    // Verificar categoria
    if (settings.categoryId) {
      const category = guild.channels.cache.get(settings.categoryId);
      if (!category) {
        errors.push('Categoria de tickets não encontrada');
      } else if (category.type !== ChannelType.GuildCategory) {
        errors.push('Canal configurado não é uma categoria');
      } else {
        // Verificar permissões do bot na categoria
        const botMember = guild.members.me;
        if (!category.permissionsFor(botMember).has([
          PermissionsBitField.Flags.ManageChannels,
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.SendMessages
        ])) {
          errors.push('Bot não tem permissões suficientes na categoria');
        }
      }
    } else {
      errors.push('Categoria de tickets não configurada');
    }

    // Verificar cargo de suporte
    if (settings.supportRoleIds.length > 0) {
      const roles = settings.supportRoleIds.map(roleId => guild.roles.cache.get(roleId));
      if (roles.some(role => !role)) {
        errors.push('Cargo de suporte não encontrado');
      }
    } else {
      warnings.push('Cargo de suporte não configurado');
    }

    // Verificar canal de logs
    if (settings.logsChannelId) {
      const logsChannel = guild.channels.cache.get(settings.logsChannelId);
      if (!logsChannel) {
        errors.push('Canal de logs não encontrado');
      } else if (logsChannel.type !== ChannelType.GuildText) {
        errors.push('Canal de logs não é um canal de texto');
      } else {
        // Verificar permissões do bot no canal de logs
        const botMember = guild.members.me;
        if (!logsChannel.permissionsFor(botMember).has([
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.SendMessages,
          PermissionsBitField.Flags.EmbedLinks
        ])) {
          errors.push('Bot não tem permissões suficientes no canal de logs');
        }
      }
    } else {
      warnings.push('Canal de logs não configurado');
    }

    console.log(`📊 Validação concluída: ${errors.length} erros, ${warnings.length} avisos`);

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      config
    };
  }

  // ===== CRIAÇÃO DE TICKETS =====

  async createTicket(ticketData, client = null) {
    try {
      const { userId, guildId, type, userInfo } = ticketData;
      
      if (!guildId) {
        throw new Error('ID do servidor não fornecido');
      }

      console.log(`🎫 Criando ticket no servidor: ${guildId}`);
      
      // Verificar configuração do servidor
      const guildConfig = await this.getGuildConfig(guildId, client);
      if (!guildConfig || !guildConfig.ticketSettings.enabled) {
        throw new Error('Sistema de tickets não está configurado ou habilitado');
      }

      // Verificar se o usuário já tem tickets abertos
      const userTickets = await this.getUserTickets(userId, guildId);
      const maxTickets = guildConfig.ticketSettings.maxTicketsPerUser || 1;
      
      if (userTickets.length >= maxTickets) {
        throw new Error(`Você já tem ${userTickets.length} ticket(s) aberto(s). Máximo permitido: ${maxTickets}`);
      }

      // Verificar se o tipo é válido
      if (!this.ticketTypes[type]) {
        throw new Error('Tipo de ticket inválido');
      }

      // Obter o servidor
      const guild = await this.getGuild(guildId, client);
      if (!guild) {
        throw new Error('Servidor não encontrado');
      }

      // Validar configuração
      const validation = await this.validateGuildSetup(guild);
      if (!validation.valid) {
        throw new Error(`Configuração inválida: ${validation.errors.join(', ')}`);
      }

      const settings = guildConfig.ticketSettings;
      const ticketType = this.ticketTypes[type];

      // Gerar ID único do ticket
      const ticketId = await this.generateTicketId(guildId);

      // Criar canal do ticket
      const channel = await this.createTicketChannel(guild, ticketId, ticketType, settings, type, userId);

      // Criar registro no banco
      const ticket = new Ticket({
        ticketId,
        channelId: channel.id,
        guildId,
        userId,
        username: userInfo?.username || 'Desconhecido',
        type,
        category: settings.categoryId,
        status: 'open',
        userInfo,
        ticketInfo: {
          title: `${ticketType.emoji} ${ticketType.name} - ${ticketId}`,
          description: ticketType.description,
          color: ticketType.color
        },
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await ticket.save();

      // Enviar mensagem de boas-vindas
      await this.sendWelcomeMessage(channel, ticket, guildConfig);

      // Enviar log
      await this.sendTicketLog(guild, ticket, 'created', guildConfig);

      console.log(`✅ Ticket criado: ${ticketId} no servidor ${guildId}`);
      return ticket;

    } catch (error) {
      console.error('❌ Erro ao criar ticket:', error);
      throw error;
    }
  }

  async createTicketChannel(guild, ticketId, ticketType, settings, ticketTypeKey, userId) {
    try {
      // Buscar categoria correta pelo tipo do ticket
      let categoryId = settings.categoryId;
      // Buscar configurações do banco para ticketCategories
      const guildDb = await Guild.findOne({ guildId: guild.id });
      if (guildDb && guildDb.ticketCategories && ticketTypeKey) {
        const catConfig = guildDb.ticketCategories[ticketTypeKey];
        if (catConfig && catConfig.discordCategoryId) {
          categoryId = catConfig.discordCategoryId;
        }
      }
      const category = guild.channels.cache.get(categoryId);
      if (!category) {
        throw new Error('Categoria de tickets não encontrada');
      }
      // Permissões para múltiplos cargos de suporte
      const supportRoles = Array.isArray(settings.supportRoleIds) ? settings.supportRoleIds : [settings.supportRoleIds].filter(Boolean);
      const permissionOverwrites = [
        {
          id: guild.id,
          deny: [PermissionsBitField.Flags.ViewChannel]
        },
        ...supportRoles.map(roleId => ({
          id: roleId,
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.ReadMessageHistory
          ]
        })),
        // Permissão para o autor do ticket
        userId ? {
          id: userId,
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.ReadMessageHistory
          ]
        } : null
      ].filter(Boolean);
      // Nome do canal: {tipo}-aguardando-{numero}
      const numero = ticketId.split('-')[1];
      const channelName = `${ticketTypeKey || 'ticket'}-aguardando-${numero}`.toLowerCase().slice(0, 100);
      // Criar canal
      const channel = await guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText,
        parent: category,
        permissionOverwrites
      });
      console.log(`[LOG] Canal criado para ticket ${ticketId} (autor: ${userId})`);
      return channel;
    } catch (error) {
      console.error('❌ Erro ao criar canal do ticket:', error);
      throw error;
    }
  }

  async sendWelcomeMessage(channel, ticket, guildConfig) {
    try {
      const settings = guildConfig.ticketSettings;
      const ticketType = this.ticketTypes[ticket.type];
      const welcomeMessage = guildConfig.messages.welcome.replace('{user}', `<@${ticket.userId}>`);

      const embed = this.buildTicketEmbed(ticket, guildConfig);

      const buttons = this.buildTicketButtons(ticket, guildConfig, null);

      const msg = await channel.send({ embeds: [embed], components: buttons });
      // Salvar o ID da mensagem principal do ticket
      ticket.metadata = ticket.metadata || new Map();
      ticket.metadata.set('mainMessageId', msg.id);
      await ticket.save();

    } catch (error) {
      console.error('❌ Erro ao enviar mensagem de boas-vindas:', error);
    }
  }

  buildTicketEmbed(ticket, guildConfig) {
    const ticketType = this.ticketTypes[ticket.type] || {};
    const embed = new EmbedBuilder()
      .setColor(ticket.priority === 'urgent' ? '#ff0000' : (ticketType.color || '#0099ff'))
      .setTitle(`${ticketType.emoji || '🎫'} ${ticketType.name || 'Ticket'}${ticket.priority === 'urgent' ? ' 🚨 URGENTE' : ''}`)
      .setDescription(guildConfig.messages.welcome.replace('{user}', `<@${ticket.userId}>`))
      .addFields(
        { name: '🎫 ID do Ticket', value: ticket.ticketId, inline: true },
        { name: '👤 Usuário', value: `<@${ticket.userId}>`, inline: true },
        { name: '👨‍💼 Responsável', value: ticket.assignedTo ? `<@${ticket.assignedTo}>` : 'Ninguém', inline: true },
        { name: '📅 Criado em', value: moment(ticket.createdAt).format('DD/MM/YYYY HH:mm'), inline: true },
        { name: '🔖 Prioridade', value: ticket.priority === 'urgent' ? '🚨 Urgente' : 'Normal', inline: true }
      )
      .setThumbnail(guildConfig.branding.thumbnail)
      .setFooter({ text: guildConfig.branding.footer })
      .setTimestamp();
    return embed;
  }

  async updateTicketMessage(channel, ticket, guildConfig) {
    try {
      if (!ticket.metadata || !ticket.metadata.get('mainMessageId')) return;
      const messageId = ticket.metadata.get('mainMessageId');
      const msg = await channel.messages.fetch(messageId).catch(() => null);
      if (!msg) return;
      const embed = this.buildTicketEmbed(ticket, guildConfig);
      await msg.edit({ embeds: [embed] });
    } catch (error) {
      console.error('❌ Erro ao atualizar embed do ticket:', error);
    }
  }

  // ===== GERENCIAMENTO DE TICKETS =====

  async closeTicket(channelId, closedBy, client = null) {
    try {
      const ticket = await this.getTicketByChannel(channelId);
      if (!ticket) {
        throw new Error('Ticket não encontrado');
      }

      ticket.status = 'closed';
      ticket.closedBy = closedBy;
      ticket.closedAt = new Date();
      ticket.updatedAt = new Date();

      // Gerar transcript
      let transcriptUrl = null;
      try {
        const channel = await this.getChannelById(ticket.guildId, ticket.channelId);
        if (channel) {
          console.log(`📄 Gerando transcript para ticket ${ticket.ticketId}...`);
          const attachment = await discordTranscripts.createTranscript(channel, {
            limit: -1,
            returnBuffer: false,
            fileName: `transcript-${ticket.ticketId}.html`
          });
          
          // Salvar transcript como attachment no canal de logs
          const guildConfig = await this.getGuildConfig(ticket.guildId);
          const logsChannelId = guildConfig.ticketSettings.logsChannelId;
          if (logsChannelId) {
            const guild = await this.getGuild(ticket.guildId, client);
            if (guild) {
              const logsChannel = guild.channels.cache.get(logsChannelId);
              if (logsChannel) {
                console.log(`📤 Enviando transcript para canal de logs...`);
                const sent = await logsChannel.send({
                  content: `📄 **Transcript do ticket ${ticket.ticketId}**`,
                  files: [attachment]
                });
                transcriptUrl = sent.attachments.first()?.url || null;
                console.log(`✅ Transcript enviado: ${transcriptUrl}`);
              } else {
                console.warn(`❌ Canal de logs não encontrado: ${logsChannelId}`);
              }
            } else {
              console.warn(`❌ Guild não encontrado para enviar transcript: ${ticket.guildId}`);
            }
          } else {
            console.warn(`❌ Canal de logs não configurado para servidor: ${ticket.guildId}`);
          }
          
          // Enviar por DM ao usuário
          try {
            const user = await channel.client.users.fetch(ticket.userId);
            await user.send({
              content: `📄 **Transcript do seu ticket ${ticket.ticketId}**\n\nAqui está o histórico completo da conversa:`,
              files: [attachment]
            });
            console.log(`✅ Transcript enviado por DM para usuário ${ticket.userId}`);
          } catch (e) {
            console.error('❌ Erro ao enviar transcript por DM:', e);
          }
        } else {
          console.warn(`❌ Canal não encontrado para gerar transcript: ${ticket.channelId}`);
        }
      } catch (e) {
        console.error('❌ Erro ao gerar transcript:', e);
      }
      
      ticket.transcriptUrl = transcriptUrl;
      await ticket.save();

      // Enviar log
      const guild = await this.getGuild(ticket.guildId, client);
      const guildConfig = await this.getGuildConfig(ticket.guildId);
      await this.sendTicketLog(guild, ticket, 'closed', guildConfig);

      console.log(`✅ Ticket fechado: ${ticket.ticketId}`);
      return ticket;

    } catch (error) {
      console.error('❌ Erro ao fechar ticket:', error);
      throw error;
    }
  }

  async resolveTicket(channelId, resolvedBy, client = null) {
    try {
      const ticket = await this.getTicketByChannel(channelId);
      if (!ticket) {
        throw new Error('Ticket não encontrado');
      }

      ticket.status = 'resolved';
      ticket.resolvedBy = resolvedBy;
      ticket.resolvedAt = new Date();
      ticket.updatedAt = new Date();

      await ticket.save();

      // Enviar log
      const guild = await this.getGuild(ticket.guildId, client);
      const guildConfig = await this.getGuildConfig(ticket.guildId);
      await this.sendTicketLog(guild, ticket, 'resolved', guildConfig);

      console.log(`✅ Ticket resolvido: ${ticket.ticketId}`);
      return ticket;

    } catch (error) {
      console.error('❌ Erro ao resolver ticket:', error);
      throw error;
    }
  }

  async assignTicket(channelId, assignedTo) {
    try {
      const ticket = await this.getTicketByChannel(channelId);
      if (!ticket) {
        throw new Error('Ticket não encontrado');
      }

      ticket.assignedTo = assignedTo;
      ticket.assignedAt = new Date();
      ticket.updatedAt = new Date();

      await ticket.save();

      console.log(`✅ Ticket atribuído: ${ticket.ticketId} para ${assignedTo}`);
      return ticket;

    } catch (error) {
      console.error('❌ Erro ao atribuir ticket:', error);
      throw error;
    }
  }

  async deleteTicket(channelId, deletedBy, client = null) {
    try {
      const ticket = await this.getTicketByChannel(channelId);
      if (!ticket) {
        throw new Error('Ticket não encontrado');
      }

      ticket.status = 'deleted';
      ticket.deletedBy = deletedBy;
      ticket.deletedAt = new Date();
      ticket.updatedAt = new Date();

      await ticket.save();

      // Enviar log
      const guild = await this.getGuild(ticket.guildId, client);
      const guildConfig = await this.getGuildConfig(ticket.guildId);
      await this.sendTicketLog(guild, ticket, 'deleted', guildConfig);

      console.log(`✅ Ticket deletado: ${ticket.ticketId}`);
      return ticket;

    } catch (error) {
      console.error('❌ Erro ao deletar ticket:', error);
      throw error;
    }
  }

  // ===== CONSULTAS =====

  async getTicketByChannel(channelId) {
    try {
      if (!channelId) {
        console.error('❌ channelId não fornecido para getTicketByChannel');
        return null;
      }

      const ticket = await Ticket.findOne({ channelId });
      if (ticket) {
        console.log(`✅ Ticket encontrado: ${ticket.ticketId} no canal ${channelId}`);
      } else {
        console.log(`❌ Ticket não encontrado para o canal: ${channelId}`);
      }
      return ticket;
    } catch (error) {
      console.error('❌ Erro ao buscar ticket por canal:', error);
      return null;
    }
  }

  async getUserTickets(userId, guildId) {
    try {
      if (!userId || !guildId) {
        console.error('❌ userId ou guildId não fornecidos para getUserTickets');
        return [];
      }

      const tickets = await Ticket.find({ 
        userId, 
        guildId, 
        status: { $in: ['open', 'assigned'] }
      });

      console.log(`📊 Encontrados ${tickets.length} tickets abertos para usuário ${userId} no servidor ${guildId}`);
      return tickets;
    } catch (error) {
      console.error('❌ Erro ao buscar tickets do usuário:', error);
      return [];
    }
  }

  async getGuildTickets(guildId, status = null) {
    try {
      if (!guildId) {
        console.error('❌ guildId não fornecido para getGuildTickets');
        return [];
      }

      const query = { guildId };
      if (status) {
        query.status = status;
      }

      const tickets = await Ticket.find(query).sort({ createdAt: -1 });
      console.log(`📊 Encontrados ${tickets.length} tickets para servidor ${guildId}${status ? ` com status ${status}` : ''}`);
      return tickets;
    } catch (error) {
      console.error('❌ Erro ao buscar tickets do servidor:', error);
      return [];
    }
  }

  // ===== ESTATÍSTICAS =====

  async getTicketStats(guildId, period = 'all') {
    try {
      if (!guildId) {
        console.error('❌ guildId não fornecido para getTicketStats');
        return {
          total: 0,
          open: 0,
          closed: 0,
          resolved: 0,
          created: 0,
          resolutionRate: '0.0',
          avgTime: 'N/A'
        };
      }

      console.log(`📊 Calculando estatísticas para servidor: ${guildId} (período: ${period})`);

      let dateFilter = {};
      
      switch (period) {
        case 'today':
          dateFilter = {
            createdAt: {
              $gte: moment().startOf('day').toDate(),
              $lte: moment().endOf('day').toDate()
            }
          };
          break;
        case 'week':
          dateFilter = {
            createdAt: {
              $gte: moment().startOf('week').toDate(),
              $lte: moment().endOf('week').toDate()
            }
          };
          break;
        case 'month':
          dateFilter = {
            createdAt: {
              $gte: moment().startOf('month').toDate(),
              $lte: moment().endOf('month').toDate()
            }
          };
          break;
      }

      const query = { guildId, ...dateFilter };
      
      const [
        total,
        open,
        closed,
        resolved,
        created,
        oldestTicket,
        newestTicket
      ] = await Promise.all([
        Ticket.countDocuments({ guildId }),
        Ticket.countDocuments({ guildId, status: 'open' }),
        Ticket.countDocuments({ guildId, status: 'closed' }),
        Ticket.countDocuments({ guildId, status: 'resolved' }),
        Ticket.countDocuments(query),
        Ticket.findOne({ guildId }).sort({ createdAt: 1 }),
        Ticket.findOne({ guildId }).sort({ createdAt: -1 })
      ]);

      const resolutionRate = total > 0 ? ((resolved / total) * 100).toFixed(1) : '0.0';

      // Calcular tempo médio de resolução
      const resolvedTickets = await Ticket.find({ 
        guildId, 
        status: 'resolved',
        resolvedAt: { $exists: true }
      });

      let avgTime = 'N/A';
      if (resolvedTickets.length > 0) {
        const totalTime = resolvedTickets.reduce((sum, ticket) => {
          return sum + (ticket.resolvedAt - ticket.createdAt);
        }, 0);
        const avgMs = totalTime / resolvedTickets.length;
        avgTime = moment.duration(avgMs).humanize();
      }

      const stats = {
        total,
        open,
        closed,
        resolved,
        created,
        resolutionRate,
        avgTime,
        oldestTicket: oldestTicket?.createdAt,
        newestTicket: newestTicket?.createdAt
      };

      console.log(`✅ Estatísticas calculadas para servidor ${guildId}:`, stats);
      return stats;

    } catch (error) {
      console.error('❌ Erro ao obter estatísticas:', error);
      return {
        total: 0,
        open: 0,
        closed: 0,
        resolved: 0,
        created: 0,
        resolutionRate: '0.0',
        avgTime: 'N/A'
      };
    }
  }

  // ===== UTILITÁRIOS =====

  async generateTicketId(guildId) {
    try {
      if (!guildId) {
        console.error('❌ guildId não fornecido para generateTicketId');
        return `TICKET-${Date.now()}`;
      }

      const lastTicket = await Ticket.findOne({ guildId })
        .sort({ ticketId: -1 })
        .select('ticketId');
      
      const lastNumber = lastTicket ? parseInt(lastTicket.ticketId.split('-')[1]) : 0;
      const newId = `TICKET-${String(lastNumber + 1).padStart(4, '0')}`;
      
      console.log(`🎫 ID gerado: ${newId} para servidor ${guildId}`);
      return newId;
    } catch (error) {
      console.error('❌ Erro ao gerar ID do ticket:', error);
      return `TICKET-${Date.now()}`;
    }
  }

  async getGuild(guildId, client = null) {
    try {
      if (!guildId) {
        console.error('❌ guildId não fornecido para getGuild');
        return null;
      }

      // Se não foi fornecido client, tentar importar
      if (!client) {
        try {
          // Tentar diferentes formas de obter o client
          let importedClient = null;
          
          // Método 1: Tentar importar do index.js
          try {
            const { client: indexClient } = require('../index.js');
            importedClient = indexClient;
          } catch (e) {
            console.log('⚠️ Não foi possível importar client do index.js');
          }
          
          // Método 2: Tentar obter do global se disponível
          if (!importedClient && global.client) {
            importedClient = global.client;
            console.log('✅ Client obtido do global');
          }
          
          // Método 3: Tentar obter do process se disponível
          if (!importedClient && process.client) {
            importedClient = process.client;
            console.log('✅ Client obtido do process');
          }
          
          client = importedClient;
        } catch (error) {
          console.error('❌ Não foi possível importar o client:', error);
          return null;
        }
      }

      if (!client || !client.guilds) {
        console.error('❌ Client não disponível ou não inicializado');
        console.log('🔍 Debug - Client:', client ? 'existe' : 'não existe');
        console.log('🔍 Debug - Client.guilds:', client?.guilds ? 'existe' : 'não existe');
        return null;
      }

      const guild = client.guilds.cache.get(guildId);
      
      if (guild) {
        console.log(`✅ Servidor encontrado: ${guild.name} (${guildId})`);
      } else {
        console.log(`❌ Servidor não encontrado: ${guildId}`);
        console.log(`🔍 Servidores disponíveis: ${client.guilds.cache.size}`);
        console.log(`🔍 IDs dos servidores: ${Array.from(client.guilds.cache.keys()).join(', ')}`);
      }
      
      return guild;
    } catch (error) {
      console.error('❌ Erro ao obter servidor:', error);
      return null;
    }
  }

  async sendTicketLog(guild, ticket, action, guildConfig) {
    try {
      console.log(`🔍 Tentando enviar log: ${action} para ticket ${ticket?.ticketId}`);
      console.log(`🔍 Guild: ${guild ? guild.name : 'null'} (${guild?.id})`);
      console.log(`🔍 GuildConfig: ${guildConfig ? 'existe' : 'null'}`);
      console.log(`🔍 LogsChannelId: ${guildConfig?.ticketSettings?.logsChannelId || 'não configurado'}`);

      if (!guild) {
        console.log('⚠️ Log não enviado: guild é null');
        return;
      }

      if (!guildConfig?.ticketSettings?.logsChannelId) {
        console.log('⚠️ Log não enviado: canal de logs não configurado');
        return;
      }

      const logsChannel = guild.channels.cache.get(guildConfig.ticketSettings.logsChannelId);
      if (!logsChannel) {
        console.warn(`❌ Canal de logs não encontrado: ${guildConfig.ticketSettings.logsChannelId}`);
        console.log(`🔍 Canais disponíveis no servidor: ${guild.channels.cache.size}`);
        console.log(`🔍 IDs dos canais: ${Array.from(guild.channels.cache.keys()).join(', ')}`);
        return;
      }

      console.log(`✅ Canal de logs encontrado: ${logsChannel.name} (${logsChannel.id})`);

      const ticketType = this.ticketTypes[ticket.type];
      const actionColors = {
        created: '#00ff00',
        closed: '#ffff00',
        resolved: '#00cc00',
        deleted: '#ff0000'
      };

      const actionTexts = {
        created: 'Criado',
        closed: 'Fechado',
        resolved: 'Resolvido',
        deleted: 'Deletado'
      };

      const embed = new EmbedBuilder()
        .setColor(actionColors[action] || guildConfig.branding.color || '#0099ff')
        .setTitle(`🎫 Ticket ${actionTexts[action]}`)
        .addFields(
          { name: 'ID', value: ticket.ticketId, inline: true },
          { name: 'Tipo', value: `${ticketType.emoji} ${ticketType.name}`, inline: true },
          { name: 'Usuário', value: `<@${ticket.userId}>`, inline: true },
          { name: 'Canal', value: `<#${ticket.channelId}>`, inline: true },
          { name: 'Status', value: ticket.status, inline: true },
          { name: 'Data', value: moment(ticket.updatedAt).format('DD/MM/YYYY HH:mm'), inline: true }
        )
        .setThumbnail(guildConfig.branding.thumbnail)
        .setFooter({ text: guildConfig.branding.footer })
        .setTimestamp();

      console.log(`📤 Enviando embed para canal de logs...`);
      await logsChannel.send({ embeds: [embed] });
      console.log(`📝 Log enviado: ${action} - ${ticket.ticketId}`);

    } catch (error) {
      console.error('❌ Erro ao enviar log do ticket:', error);
      console.error('🔍 Detalhes do erro:', {
        guild: guild?.name,
        guildId: guild?.id,
        ticketId: ticket?.ticketId,
        action: action,
        logsChannelId: guildConfig?.ticketSettings?.logsChannelId
      });
    }
  }

  // ===== MÉTODOS ADICIONAIS PARA BUSCA NO BANCO =====

  async getAllGuilds() {
    try {
      const guilds = await Guild.find({}).select('guildId name ticketSettings.enabled');
      console.log(`📊 Encontrados ${guilds.length} servidores configurados`);
      return guilds;
    } catch (error) {
      console.error('❌ Erro ao buscar todos os servidores:', error);
      return [];
    }
  }

  async getGuildById(guildId) {
    try {
      if (!guildId) {
        console.error('❌ guildId não fornecido para getGuildById');
        return null;
      }

      const guild = await Guild.findOne({ guildId });
      if (guild) {
        console.log(`✅ Servidor encontrado no banco: ${guild.name} (${guildId})`);
      } else {
        console.log(`❌ Servidor não encontrado no banco: ${guildId}`);
      }
      return guild;
    } catch (error) {
      console.error('❌ Erro ao buscar servidor no banco:', error);
      return null;
    }
  }

  async searchGuildsByName(name) {
    try {
      const guilds = await Guild.find({
        name: { $regex: name, $options: 'i' }
      }).select('guildId name ticketSettings.enabled');
      
      console.log(`🔍 Encontrados ${guilds.length} servidores com nome contendo "${name}"`);
      return guilds;
    } catch (error) {
      console.error('❌ Erro ao buscar servidores por nome:', error);
      return [];
    }
  }

  async getGuildStats(guildId) {
    try {
      if (!guildId) {
        console.error('❌ guildId não fornecido para getGuildStats');
        return null;
      }

      const [ticketCount, config] = await Promise.all([
        Ticket.countDocuments({ guildId }),
        this.getGuildConfig(guildId)
      ]);

      const stats = {
        guildId,
        name: config?.name || 'Servidor Desconhecido',
        totalTickets: ticketCount,
        isConfigured: !!config,
        isEnabled: config?.ticketSettings?.enabled || false,
        lastActivity: config?.updatedAt || null
      };

      console.log(`📊 Estatísticas do servidor ${guildId}:`, stats);
      return stats;
    } catch (error) {
      console.error('❌ Erro ao obter estatísticas do servidor:', error);
      return null;
    }
  }

  async updateGuildName(guildId, guildName) {
    try {
      if (!guildId || !guildName) {
        console.error('❌ guildId ou guildName não fornecidos para updateGuildName');
        return false;
      }

      console.log(`🔄 Atualizando nome do servidor: ${guildId} -> ${guildName}`);
      
      const result = await Guild.findOneAndUpdate(
        { guildId },
        { 
          $set: { 
            name: guildName,
            updatedAt: new Date()
          }
        },
        { new: true }
      );
      
      if (result) {
        console.log(`✅ Nome do servidor atualizado: ${guildName}`);
        return true;
      } else {
        console.log(`⚠️ Servidor não encontrado para atualizar nome: ${guildId}`);
        return false;
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar nome do servidor:', error);
      return false;
    }
  }

  buildTicketButtons(ticket, guildConfig, member) {
    // member: GuildMember que está visualizando (opcional, para lógica futura)
    const row1 = [];
    const row2 = [];
    row1.push(
      new ButtonBuilder()
        .setCustomId('claim_ticket')
        .setLabel('Assumir Ticket')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('👤'),
      new ButtonBuilder()
        .setCustomId('transfer_ticket')
        .setLabel('Transferir Ticket')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('🔄'),
      new ButtonBuilder()
        .setCustomId('manage_users')
        .setLabel('Adicionar/Remover Usuário')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('👥'),
      new ButtonBuilder()
        .setCustomId('mention_user')
        .setLabel('Mencionar Usuário')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🔔'),
      new ButtonBuilder()
        .setCustomId('mark_urgent')
        .setLabel('Marcar como Urgente')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('⚡')
    );
    // Botão de fechar ticket em uma segunda linha
    row2.push(
      new ButtonBuilder()
        .setCustomId('close_ticket')
        .setLabel('Fechar Ticket')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('🔒')
    );
    return [new ActionRowBuilder().addComponents(row1), new ActionRowBuilder().addComponents(row2)];
  }

  async getChannelById(guildId, channelId) {
    try {
      const guild = await this.getGuild(guildId);
      if (!guild) return null;
      return guild.channels.cache.get(channelId) || null;
    } catch {
      return null;
    }
  }

  async addUserToTicket(channel, userId) {
    try {
      await channel.permissionOverwrites.edit(userId, {
        ViewChannel: true,
        SendMessages: true,
        ReadMessageHistory: true
      });
      console.log(`[LOG] Usuário ${userId} adicionado ao ticket (canal ${channel.id})`);
      // Log no canal de logs se desejar
    } catch (e) {
      console.error(`[LOG] Erro ao adicionar usuário ao ticket:`, e);
    }
  }

  async removeUserFromTicket(channel, userId) {
    try {
      await channel.permissionOverwrites.edit(userId, {
        ViewChannel: false
      });
      console.log(`[LOG] Usuário ${userId} removido do ticket (canal ${channel.id})`);
      // Log no canal de logs se desejar
    } catch (e) {
      console.error(`[LOG] Erro ao remover usuário do ticket:`, e);
    }
  }
}

module.exports = new TicketManager();

