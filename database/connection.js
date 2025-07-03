const mongoose = require('mongoose');

class Database {
  constructor() {
    this.connection = null;
  }

  async connect() {
    try {
      const uri = process.env.MONGODB_URI;
      
      if (!uri) {
        throw new Error('MONGODB_URI não está definida nas variáveis de ambiente');
      }

      console.log('🔄 Conectando ao MongoDB...');
      
      this.connection = await mongoose.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });

      console.log('✅ Conectado ao MongoDB com sucesso!');
      
      // Verificar e criar banco de dados se necessário
      await this.ensureDatabaseExists();
      
      // Verificar e criar coleções se necessário
      await this.ensureCollectionsExist();
      
      // Eventos de conexão
      mongoose.connection.on('error', (error) => {
        console.error('❌ Erro na conexão MongoDB:', error);
      });

      mongoose.connection.on('disconnected', () => {
        console.log('⚠️ Desconectado do MongoDB');
      });

      mongoose.connection.on('reconnected', () => {
        console.log('🔄 Reconectado ao MongoDB');
      });

      return this.connection;
    } catch (error) {
      console.error('❌ Erro ao conectar ao MongoDB:', error);
      process.exit(1);
    }
  }

  async ensureDatabaseExists() {
    try {
      const dbName = this.getDatabaseName();
      console.log(`📊 Verificando banco de dados: ${dbName}`);
      
      // Listar bancos de dados para verificar se existe
      const adminDb = mongoose.connection.db.admin();
      const dbList = await adminDb.listDatabases();
      
      const databaseExists = dbList.databases.some(db => db.name === dbName);
      
      if (!databaseExists) {
        console.log(`🆕 Criando banco de dados: ${dbName}`);
        // O banco será criado automaticamente quando inserirmos o primeiro documento
      } else {
        console.log(`✅ Banco de dados ${dbName} já existe`);
      }
    } catch (error) {
      console.error('❌ Erro ao verificar banco de dados:', error);
    }
  }

  async ensureCollectionsExist() {
    try {
      console.log('📋 Verificando coleções...');
      
      const db = mongoose.connection.db;
      const collections = await db.listCollections().toArray();
      const collectionNames = collections.map(col => col.name);
      
      // Lista de coleções necessárias
      const requiredCollections = ['tickets', 'guilds'];
      
      for (const collectionName of requiredCollections) {
        if (!collectionNames.includes(collectionName)) {
          console.log(`🆕 Criando coleção: ${collectionName}`);
          await db.createCollection(collectionName);
          
          // Criar índices para a coleção
          await this.createIndexes(collectionName);
        } else {
          console.log(`✅ Coleção ${collectionName} já existe`);
        }
      }
      
      console.log('✅ Todas as coleções verificadas/criadas com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao verificar/criar coleções:', error);
    }
  }

  async createIndexes(collectionName) {
    try {
      const db = mongoose.connection.db;
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

  getDatabaseName() {
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

  async disconnect() {
    try {
      if (this.connection) {
        await mongoose.disconnect();
        console.log('✅ Desconectado do MongoDB');
      }
    } catch (error) {
      console.error('❌ Erro ao desconectar do MongoDB:', error);
    }
  }

  getConnection() {
    return this.connection;
  }

  // Método para verificar se a conexão está ativa
  isConnected() {
    return mongoose.connection.readyState === 1;
  }

  // Método para obter informações do banco
  async getDatabaseInfo() {
    try {
      const db = mongoose.connection.db;
      const stats = await db.stats();
      
      return {
        name: db.databaseName,
        collections: stats.collections,
        dataSize: stats.dataSize,
        storageSize: stats.storageSize,
        indexes: stats.indexes
      };
    } catch (error) {
      console.error('❌ Erro ao obter informações do banco:', error);
      return null;
    }
  }
}

module.exports = new Database(); 