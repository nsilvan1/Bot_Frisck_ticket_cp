const TicketManager = require('../utils/ticketManager.js')

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    // Validações básicas
    if (message.author.bot || message.channel.type === 1) return // 1 = DM
    
    // Obter configuração do servidor
    const guildConfig = await TicketManager.getGuildConfig(message.guildId)
    const prefix = guildConfig?.prefix || '.'

    if (!message.content.toLowerCase().startsWith(prefix.toLowerCase())) return

    // Parse dos argumentos
    const args = message.content.slice(prefix.length).trim().split(/ +/g)
    const cmd = args.shift().toLowerCase()
    
    if (cmd.length === 0) return

    // Buscar comando
    let command = message.client.commands.get(cmd)
    if (!command) command = message.client.commands.get(message.client.aliases?.get(cmd))

    if (!command) return

    // Executar comando com tratamento de erro
    try {
      await command.run(message.client, message, args)
    } catch (error) {
      console.error(`❌ Erro ao executar comando ${cmd}:`, error)
      
      const errorEmbed = {
        color: 0xFF0000,
        description: '❌ Ocorreu um erro ao executar este comando.',
        footer: {
          text: 'Erro reportado aos desenvolvedores'
        }
      }

      message.reply({ embeds: [errorEmbed] }).catch(() => {
        // Se não conseguir enviar a mensagem, apenas loga o erro
        console.error('Não foi possível enviar mensagem de erro')
      })
    }
  }
}
