const Usuario = require('../models/Usuario');
const jwt = require('jsonwebtoken');

// @desc    Gerar token JWT
const gerarToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

// @desc    Obter todos os usuários
// @route   GET /api/usuarios
// @access  Privado (Admin)
exports.getUsuarios = async (req, res) => {
  try {
    // Paginação
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    // Filtros opcionais
    const filtro = {};
    if (req.query.tipo) filtro.tipo = req.query.tipo;
    if (req.query.ativo) filtro.ativo = req.query.ativo === 'true';

    const usuarios = await Usuario.find(filtro)
      .select('-senha')
      .skip(startIndex)
      .limit(limit)
      .sort({ createdAt: -1 });

    // Contagem total para paginação
    const total = await Usuario.countDocuments(filtro);

    res.status(200).json({
      sucesso: true,
      total,
      totalPaginas: Math.ceil(total / limit),
      paginaAtual: page,
      quantidadePorPagina: limit,
      data: usuarios
    });
  } catch (err) {
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao buscar usuários',
      erro: err.message
    });
  }
};

// @desc    Obter um usuário pelo ID
// @route   GET /api/usuarios/:id
// @access  Privado (Admin/Próprio usuário)
exports.getUsuario = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id).select('-senha');

    if (!usuario) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Usuário não encontrado'
      });
    }

    res.status(200).json({
      sucesso: true,
      data: usuario
    });
  } catch (err) {
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao buscar usuário',
      erro: err.message
    });
  }
};

// @desc    Registrar novo usuário
// @route   POST /api/usuarios
// @access  Público/Privado (depende da configuração)
exports.registrarUsuario = async (req, res) => {
  try {
    const { email, documento } = req.body;

    // Verificar se o email já existe
    const emailExiste = await Usuario.findOne({ email });
    if (emailExiste) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Email já cadastrado'
      });
    }

    // Verificar se o documento já existe
    if (documento) {
      const documentoExiste = await Usuario.findOne({ documento });
      if (documentoExiste) {
        return res.status(400).json({
          sucesso: false,
          mensagem: 'Documento já cadastrado'
        });
      }
    }

    // Se não especificou o tipo, definir como 'usuario'
    if (!req.body.tipo) {
      req.body.tipo = 'usuario';
    }

    // Apenas admins podem criar outros admins ou bibliotecários
    // Essa verificação será implementada na autenticação

    const usuario = await Usuario.create(req.body);

    // Gerar token
    const token = gerarToken(usuario._id);

    res.status(201).json({
      sucesso: true,
      mensagem: 'Usuário registrado com sucesso',
      token,
      data: {
        _id: usuario._id,
        nome: usuario.nome,
        email: usuario.email,
        tipo: usuario.tipo
      }
    });
  } catch (err) {
    res.status(400).json({
      sucesso: false,
      mensagem: 'Erro ao registrar usuário',
      erro: err.message
    });
  }
};

// @desc    Login de usuário
// @route   POST /api/usuarios/login
// @access  Público
exports.loginUsuario = async (req, res) => {
  try {
    const { email, senha } = req.body;

    // Validar email e senha
    if (!email || !senha) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Por favor, forneça email e senha'
      });
    }

    // Verificar se o usuário existe
    const usuario = await Usuario.findOne({ email }).select('+senha');
    if (!usuario) {
      return res.status(401).json({
        sucesso: false,
        mensagem: 'Credenciais inválidas'
      });
    }

    // Verificar se a senha está correta
    const senhaCorreta = await usuario.verificarSenha(senha);
    if (!senhaCorreta) {
      return res.status(401).json({
        sucesso: false,
        mensagem: 'Credenciais inválidas'
      });
    }

    // Verificar se o usuário está ativo
    if (!usuario.ativo) {
      return res.status(401).json({
        sucesso: false,
        mensagem: 'Usuário desativado'
      });
    }

    // Gerar token
    const token = gerarToken(usuario._id);

    res.status(200).json({
      sucesso: true,
      token,
      data: {
        _id: usuario._id,
        nome: usuario.nome,
        email: usuario.email,
        tipo: usuario.tipo
      }
    });
  } catch (err) {
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro no login',
      erro: err.message
    });
  }
};

// @desc    Atualizar usuário
// @route   PUT /api/usuarios/:id
// @access  Privado (Admin/Próprio usuário)
exports.atualizarUsuario = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id);

    if (!usuario) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Usuário não encontrado'
      });
    }

    // Verificar se o email foi alterado e já existe
    if (req.body.email && req.body.email !== usuario.email) {
      const emailExiste = await Usuario.findOne({ email: req.body.email });
      if (emailExiste) {
        return res.status(400).json({
          sucesso: false,
          mensagem: 'Email já cadastrado'
        });
      }
    }

    // Verificar se o documento foi alterado e já existe
    if (req.body.documento && req.body.documento !== usuario.documento) {
      const documentoExiste = await Usuario.findOne({ documento: req.body.documento });
      if (documentoExiste) {
        return res.status(400).json({
          sucesso: false,
          mensagem: 'Documento já cadastrado'
        });
      }
    }

    // Não permitir alterar tipo de usuário aqui (apenas admins podem, em rota separada)
    delete req.body.tipo;

    const usuarioAtualizado = await Usuario.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).select('-senha');

    res.status(200).json({
      sucesso: true,
      mensagem: 'Usuário atualizado com sucesso',
      data: usuarioAtualizado
    });
  } catch (err) {
    res.status(400).json({
      sucesso: false,
      mensagem: 'Erro ao atualizar usuário',
      erro: err.message
    });
  }
};

// @desc    Alterar tipo de usuário (admin/bibliotecario/usuario)
// @route   PATCH /api/usuarios/:id/tipo
// @access  Privado (Admin)
exports.alterarTipoUsuario = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id);

    if (!usuario) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Usuário não encontrado'
      });
    }

    if (!req.body.tipo || !['admin', 'bibliotecario', 'usuario'].includes(req.body.tipo)) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Tipo de usuário inválido'
      });
    }

    usuario.tipo = req.body.tipo;
    await usuario.save();

    res.status(200).json({
      sucesso: true,
      mensagem: 'Tipo de usuário alterado com sucesso',
      data: {
        _id: usuario._id,
        nome: usuario.nome,
        email: usuario.email,
        tipo: usuario.tipo
      }
    });
  } catch (err) {
    res.status(400).json({
      sucesso: false,
      mensagem: 'Erro ao alterar tipo de usuário',
      erro: err.message
    });
  }
};

// @desc    Ativar/Desativar usuário
// @route   PATCH /api/usuarios/:id/status
// @access  Privado (Admin)
exports.alterarStatusUsuario = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id);

    if (!usuario) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Usuário não encontrado'
      });
    }

    if (req.body.ativo === undefined) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Status ativo não fornecido'
      });
    }

    usuario.ativo = req.body.ativo;
    await usuario.save();

    res.status(200).json({
      sucesso: true,
      mensagem: `Usuário ${req.body.ativo ? 'ativado' : 'desativado'} com sucesso`,
      data: {
        _id: usuario._id,
        nome: usuario.nome,
        email: usuario.email,
        ativo: usuario.ativo
      }
    });
  } catch (err) {
    res.status(400).json({
      sucesso: false,
      mensagem: 'Erro ao alterar status do usuário',
      erro: err.message
    });
  }
};

// @desc    Alterar senha
// @route   PATCH /api/usuarios/:id/senha
// @access  Privado (Próprio usuário)
exports.alterarSenha = async (req, res) => {
  try {
    const { senhaAtual, novaSenha } = req.body;

    if (!senhaAtual || !novaSenha) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Por favor, forneça a senha atual e a nova senha'
      });
    }

    // Verificar se a senha tem pelo menos 6 caracteres
    if (novaSenha.length < 6) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'A nova senha deve ter pelo menos 6 caracteres'
      });
    }

    const usuario = await Usuario.findById(req.params.id).select('+senha');

    if (!usuario) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Usuário não encontrado'
      });
    }

    // Verificar se a senha atual está correta
    const senhaCorreta = await usuario.verificarSenha(senhaAtual);
    if (!senhaCorreta) {
      return res.status(401).json({
        sucesso: false,
        mensagem: 'Senha atual incorreta'
      });
    }

    usuario.senha = novaSenha;
    await usuario.save();

    res.status(200).json({
      sucesso: true,
      mensagem: 'Senha alterada com sucesso'
    });
  } catch (err) {
    res.status(400).json({
      sucesso: false,
      mensagem: 'Erro ao alterar senha',
      erro: err.message
    });
  }
};
