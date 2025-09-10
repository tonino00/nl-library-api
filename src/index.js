const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const swaggerUI = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');
const dbConnection = require('./config/database');

// Carregar variáveis de ambiente
dotenv.config();

// Inicializar aplicação Express
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuração do Swagger
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Biblioteca API',
      version: '1.0.0',
      description: 'API para sistema de gerenciamento de biblioteca',
      contact: {
        name: 'Suporte',
        email: 'suporte@biblioteca.com'
      }
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production'
          ? ''
          : `http://localhost:${PORT}`,
        description: process.env.NODE_ENV === 'production'
          ? 'Servidor de produção'
          : 'Servidor de desenvolvimento'
      }
    ]
  },
  apis: ['./src/routes/*.js']
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocs));

// Conectar ao banco de dados
dbConnection();

// Rotas
app.use('/api/livros', require('./routes/livroRoutes'));
app.use('/api/usuarios', require('./routes/usuarioRoutes'));
app.use('/api/emprestimos', require('./routes/emprestimoRoutes'));
app.use('/api/categorias', require('./routes/categoriaRoutes'));

// Rota padrão
app.get('/', (req, res) => {
  const baseUrl = process.env.NODE_ENV === 'production'
    ? req.protocol + '://' + req.get('host')
    : `http://localhost:${PORT}`;
    
  res.json({
    mensagem: 'Bem-vindo à API da Biblioteca',
    documentacao: `${baseUrl}/api-docs`
  });
});

// Middleware para tratar erros 404
app.use((req, res) => {
  res.status(404).json({ mensagem: 'Recurso não encontrado' });
});

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  
  const baseUrl = process.env.NODE_ENV === 'production'
    ? 'URL da aplicação em produção' // Será a URL fornecida pelo Render
    : `http://localhost:${PORT}`;
    
  console.log(`Documentação disponível em ${baseUrl}/api-docs`);
  console.log(`Ambiente: ${process.env.NODE_ENV || 'desenvolvimento'}`);
});
