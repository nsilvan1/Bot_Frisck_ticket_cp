require('dotenv').config();
const mongoose = require('mongoose');
const Guild = require('../models/Guild.js');
const config = require('../config.json');

async function migrateData() {
  try {
    console.log('🔄 Iniciando migração de dados...');

    // Conectar ao MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Conectado ao MongoDB');

    // Verificar se o banco existe
    const dbName = getDatabaseName();
    console.log(`📊 Verificando banco de dados: ${dbName}`);

    // Listar bancos de dados para verificar se existe
    const adminDb = mongoose.connection.db.admin();
    const dbList = await adminDb.listDatabases();
    
    const databaseExists = dbList.databases.some(db => db.name === dbName);
    
    if (!databaseExists) {
      console.log(`🆕 Banco de dados ${dbName} não existe. Será criado automaticamente.`);
    } else {
      console.log(`✅ Banco de dados ${dbName} já existe`);
    }

    // Verificar e criar coleções
    console.log('📋 Verificando coleções...');
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(col => col.name);
    
    const requiredCollections = ['tickets', 'guilds'];
    
    for (const collectionName of requiredCollections) {
      if (!collectionNames.includes(collectionName)) {
        console.log(`🆕 Criando coleção: ${collectionName}`);
        await db.createCollection(collectionName);
        
        // Criar índices para a coleção
        await createIndexes(collectionName, db);
      } else {
        console.log(`✅ Coleção ${collectionName} já existe`);
      }
    }

    // Migrar configurações do config.json para o banco de dados
    console.log('📝 Migrando configurações...');

    // Aqui você pode adicionar lógica para migrar dados existentes
    // Por exemplo, se você tinha tickets salvos em outro formato

    console.log('✅ Migração concluída com sucesso!');
    console.log('');
    console.log('📋 Próximos passos:');
    console.log('1. Execute o bot com: npm start');
    console.log('2. Use o comando .setup para configurar o sistema');
    console.log('3. Configure categoria, cargo de suporte e canal de logs');
    console.log('4. Teste criando um ticket');
    console.log('5. Use .database status para verificar o banco');

  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado do MongoDB');
  }
}

function getDatabaseName() {
  const uri = process.env.MONGODB_URI;
  
  // Extrair nome do banco da URI
  if (uri.includes('mongodb://')) {
    // MongoDB local
    const path = uri.split('/');
    return path[path.length - 1] || 'ticket-bot';
  } else if (uri.includes('mongodb+srv://')) {
    // MongoDB Atlas
    const path = uri.split('/');
    const dbName = path[path.length - 1];
    return dbName || 'ticket-bot';
  }
  
  return 'ticket-bot';
}

async function createIndexes(collectionName, db) {
  try {
    const collection = db.collection(collectionName);
    
    switch (collectionName) {
      case 'tickets':
        await collection.createIndex({ ticketId: 1 }, { unique: true });
        await collection.createIndex({ channelId: 1 }, { unique: true });
        await collection.createIndex({ userId: 1 });
        await collection.createIndex({ guildId: 1 });
        await collection.createIndex({ status: 1 });
        await collection.createIndex({ type: 1 });
        await collection.createIndex({ createdAt: -1 });
        console.log('📊 Índices criados para coleção tickets');
        break;
        
      case 'guilds':
        await collection.createIndex({ guildId: 1 }, { unique: true });
        console.log('📊 Índices criados para coleção guilds');
        break;
    }
  } catch (error) {
    console.error(`❌ Erro ao criar índices para ${collectionName}:`, error);
  }
}

async function migrateConfigToDatabase() {
  try {
    console.log('🚀 Iniciando migração de configurações...');
    
    // Conectar ao MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Conectado ao MongoDB');

    // Importar modelos
    const Guild = require('../models/Guild.js');
    
    // Migrar configurações do config.json para o banco de dados
    console.log('📋 Migrando configurações...');
    
    // Buscar todos os servidores que o bot está presente
    const { client } = require('../index.js');
    
    // Aguardar o bot estar pronto
    await new Promise(resolve => {
      if (client.readyAt) {
        resolve();
      } else {
        client.once('ready', resolve);
      }
    });

    const guilds = client.guilds.cache;
    console.log(`📊 Encontrados ${guilds.size} servidores para migrar`);

    for (const [guildId, guild] of guilds) {
      try {
        console.log(`🔄 Migrando servidor: ${guild.name} (${guildId})`);
        
        // Verificar se já existe configuração
        let guildConfig = await Guild.findOne({ guildId });
        
        if (!guildConfig) {
          // Criar nova configuração
          guildConfig = new Guild({
            guildId,
            name: guild.name,
            ticketSettings: {
              enabled: false,
              categoryId: config.categoria || null,
              supportRoleId: config.suporte || null,
              logsChannelId: config.logs || null,
              maxTicketsPerUser: 1,
              autoCloseAfter: 24
            },
            branding: {
              serverName: 'Aztlan City',
              primaryColor: config.color || '#000000',
              secondaryColor: config.cor || '#0099ff',
              thumbnail: config.thumbnail || 'https://i.imgur.com/DklNpSU.gif',
              banner: config.banner || 'https://i.imgur.com/bEr9DFf.jpg',
              footer: config.footer || 'Aztlan City © Todos os direitos reservados.',
              description: config.description || '> **Para tirar alguma dúvida, problema com produtos ou algo do tipo, Abra Ticket!**'
            },
            messages: {
              welcome: '> Olá {user}, **esse é seu ticket** \n\n > Em instantes algum atendente irá te atender, **lembrando que pode demorar um pouco.** \n\n > Enquanto isso, **vá descrevendo o ocorrido.** \n\n > Quanto **mais características** você colocar no seu pedido, **mais eficiente e rápido** será nosso atendimento.',
              ticketCreated: '🔔 | Seu ticket foi aberto no {channel}!',
              ticketClosed: '🔒 | Ticket fechado por {user}',
              noPermission: '❌ | Você não possui permissão para usar este comando.',
              alreadyHasTicket: '🔔 | Você já tem um ticket aberto!',
              readyMessage: config.ready || 'Sistema de ticket CIDADE ROLEPLAY'
            },
            colors: {
              primary: config.color || '#000000',
              success: '#00FF00',
              error: '#FF0000',
              warning: '#FFFF00'
            },
            prefix: config.prefix || '.',
            ticketCategories: {
              sup: {
                enabled: true,
                name: '📛・denúncia',
                description: 'Deseja denunciar algum jogador da cidade?',
                emoji: config.emoji || '📛',
                staffOnly: false
              },
              pro: {
                enabled: true,
                name: '⚠️・denúncia-staff',
                description: 'Deseja denunciar algum membro da staff da cidade?',
                emoji: config.emoji4 || '⚠️',
                staffOnly: true
              },
              com: {
                enabled: true,
                name: '💀・facções',
                description: 'Gostaria de assumir uma FAC/ORG? Abra um ticket',
                emoji: config.emoji1 || '💀',
                staffOnly: false
              },
              mod: {
                enabled: true,
                name: '🐌・bugs',
                description: 'Encontrou algum problema na cidade?',
                emoji: config.emoji5 || '🐌',
                staffOnly: false
              },
              ceo: {
                enabled: true,
                name: '🕵️・corregedoria',
                description: 'Assuntos da corregedoria',
                emoji: config.emoji2 || '🕵️',
                staffOnly: true
              },
              vol: {
                enabled: true,
                name: '💰・vips',
                description: 'Problemas relacionados a vips ou doações?',
                emoji: config.emoji3 || '💰',
                staffOnly: false
              },
              bem: {
                enabled: true,
                name: '🏘️・imobiliária',
                description: 'Dúvidas sobre casas, mansões ou propriedades?',
                emoji: config.emoji6 || '🏘️',
                staffOnly: false
              }
            }
          });
        } else {
          // Atualizar configuração existente com valores do config.json
          guildConfig.branding = {
            ...guildConfig.branding,
            serverName: 'Aztlan City',
            primaryColor: config.color || guildConfig.branding.primaryColor,
            secondaryColor: config.cor || guildConfig.branding.secondaryColor,
            thumbnail: config.thumbnail || guildConfig.branding.thumbnail,
            banner: config.banner || guildConfig.branding.banner,
            footer: config.footer || guildConfig.branding.footer,
            description: config.description || guildConfig.branding.description
          };
          
          guildConfig.messages.readyMessage = config.ready || guildConfig.messages.readyMessage;
          guildConfig.prefix = config.prefix || guildConfig.prefix;
          
          // Atualizar categorias com emojis do config.json
          if (config.emoji) guildConfig.ticketCategories.sup.emoji = config.emoji;
          if (config.emoji1) guildConfig.ticketCategories.com.emoji = config.emoji1;
          if (config.emoji2) guildConfig.ticketCategories.ceo.emoji = config.emoji2;
          if (config.emoji3) guildConfig.ticketCategories.vol.emoji = config.emoji3;
          if (config.emoji4) guildConfig.ticketCategories.pro.emoji = config.emoji4;
          if (config.emoji5) guildConfig.ticketCategories.mod.emoji = config.emoji5;
          if (config.emoji6) guildConfig.ticketCategories.bem.emoji = config.emoji6;
        }
        
        await guildConfig.save();
        console.log(`✅ Servidor migrado: ${guild.name}`);
        
      } catch (error) {
        console.error(`❌ Erro ao migrar servidor ${guild.name}:`, error);
      }
    }

    console.log('\n🎉 Migração concluída com sucesso!');
    console.log('📝 Todas as configurações foram movidas para o banco de dados');
    console.log('💡 Agora você pode remover o arquivo config.json');

  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado do MongoDB');
  }
}

// Executar migração se o script for chamado diretamente
if (require.main === module) {
  migrateData();
}

module.exports = { migrateData }; 