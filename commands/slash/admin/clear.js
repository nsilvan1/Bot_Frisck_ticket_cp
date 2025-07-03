const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Limpa mensagens do canal')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addIntegerOption(option =>
      option
        .setName('quantidade')
        .setDescription('Número de mensagens para deletar (1-100)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100)
    )
    .addUserOption(option =>
      option
        .setName('usuario')
        .setDescription('Limpar apenas mensagens de um usuário específico')
        .setRequired(false)
    ),

  async execute(interaction) {
    try {
      // Verificar permissões
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
        const embed = new EmbedBuilder()
          .setColor('Red')
          .setTitle('❌ | Permissão Negada')
          .setDescription('Você precisa ter permissão para **Gerenciar Mensagens** para usar este comando.');

        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      // Verificar se o bot tem permissão
      if (!interaction.channel.permissionsFor(interaction.client.user).has(PermissionFlagsBits.ManageMessages)) {
        const embed = new EmbedBuilder()
          .setColor('Red')
          .setTitle('❌ | Permissão Negada')
          .setDescription('Eu preciso ter permissão para **Gerenciar Mensagens** neste canal.');

        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      const quantidade = interaction.options.getInteger('quantidade');
      const usuario = interaction.options.getUser('usuario');

      // Deferir resposta para dar tempo de processar
      await interaction.deferReply({ ephemeral: true });

      try {
        let mensagensDeletadas = 0;
        let tentativas = 0;
        const maxTentativas = 10;

        while (mensagensDeletadas < quantidade && tentativas < maxTentativas) {
          const mensagensParaDeletar = Math.min(quantidade - mensagensDeletadas, 100);
          
          let mensagens;
          if (usuario) {
            // Buscar mensagens de um usuário específico
            mensagens = await interaction.channel.messages.fetch({ limit: 100 });
            mensagens = mensagens.filter(msg => msg.author.id === usuario.id);
            mensagens = mensagens.first(mensagensParaDeletar);
          } else {
            // Buscar todas as mensagens
            mensagens = await interaction.channel.messages.fetch({ limit: mensagensParaDeletar });
          }

          if (mensagens.size === 0) break;

          // Deletar mensagens
          const deletadas = await interaction.channel.bulkDelete(mensagens, true);
          mensagensDeletadas += deletadas.size;
          tentativas++;

          // Aguardar um pouco para evitar rate limits
          if (tentativas < maxTentativas && mensagensDeletadas < quantidade) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }

        // Criar embed de sucesso
        const embed = new EmbedBuilder()
          .setColor('Green')
          .setTitle('✅ Mensagens Deletadas')
          .setDescription(
            `**${mensagensDeletadas} mensagens** foram deletadas com sucesso!\n\n` +
            `📊 **Detalhes:**\n` +
            `• Quantidade solicitada: ${quantidade}\n` +
            `• Quantidade deletada: ${mensagensDeletadas}\n` +
            `• Canal: ${interaction.channel}\n` +
            (usuario ? `• Usuário filtrado: ${usuario.tag}\n` : '• Todas as mensagens\n') +
            `• Executado por: ${interaction.user.tag}`
          )
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });

        // Enviar confirmação no canal (opcional)
        if (mensagensDeletadas > 0) {
          const confirmEmbed = new EmbedBuilder()
            .setColor('Blue')
            .setDescription(`🧹 **${mensagensDeletadas} mensagens** foram limpas por ${interaction.user}`)
            .setTimestamp();

          const confirmMsg = await interaction.channel.send({ embeds: [confirmEmbed] });
          
          // Deletar a mensagem de confirmação após 5 segundos
          setTimeout(async () => {
            try {
              await confirmMsg.delete();
            } catch (error) {
              // Ignorar erro se a mensagem já foi deletada
            }
          }, 5000);
        }

      } catch (error) {
        console.error('Erro ao deletar mensagens:', error);
        
        const errorEmbed = new EmbedBuilder()
          .setColor('Red')
          .setTitle('❌ Erro ao Deletar Mensagens')
          .setDescription(
            `Ocorreu um erro ao deletar as mensagens:\n` +
            `\`\`\`${error.message}\`\`\`\n\n` +
            `**Possíveis causas:**\n` +
            `• Mensagens muito antigas (mais de 14 dias)\n` +
            `• Rate limit do Discord\n` +
            `• Permissões insuficientes`
          );

        await interaction.editReply({ embeds: [errorEmbed] });
      }

    } catch (error) {
      console.error('Erro no comando clear:', error);
      
      const errorEmbed = new EmbedBuilder()
        .setColor('Red')
        .setDescription(`❌ Ocorreu um erro ao executar o comando: ${error.message}`);

      if (interaction.replied || interaction.deferred) {
        await interaction.editReply({ embeds: [errorEmbed] });
      } else {
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
    }
  }
}; 