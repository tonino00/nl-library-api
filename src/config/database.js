const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Conectado: ${conn.connection.host}`);
    
    // Manipular erros após a conexão inicial
    mongoose.connection.on('error', (err) => {
      console.error(`Erro na conexão MongoDB: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB desconectado. Tentando reconectar...');
    });

    // Manipular encerramento do aplicativo
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('Conexão MongoDB fechada por encerramento do aplicativo');
      process.exit(0);
    });
    
  } catch (error) {
    console.error(`Erro na conexão com MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
