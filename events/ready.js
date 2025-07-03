const database = require('../database/connection.js')
const TicketManager = require('../utils/ticketManager.js')

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    const green = '\x1b[32m',
      blue = '\x1b[34m',
      yellow = '\x1b[33m',
      colorful = (color, string, reset = '\x1b[0m') => color + string + reset

    console.log(colorful(green, '🍃 - Bot Online!'))
    console.log(colorful(green, `👤 Logado como: ${client.user.tag}`))
    console.log(colorful(green, `🆔 ID do Bot: ${client.user.id}`))
    console.log(colorful(green, `📊 Servidores: ${client.guilds.cache.size}`))
    console.log(colorful(blue, `🔧 Comandos Slash: ${client.commands.size}`))
    
    // Verificar status do banco de dados
    if (database.isConnected()) {
      console.log(colorful(blue, '🗄️ MongoDB: Conectado'))
      
      try {
        const dbInfo = await database.getDatabaseInfo()
        if (dbInfo) {
          console.log(colorful(blue, `📊 Banco: ${dbInfo.name}`))
          console.log(colorful(blue, `📋 Coleções: ${dbInfo.collections}`))
          console.log(colorful(blue, `💾 Tamanho dos dados: ${formatBytes(dbInfo.dataSize)}`))
          console.log(colorful(blue, `🗂️ Índices: ${dbInfo.indexes}`))
        }
      } catch (error) {
        console.log(colorful(yellow, '⚠️ Não foi possível obter informações detalhadas do banco'))
      }

      // Atualizar nomes dos servidores no banco de dados
      console.log(colorful(blue, '🔄 Atualizando nomes dos servidores no banco de dados...'))
      let updatedCount = 0;
      
      for (const guild of client.guilds.cache.values()) {
        try {
          const updated = await TicketManager.updateGuildName(guild.id, guild.name);
          if (updated) updatedCount++;
        } catch (error) {
          console.log(colorful(yellow, `⚠️ Erro ao atualizar nome do servidor ${guild.name}: ${error.message}`))
        }
      }
      
      console.log(colorful(green, `✅ ${updatedCount} servidores atualizados no banco de dados`))
    } else {
      console.log(colorful(yellow, '⚠️ MongoDB: Desconectado'))
    }
    
    // Atividade do bot
    client.user.setActivity('Sistema de Tickets | /ticket', {
      type: 2 // LISTENING
    })

    console.log(colorful(green, '🎯 Bot pronto para uso!'))
    console.log(colorful(blue, '💡 Use /ticket para criar um painel de tickets'))
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
