const mongoose = require('mongoose');
require('dotenv').config();

// Conectar ao MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('Conectado ao MongoDB');
  
  try {
    // Remover o índice antigo
    await mongoose.connection.db.collection('usuarios').dropIndex('documento.numero_1');
    console.log('Índice documento.numero_1 removido com sucesso');
  } catch (err) {
    console.error('Erro ao remover índice:', err);
  }
  
  // Desconectar do banco de dados
  mongoose.disconnect();
  console.log('Desconectado do MongoDB');
}).catch(err => {
  console.error('Erro na conexão com MongoDB:', err);
});
