const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const TicketManager = require('../../../utils/ticketManager.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('servers')
    .setDescription('Gerencia servidores no banco de dados')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('Lista todos os servidores configurados')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('info')
        .setDescription('Mostra informações detalhadas de um servidor')
        .addStringOption(option =>
          option
            .setName('servidor_id')
            .setDescription('ID do servidor para consultar')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('search')
        .setDescription('Busca servidores por nome')
        .addStringOption(option =>
          option
            .setName('nome')
            .setDescription('Nome ou parte do nome do servidor')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('stats')
        .setDescription('Mostra estatísticas de todos os servidores')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('cleanup')
        .setDescription('Remove servidores que não existem mais')
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

      // Deferir resposta para comandos que podem demorar
      await interaction.deferReply({ ephemeral: true });

      let embed = new EmbedBuilder();

      switch (subcommand) {
        case 'list':
          embed = await this.listServers();
          break;

        case 'info':
          const guildId = interaction.options.getString('servidor_id');
          embed = await this.getServerInfo(guildId);
          break;

        case 'search':
          const searchName = interaction.options.getString('nome');
          embed = await this.searchServers(searchName);
          break;

        case 'stats':
          embed = await this.getServerStats();
          break;

        case 'cleanup':
          embed = await this.cleanupServers();
          break;

        default:
          embed.setColor('Red')
            .setDescription('❌ Subcomando inválido');
      }

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('Erro no comando servers:', error);
      
      const errorEmbed = new EmbedBuilder()
        .setColor('Red')
        .setDescription('❌ Ocorreu um erro ao executar o comando.');

      if (interaction.deferred) {
        await interaction.editReply({ embeds: [errorEmbed] });
      } else {
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
    }
  },

  async listServers() {
    try {
      const guilds = await TicketManager.getAllGuilds();
      
      if (guilds.length === 0) {
        return new EmbedBuilder()
          .setColor('Yellow')
          .setTitle('📋 | Servidores Configurados')
          .setDescription('Nenhum servidor encontrado no banco de dados.');
      }

      const embed = new EmbedBuilder()
        .setColor('Blue')
        .setTitle('📋 | Servidores Configurados')
        .setDescription(`Total de servidores: **${guilds.length}**`);

      // Agrupar servidores por status
      const enabled = guilds.filter(g => g.ticketSettings?.enabled);
      const disabled = guilds.filter(g => !g.ticketSettings?.enabled);

      if (enabled.length > 0) {
        const enabledList = enabled.slice(0, 10).map(g => 
          `• **${g.name}** (${g.guildId}) - ✅ Ativo`
        ).join('\n');
        
        embed.addFields({
          name: `✅ Ativos (${enabled.length})`,
          value: enabledList + (enabled.length > 10 ? '\n*... e mais*' : ''),
          inline: false
        });
      }

      if (disabled.length > 0) {
        const disabledList = disabled.slice(0, 10).map(g => 
          `• **${g.name}** (${g.guildId}) - ❌ Inativo`
        ).join('\n');
        
        embed.addFields({
          name: `❌ Inativos (${disabled.length})`,
          value: disabledList + (disabled.length > 10 ? '\n*... e mais*' : ''),
          inline: false
        });
      }

      embed.setFooter({ text: 'Use /servers info <id> para detalhes de um servidor específico' });

      return embed;

    } catch (error) {
      console.error('Erro ao listar servidores:', error);
      return new EmbedBuilder()
        .setColor('Red')
        .setDescription('❌ Erro ao buscar servidores no banco de dados.');
    }
  },

  async getServerInfo(guildId) {
    try {
      const stats = await TicketManager.getGuildStats(guildId);
      
      if (!stats) {
        return new EmbedBuilder()
          .setColor('Red')
          .setTitle('❌ | Servidor Não Encontrado')
          .setDescription(`Servidor com ID **${guildId}** não foi encontrado no banco de dados.`);
      }

      const embed = new EmbedBuilder()
        .setColor('Blue')
        .setTitle(`📊 | Informações do Servidor`)
        .addFields(
          { name: '🏠 Nome', value: stats.name, inline: true },
          { name: '🆔 ID', value: guildId, inline: true },
          { name: '⚙️ Status', value: stats.isEnabled ? '✅ Ativo' : '❌ Inativo', inline: true },
          { name: '🎫 Total de Tickets', value: stats.totalTickets.toString(), inline: true },
          { name: '🔧 Configurado', value: stats.isConfigured ? '✅ Sim' : '❌ Não', inline: true },
          { name: '📅 Última Atividade', value: stats.lastActivity ? new Date(stats.lastActivity).toLocaleString('pt-BR') : 'N/A', inline: true }
        );

      // Verificar se o servidor ainda existe no Discord
      const guild = await TicketManager.getGuild(guildId);
      if (guild) {
        embed.addFields({
          name: '🔗 Status no Discord',
          value: '✅ Servidor encontrado',
          inline: true
        });
      } else {
        embed.addFields({
          name: '🔗 Status no Discord',
          value: '❌ Servidor não encontrado (pode ter sido removido)',
          inline: true
        });
      }

      return embed;

    } catch (error) {
      console.error('Erro ao obter informações do servidor:', error);
      return new EmbedBuilder()
        .setColor('Red')
        .setDescription('❌ Erro ao buscar informações do servidor.');
    }
  },

  async searchServers(searchName) {
    try {
      const guilds = await TicketManager.searchGuildsByName(searchName);
      
      if (guilds.length === 0) {
        return new EmbedBuilder()
          .setColor('Yellow')
          .setTitle('🔍 | Busca de Servidores')
          .setDescription(`Nenhum servidor encontrado com nome contendo **"${searchName}"**`);
      }

      const embed = new EmbedBuilder()
        .setColor('Blue')
        .setTitle('🔍 | Resultados da Busca')
        .setDescription(`Encontrados **${guilds.length}** servidor(es) com nome contendo **"${searchName}"**`);

      const serverList = guilds.slice(0, 15).map(g => 
        `• **${g.name}** (${g.guildId}) - ${g.ticketSettings?.enabled ? '✅' : '❌'}`
      ).join('\n');

      embed.addFields({
        name: '📋 Servidores',
        value: serverList + (guilds.length > 15 ? '\n*... e mais*' : ''),
        inline: false
      });

      return embed;

    } catch (error) {
      console.error('Erro ao buscar servidores:', error);
      return new EmbedBuilder()
        .setColor('Red')
        .setDescription('❌ Erro ao buscar servidores.');
    }
  },

  async getServerStats() {
    try {
      const guilds = await TicketManager.getAllGuilds();
      
      if (guilds.length === 0) {
        return new EmbedBuilder()
          .setColor('Yellow')
          .setTitle('📊 | Estatísticas dos Servidores')
          .setDescription('Nenhum servidor encontrado no banco de dados.');
      }

      const totalGuilds = guilds.length;
      const enabledGuilds = guilds.filter(g => g.ticketSettings?.enabled).length;
      const disabledGuilds = totalGuilds - enabledGuilds;

      // Calcular estatísticas gerais
      let totalTickets = 0;
      const guildStats = [];

      for (const guild of guilds) {
        const stats = await TicketManager.getTicketStats(guild.guildId);
        totalTickets += stats.total;
        guildStats.push({
          guildId: guild.guildId,
          name: guild.name,
          tickets: stats.total,
          enabled: guild.ticketSettings?.enabled
        });
      }

      // Top 5 servidores com mais tickets
      const topServers = guildStats
        .sort((a, b) => b.tickets - a.tickets)
        .slice(0, 5);

      const embed = new EmbedBuilder()
        .setColor('Blue')
        .setTitle('📊 | Estatísticas Gerais')
        .addFields(
          { name: '🏠 Total de Servidores', value: totalGuilds.toString(), inline: true },
          { name: '✅ Servidores Ativos', value: enabledGuilds.toString(), inline: true },
          { name: '❌ Servidores Inativos', value: disabledGuilds.toString(), inline: true },
          { name: '🎫 Total de Tickets', value: totalTickets.toString(), inline: true },
          { name: '📈 Taxa de Ativação', value: `${((enabledGuilds / totalGuilds) * 100).toFixed(1)}%`, inline: true },
          { name: '📊 Média de Tickets', value: totalGuilds > 0 ? (totalTickets / totalGuilds).toFixed(1) : '0', inline: true }
        );

      if (topServers.length > 0) {
        const topList = topServers.map((server, index) => 
          `${index + 1}. **${server.name}** - ${server.tickets} tickets ${server.enabled ? '✅' : '❌'}`
        ).join('\n');

        embed.addFields({
          name: '🏆 Top 5 Servidores',
          value: topList,
          inline: false
        });
      }

      return embed;

    } catch (error) {
      console.error('Erro ao obter estatísticas dos servidores:', error);
      return new EmbedBuilder()
        .setColor('Red')
        .setDescription('❌ Erro ao calcular estatísticas dos servidores.');
    }
  },

  async cleanupServers() {
    try {
      const guilds = await TicketManager.getAllGuilds();
      let removedCount = 0;
      const removedGuilds = [];

      for (const guild of guilds) {
        const discordGuild = await TicketManager.getGuild(guild.guildId);
        
        if (!discordGuild) {
          // Servidor não existe mais no Discord
          await TicketManager.resetGuildConfig(guild.guildId);
          removedCount++;
          removedGuilds.push(guild.name);
        }
      }

      if (removedCount === 0) {
        return new EmbedBuilder()
          .setColor('Green')
          .setTitle('🧹 | Limpeza Concluída')
          .setDescription('Todos os servidores no banco de dados ainda existem no Discord. Nenhuma limpeza necessária.');
      }

      const embed = new EmbedBuilder()
        .setColor('Yellow')
        .setTitle('🧹 | Limpeza Concluída')
        .setDescription(`**${removedCount}** servidor(es) removido(s) do banco de dados.`);

      if (removedGuilds.length > 0) {
        const removedList = removedGuilds.slice(0, 10).map(name => `• ${name}`).join('\n');
        embed.addFields({
          name: '🗑️ Servidores Removidos',
          value: removedList + (removedGuilds.length > 10 ? '\n*... e mais*' : ''),
          inline: false
        });
      }

      return embed;

    } catch (error) {
      console.error('Erro ao limpar servidores:', error);
      return new EmbedBuilder()
        .setColor('Red')
        .setDescription('❌ Erro ao executar limpeza dos servidores.');
    }
  }
}; 