const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

// Middleware para verificar se o usuário está autenticado
exports.protect = async (req, res, next) => {
  let token;

  // Verificar se há token no cabeçalho de autorização
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    // Obter token do cabeçalho
    token = req.headers.authorization.split(' ')[1];
  }

  // Verificar se o token existe
  if (!token) {
    return res.status(401).json({
      sucesso: false,
      mensagem: 'Acesso não autorizado. É necessário fazer login'
    });
  }

  try {
    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Buscar usuário pelo ID no token
    const usuarioAtual = await Usuario.findById(decoded.id);

    // Verificar se o usuário existe
    if (!usuarioAtual) {
      return res.status(401).json({
        sucesso: false,
        mensagem: 'Usuário não encontrado'
      });
    }

    // Verificar se o usuário está ativo
    if (!usuarioAtual.ativo) {
      return res.status(401).json({
        sucesso: false,
        mensagem: 'Usuário desativado. Contate o administrador'
      });
    }

    // Adicionar usuário à requisição
    req.usuario = usuarioAtual;
    next();
  } catch (err) {
    return res.status(401).json({
      sucesso: false,
      mensagem: 'Token inválido ou expirado'
    });
  }
};

// Middleware para verificar os níveis de acesso
exports.autorizar = (...tipos) => {
  return (req, res, next) => {
    // Verificar se o tipo do usuário está incluído nos tipos permitidos
    if (!tipos.includes(req.usuario.tipo)) {
      return res.status(403).json({
        sucesso: false,
        mensagem: `Usuário do tipo ${req.usuario.tipo} não tem permissão para acessar este recurso`
      });
    }
    next();
  };
};

// Middleware para verificar se o usuário é o proprietário do recurso ou um admin/bibliotecário
exports.verificarProprietario = (modelo) => {
  return async (req, res, next) => {
    // Administradores e bibliotecários têm acesso total
    if (['admin', 'bibliotecario'].includes(req.usuario.tipo)) {
      return next();
    }

    // Se não for admin nem bibliotecário, verificar se é o proprietário
    try {
      const recurso = await modelo.findById(req.params.id);

      if (!recurso) {
        return res.status(404).json({
          sucesso: false,
          mensagem: 'Recurso não encontrado'
        });
      }

      // Verificar se o ID do usuário no recurso coincide com o usuário atual
      // Isto funciona para modelos que têm um campo 'usuario' que é o proprietário
      if (recurso.usuario && recurso.usuario.toString() !== req.usuario._id.toString()) {
        return res.status(403).json({
          sucesso: false,
          mensagem: 'Acesso negado. Você não é o proprietário deste recurso'
        });
      }
      
      // Se o ID do recurso é o ID do próprio usuário (para atualizações de perfil)
      if (recurso._id && recurso._id.toString() === req.usuario._id.toString()) {
        return next();
      }

      next();
    } catch (err) {
      return res.status(500).json({
        sucesso: false,
        mensagem: 'Erro ao verificar proprietário',
        erro: err.message
      });
    }
  };
};
