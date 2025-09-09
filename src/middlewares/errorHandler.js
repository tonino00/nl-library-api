// Middleware para tratamento de erros
const errorHandler = (err, req, res, next) => {
  // Log para desenvolvimento
  console.error(err.stack);

  // Erros do Mongoose
  let error = { ...err };
  error.message = err.message;

  // Erro de ID inválido no Mongoose
  if (err.name === 'CastError') {
    const mensagem = 'Recurso não encontrado';
    error = { message: mensagem };
    return res.status(404).json({
      sucesso: false,
      mensagem
    });
  }

  // Erro de validação do Mongoose
  if (err.name === 'ValidationError') {
    const mensagem = Object.values(err.errors).map(val => val.message);
    error = { message: mensagem };
    return res.status(400).json({
      sucesso: false,
      mensagem
    });
  }

  // Erro de campo duplicado
  if (err.code === 11000) {
    const campo = Object.keys(err.keyValue)[0];
    const valor = err.keyValue[campo];
    const mensagem = `${campo} '${valor}' já está em uso`;
    error = { message: mensagem };
    return res.status(400).json({
      sucesso: false,
      mensagem
    });
  }

  // Resposta de erro
  res.status(error.statusCode || 500).json({
    sucesso: false,
    mensagem: error.message || 'Erro interno do servidor'
  });
};

module.exports = errorHandler;
