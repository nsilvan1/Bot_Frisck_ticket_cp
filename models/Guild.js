const mongoose = require('mongoose');

const guildSchema = new mongoose.Schema({
  guildId: {
    type: String,
    required: true,
    unique: true
  },
  
  // Configurações básicas
  name: {
    type: String,
    required: true
  },
  
  // Configurações de tickets
  ticketSettings: {
    enabled: {
      type: Boolean,
      default: true
    },
    categoryId: {
      type: String,
      default: null
    },
    supportRoleIds: {
      type: [String],
      default: []
    },
    logsChannelId: {
      type: String,
      default: null
    },
    maxTicketsPerUser: {
      type: Number,
      default: 1
    },
    autoCloseAfter: {
      type: Number,
      default: 24 // horas
    },
    requireReason: {
      type: Boolean,
      default: false
    },
    closeByStaffOnly: {
      type: Boolean,
      default: false // false = qualquer um pode fechar, true = só staff
    }
  },
  
  // Configurações de UI e branding
  branding: {
    serverName: {
      type: String,
      default: 'Aztlan City'
    },
    primaryColor: {
      type: String,
      default: '#000000'
    },
    secondaryColor: {
      type: String,
      default: '#0099ff'
    },
    thumbnail: {
      type: String,
      default: 'https://i.imgur.com/DklNpSU.gif'
    },
    banner: {
      type: String,
      default: 'https://i.imgur.com/bEr9DFf.jpg'
    },
    footer: {
      type: String,
      default: 'Aztlan City © Todos os direitos reservados.'
    },
    description: {
      type: String,
      default: '> **Para tirar alguma dúvida, problema com produtos ou algo do tipo, Abra Ticket!**'
    }
  },
  
  // Configurações de categorias
  ticketCategories: {
    type: Object,
    default: {}
  },
  
  // Configurações de mensagens
  messages: {
    welcome: {
      type: String,
      default: '> Olá {user}, **esse é seu ticket** \n\n > Em instantes algum atendente irá te atender, **lembrando que pode demorar um pouco.** \n\n > Enquanto isso, **vá descrevendo o ocorrido.** \n\n > Quanto **mais características** você colocar no seu pedido, **mais eficiente e rápido** será nosso atendimento.'
    },
    ticketCreated: {
      type: String,
      default: '🔔 | Seu ticket foi aberto no {channel}!'
    },
    ticketClosed: {
      type: String,
      default: '🔒 | Ticket fechado por {user}'
    },
    noPermission: {
      type: String,
      default: '❌ | Você não possui permissão para usar este comando.'
    },
    alreadyHasTicket: {
      type: String,
      default: '🔔 | Você já tem um ticket aberto!'
    },
    readyMessage: {
      type: String,
      default: 'Sistema de ticket CIDADE ROLEPLAY'
    }
  },
  
  // Configurações de cores
  colors: {
    primary: {
      type: String,
      default: '#000000'
    },
    success: {
      type: String,
      default: '#00FF00'
    },
    error: {
      type: String,
      default: '#FF0000'
    },
    warning: {
      type: String,
      default: '#FFFF00'
    }
  },
  
  // Configurações de logs
  logging: {
    enabled: {
      type: Boolean,
      default: true
    },
    ticketCreated: {
      type: Boolean,
      default: true
    },
    ticketClosed: {
      type: Boolean,
      default: true
    },
    ticketAssigned: {
      type: Boolean,
      default: true
    }
  },
  
  // Configurações de staff
  staffRoles: [{
    roleId: String,
    permissions: [String] // ['view', 'close', 'assign', 'delete']
  }],
  
  // Configurações de blacklist
  blacklistedUsers: [{
    userId: String,
    reason: String,
    addedBy: String,
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Configurações de prefixo
  prefix: {
    type: String,
    default: '.'
  },
  
  // Configurações de idioma
  language: {
    type: String,
    default: 'pt-BR'
  },
  
  // Configurações de timezone
  timezone: {
    type: String,
    default: 'America/Sao_Paulo'
  },
  
  // Configurações de backup
  backup: {
    enabled: {
      type: Boolean,
      default: false
    },
    frequency: {
      type: String,
      default: 'daily',
      enum: ['hourly', 'daily', 'weekly']
    },
    retention: {
      type: Number,
      default: 30 // dias
    }
  },
  
  // Suporte a múltiplos painéis de ticket
  ticketPanels: {
    type: [
      {
        panelId: { type: String, required: true },
        name: { type: String, required: true },
        categories: { type: [String], default: [] }, // IDs das categorias
        channelId: { type: String },
        branding: { type: Object, default: {} }
      }
    ],
    default: []
  }
}, {
  timestamps: true
});

// Índices
// guildId já tem índice único criado automaticamente pelo unique: true

// Métodos estáticos
guildSchema.statics.findOrCreate = async function(guildId, guildName) {
  let guild = await this.findOne({ guildId });
  
  if (!guild) {
    guild = new this({
      guildId,
      name: guildName
    });
    await guild.save();
  }
  
  return guild;
};

guildSchema.statics.getTicketSettings = async function(guildId) {
  const guild = await this.findOne({ guildId });
  return guild ? guild.ticketSettings : null;
};

// Métodos de instância
guildSchema.methods.updateTicketSettings = function(settings) {
  Object.assign(this.ticketSettings, settings);
  return this.save();
};

guildSchema.methods.updateCategorySettings = function(category, settings) {
  if (this.ticketCategories[category]) {
    Object.assign(this.ticketCategories[category], settings);
    return this.save();
  }
  throw new Error(`Categoria ${category} não encontrada`);
};

guildSchema.methods.updateBranding = function(branding) {
  Object.assign(this.branding, branding);
  return this.save();
};

guildSchema.methods.updateMessages = function(messages) {
  Object.assign(this.messages, messages);
  return this.save();
};

guildSchema.methods.addStaffRole = function(roleId, permissions = []) {
  const existingRole = this.staffRoles.find(role => role.roleId === roleId);
  
  if (existingRole) {
    existingRole.permissions = permissions;
  } else {
    this.staffRoles.push({ roleId, permissions });
  }
  
  return this.save();
};

guildSchema.methods.removeStaffRole = function(roleId) {
  this.staffRoles = this.staffRoles.filter(role => role.roleId !== roleId);
  return this.save();
};

guildSchema.methods.addBlacklistedUser = function(userId, reason, addedBy) {
  const existingUser = this.blacklistedUsers.find(user => user.userId === userId);
  
  if (existingUser) {
    existingUser.reason = reason;
    existingUser.addedBy = addedBy;
    existingUser.addedAt = new Date();
  } else {
    this.blacklistedUsers.push({ userId, reason, addedBy });
  }
  
  return this.save();
};

guildSchema.methods.removeBlacklistedUser = function(userId) {
  this.blacklistedUsers = this.blacklistedUsers.filter(user => user.userId !== userId);
  return this.save();
};

guildSchema.methods.isUserBlacklisted = function(userId) {
  return this.blacklistedUsers.some(user => user.userId === userId);
};

module.exports = mongoose.model('Guild', guildSchema); 