const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reload')
    .setDescription('Recarrega todos os comandos do bot')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option =>
      option
        .setName('comando')
        .setDescription('Nome específico do comando para recarregar (opcional)')
        .setRequired(false)
    ),

  async execute(interaction) {
    try {
      // Verificar permissões
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        const embed = new EmbedBuilder()
          .setColor('Red')
          .setTitle('❌ | Permissão Negada')
          .setDescription('Você precisa ser **Administrador** para usar este comando.');

        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      await interaction.deferReply({ ephemeral: true });

      const comandoEspecifico = interaction.options.getString('comando');
      const client = interaction.client;

      if (comandoEspecifico) {
        // Recarregar comando específico
        await this.reloadSpecificCommand(client, comandoEspecifico, interaction);
      } else {
        // Recarregar todos os comandos
        await this.reloadAllCommands(client, interaction);
      }

    } catch (error) {
      console.error('Erro no comando reload:', error);
      
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

  async reloadSpecificCommand(client, commandName, interaction) {
    try {
      // Verificar se o comando existe
      const command = client.commands.get(commandName);
      if (!command) {
        const embed = new EmbedBuilder()
          .setColor('Red')
          .setTitle('❌ Comando Não Encontrado')
          .setDescription(`O comando \`${commandName}\` não foi encontrado.`);

        return interaction.editReply({ embeds: [embed] });
      }

      // Encontrar o arquivo do comando
      const commandsPath = path.join(__dirname, '..');
      const commandFolders = fs.readdirSync(commandsPath);
      let commandPath = null;

      for (const folder of commandFolders) {
        const folderPath = path.join(commandsPath, folder);
        const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
        
        for (const file of commandFiles) {
          if (file === `${commandName}.js`) {
            commandPath = path.join(folderPath, file);
            break;
          }
        }
        if (commandPath) break;
      }

      if (!commandPath) {
        const embed = new EmbedBuilder()
          .setColor('Red')
          .setTitle('❌ Arquivo Não Encontrado')
          .setDescription(`Arquivo do comando \`${commandName}\` não foi encontrado.`);

        return interaction.editReply({ embeds: [embed] });
      }

      // Recarregar o comando
      delete require.cache[require.resolve(commandPath)];
      const newCommand = require(commandPath);
      
      // Atualizar na coleção
      client.commands.set(commandName, newCommand);

      const embed = new EmbedBuilder()
        .setColor('Green')
        .setTitle('✅ Comando Recarregado')
        .setDescription(
          `O comando \`${commandName}\` foi recarregado com sucesso!\n\n` +
          `📁 **Arquivo:** \`${path.basename(commandPath)}\`\n` +
          `⏰ **Recarregado em:** <t:${Math.floor(Date.now() / 1000)}:f>`
        );

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error(`Erro ao recarregar comando ${commandName}:`, error);
      
      const embed = new EmbedBuilder()
        .setColor('Red')
        .setTitle('❌ Erro ao Recarregar Comando')
        .setDescription(
          `Erro ao recarregar o comando \`${commandName}\`:\n` +
          `\`\`\`${error.message}\`\`\``
        );

      await interaction.editReply({ embeds: [embed] });
    }
  },

  async reloadAllCommands(client, interaction) {
    try {
      const commandsPath = path.join(__dirname, '..');
      const commandFolders = fs.readdirSync(commandsPath);
      let reloadedCount = 0;
      let errorCount = 0;
      const errors = [];

      // Limpar cache de comandos
      client.commands.clear();

      for (const folder of commandFolders) {
        const folderPath = path.join(commandsPath, folder);
        const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
        
        for (const file of commandFiles) {
          try {
            const filePath = path.join(folderPath, file);
            
            // Limpar cache do arquivo
            delete require.cache[require.resolve(filePath)];
            
            // Recarregar comando
            const command = require(filePath);
            
            if ('data' in command && 'execute' in command) {
              client.commands.set(command.data.name, command);
              reloadedCount++;
            } else {
              errors.push(`${file} - Propriedades obrigatórias ausentes`);
              errorCount++;
            }
          } catch (error) {
            errors.push(`${file} - ${error.message}`);
            errorCount++;
          }
        }
      }

      // Registrar comandos no Discord
      const commands = [];
      for (const command of client.commands.values()) {
        commands.push(command.data.toJSON());
      }

      await client.application.commands.set(commands);

      // Atualizar nomes dos servidores no banco
      const TicketManager = require('../../../utils/ticketManager.js');
      const GuildModel = require('../../../models/Guild.js');
      let updatedGuilds = 0;
      const allGuilds = await GuildModel.find({});
      for (const guildDoc of allGuilds) {
        const guildId = guildDoc.guildId;
        const discordGuild = client.guilds.cache.get(guildId);
        if (discordGuild && guildDoc.name !== discordGuild.name) {
          await GuildModel.updateOne({ guildId }, { $set: { name: discordGuild.name, updatedAt: new Date() } });
          updatedGuilds++;
        }
      }

      const embed = new EmbedBuilder()
        .setColor('Green')
        .setTitle('✅ Comandos Recarregados')
        .setDescription(
          `**${reloadedCount} comandos** foram recarregados com sucesso!\n\n` +
          `📊 **Estatísticas:**\n` +
          `• Comandos recarregados: ${reloadedCount}\n` +
          `• Erros encontrados: ${errorCount}\n` +
          `• Total de arquivos: ${reloadedCount + errorCount}\n` +
          `• Servidores atualizados: ${updatedGuilds}\n\n` +
          `⏰ **Recarregado em:** <t:${Math.floor(Date.now() / 1000)}:f>`
        );

      if (errors.length > 0) {
        embed.addFields({
          name: '⚠️ Erros Encontrados',
          value: errors.slice(0, 5).join('\n') + (errors.length > 5 ? '\n...' : ''),
          inline: false
        });
      }

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('Erro ao recarregar todos os comandos:', error);
      
      const embed = new EmbedBuilder()
        .setColor('Red')
        .setTitle('❌ Erro ao Recarregar Comandos')
        .setDescription(
          `Ocorreu um erro ao recarregar os comandos:\n` +
          `\`\`\`${error.message}\`\`\``
        );

      await interaction.editReply({ embeds: [embed] });
    }
  }
}; 