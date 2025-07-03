require('dotenv').config();
const mongoose = require('mongoose');

async function initializeDatabase() {
  try {
    console.log('🚀 Inicializando banco de dados...');
    
    // Verificar se MONGODB_URI está definida
    if (!process.env.MONGODB_URI) {
      console.log('⚠️ MONGODB_URI não encontrada. Criando banco local...');
      process.env.MONGODB_URI = 'mongodb://localhost:27017/ticket-bot';
    }

    // Conectar ao MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Conectado ao MongoDB');

    // Extrair nome do banco
    const dbName = getDatabaseName();
    console.log(`📊 Verificando banco: ${dbName}`);

    // Verificar se o banco existe
    const adminDb = mongoose.connection.db.admin();
    const dbList = await adminDb.listDatabases();
    
    const databaseExists = dbList.databases.some(db => db.name === dbName);
    
    if (!databaseExists) {
      console.log(`🆕 Banco ${dbName} não existe. Criando...`);
      // O banco será criado automaticamente quando inserirmos o primeiro documento
    } else {
      console.log(`✅ Banco ${dbName} já existe`);
    }

    // Verificar e criar coleções
    console.log('📋 Verificando coleções...');
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(col => col.name);
    
    const requiredCollections = ['tickets', 'guilds'];
    let createdCollections = 0;
    
    for (const collectionName of requiredCollections) {
      if (!collectionNames.includes(collectionName)) {
        console.log(`🆕 Criando coleção: ${collectionName}`);
        await db.createCollection(collectionName);
        createdCollections++;
        
        // Criar índices para a coleção
        await createIndexes(collectionName, db);
      } else {
        console.log(`✅ Coleção ${collectionName} já existe`);
      }
    }

    // Verificar índices existentes
    console.log('🔍 Verificando índices...');
    await verifyAndCreateIndexes(db);

    // Mostrar informações finais
    const dbInfo = await getDatabaseInfo(db);
    if (dbInfo) {
      console.log('\n📊 Informações do Banco:');
      console.log(`   Nome: ${dbInfo.name}`);
      console.log(`   Coleções: ${dbInfo.collections}`);
      console.log(`   Tamanho: ${formatBytes(dbInfo.dataSize)}`);
      console.log(`   Índices: ${dbInfo.indexes}`);
    }

    console.log('\n🎉 Inicialização concluída com sucesso!');
    console.log(`📝 ${createdCollections} coleção(ões) criada(s)`);
    console.log('🚀 O bot está pronto para uso!');

  } catch (error) {
    console.error('❌ Erro durante a inicialização:', error);
    
    if (error.name === 'MongoNetworkError') {
      console.log('\n💡 Dicas para resolver:');
      console.log('1. Verifique se o MongoDB está rodando');
      console.log('2. Confirme se a URI está correta no arquivo .env');
      console.log('3. Para MongoDB Atlas, verifique se o IP está liberado');
      console.log('4. Para MongoDB local, execute: mongod');
    }
    
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado do MongoDB');
  }
}

function getDatabaseName() {
  const uri = process.env.MONGODB_URI;
  
  if (uri.includes('mongodb://')) {
    const path = uri.split('/');
    return path[path.length - 1] || 'ticket-bot';
  } else if (uri.includes('mongodb+srv://')) {
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
        console.log('   📊 Índices criados para tickets');
        break;
        
      case 'guilds':
        await collection.createIndex({ guildId: 1 }, { unique: true });
        console.log('   📊 Índices criados para guilds');
        break;
    }
  } catch (error) {
    console.error(`   ❌ Erro ao criar índices para ${collectionName}:`, error.message);
  }
}

async function verifyAndCreateIndexes(db) {
  try {
    // Verificar índices da coleção tickets
    const ticketsCollection = db.collection('tickets');
    const ticketsIndexes = await ticketsCollection.indexes();
    
    const requiredTicketIndexes = [
      { key: { ticketId: 1 }, unique: true },
      { key: { channelId: 1 }, unique: true },
      { key: { userId: 1 } },
      { key: { guildId: 1 } },
      { key: { status: 1 } },
      { key: { type: 1 } },
      { key: { createdAt: -1 } }
    ];

    for (const requiredIndex of requiredTicketIndexes) {
      const exists = ticketsIndexes.some(index => 
        JSON.stringify(index.key) === JSON.stringify(requiredIndex.key)
      );
      
      if (!exists) {
        console.log(`   🔧 Criando índice faltante: ${JSON.stringify(requiredIndex.key)}`);
        await ticketsCollection.createIndex(requiredIndex.key, { unique: requiredIndex.unique });
      }
    }

    // Verificar índices da coleção guilds
    const guildsCollection = db.collection('guilds');
    const guildsIndexes = await guildsCollection.indexes();
    
    const requiredGuildIndexes = [
      { key: { guildId: 1 }, unique: true }
    ];

    for (const requiredIndex of requiredGuildIndexes) {
      const exists = guildsIndexes.some(index => 
        JSON.stringify(index.key) === JSON.stringify(requiredIndex.key)
      );
      
      if (!exists) {
        console.log(`   🔧 Criando índice faltante: ${JSON.stringify(requiredIndex.key)}`);
        await guildsCollection.createIndex(requiredIndex.key, { unique: requiredIndex.unique });
      }
    }

    console.log('   ✅ Todos os índices verificados');
  } catch (error) {
    console.error('   ❌ Erro ao verificar índices:', error.message);
  }
}

async function getDatabaseInfo(db) {
  try {
    const stats = await db.stats();
    return {
      name: db.databaseName,
      collections: stats.collections,
      dataSize: stats.dataSize,
      storageSize: stats.storageSize,
      indexes: stats.indexes
    };
  } catch (error) {
    console.error('   ❌ Erro ao obter informações do banco:', error.message);
    return null;
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Executar se chamado diretamente
if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase }; 