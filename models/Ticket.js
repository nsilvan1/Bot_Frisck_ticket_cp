const mongoose = require('mongoose');
const moment = require('moment');

const ticketSchema = new mongoose.Schema({
  // Informações básicas
  ticketId: {
    type: String,
    required: true,
    unique: true
  },
  channelId: {
    type: String,
    required: true,
    unique: true
  },
  guildId: {
    type: String,
    required: true
  },
  
  // Informações do usuário
  userId: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true
  },
  
  // Tipo e categoria
  type: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  
  // Status e controle
  status: {
    type: String,
    required: true,
    default: 'open',
    enum: ['open', 'closed', 'resolved', 'pending']
  },
  
  // Atendimento
  assignedTo: {
    type: String,
    default: null
  },
  assignedAt: {
    type: Date,
    default: null
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  closedAt: {
    type: Date,
    default: null
  },
  resolvedAt: {
    type: Date,
    default: null
  },
  
  // Informações adicionais
  messages: [{
    userId: String,
    username: String,
    content: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    isStaff: {
      type: Boolean,
      default: false
    }
  }],
  
  // Avaliação
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: null
  },
  feedback: {
    type: String,
    default: null
  },
  
  // Tags e categorização
  tags: [{
    type: String
  }],
  
  // Prioridade
  priority: {
    type: String,
    default: 'normal',
    enum: ['low', 'normal', 'high', 'urgent']
  },
  
  // Informações do sistema
  transcriptUrl: {
    type: String,
    default: null
  },
  
  // Metadados
  metadata: {
    type: Map,
    of: String,
    default: new Map()
  }
}, {
  timestamps: true
});

// Índices para melhor performance
// ticketId e channelId já têm índices únicos criados automaticamente
ticketSchema.index({ userId: 1 });
ticketSchema.index({ guildId: 1 });
ticketSchema.index({ status: 1 });
ticketSchema.index({ type: 1 });
ticketSchema.index({ createdAt: -1 });

// Métodos estáticos
ticketSchema.statics.findByTicketId = function(ticketId) {
  return this.findOne({ ticketId });
};

ticketSchema.statics.findByChannelId = function(channelId) {
  return this.findOne({ channelId });
};

ticketSchema.statics.findOpenTicketsByUser = function(userId, guildId) {
  return this.find({ 
    userId, 
    guildId, 
    status: { $in: ['open', 'pending'] } 
  });
};

ticketSchema.statics.findTicketsByGuild = function(guildId, options = {}) {
  const query = { guildId };
  
  if (options.status) {
    query.status = options.status;
  }
  
  if (options.type) {
    query.type = options.type;
  }
  
  return this.find(query).sort({ createdAt: -1 });
};

// Métodos de instância
ticketSchema.methods.addMessage = function(userId, username, content, isStaff = false) {
  this.messages.push({
    userId,
    username,
    content,
    isStaff,
    timestamp: new Date()
  });
  return this.save();
};

ticketSchema.methods.close = function() {
  this.status = 'closed';
  this.closedAt = new Date();
  return this.save();
};

ticketSchema.methods.resolve = function() {
  this.status = 'resolved';
  this.resolvedAt = new Date();
  return this.save();
};

ticketSchema.methods.assign = function(staffId) {
  this.assignedTo = staffId;
  this.assignedAt = new Date();
  return this.save();
};

ticketSchema.methods.setRating = function(rating, feedback = null) {
  this.rating = rating;
  this.feedback = feedback;
  return this.save();
};

// Virtuals
ticketSchema.virtual('duration').get(function() {
  if (this.status === 'open' || this.status === 'pending') {
    return moment.duration(moment().diff(this.createdAt));
  }
  return moment.duration(moment(this.closedAt || this.resolvedAt).diff(this.createdAt));
});

ticketSchema.virtual('durationFormatted').get(function() {
  const duration = this.duration;
  const days = Math.floor(duration.asDays());
  const hours = duration.hours();
  const minutes = duration.minutes();
  
  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
});

// Configurar virtuals para JSON
ticketSchema.set('toJSON', { virtuals: true });
ticketSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Ticket', ticketSchema); 