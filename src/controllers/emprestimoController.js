const Emprestimo = require('../models/Emprestimo');
const Livro = require('../models/Livro');
const Usuario = require('../models/Usuario');

// @desc    Obter todos os empréstimos
// @route   GET /api/emprestimos
// @access  Privado (Admin/Bibliotecario)
exports.getEmprestimos = async (req, res) => {
  try {
    // Filtros opcionais
    const filtro = {};
    if (req.query.status) filtro.status = req.query.status;
    if (req.query.usuario) filtro.usuario = req.query.usuario;
    if (req.query.livro) filtro.livro = req.query.livro;
    
    // Filtro por data de empréstimo
    if (req.query.dataInicio || req.query.dataFim) {
      filtro.dataEmprestimo = {};
      if (req.query.dataInicio) {
        filtro.dataEmprestimo.$gte = new Date(req.query.dataInicio);
      }
      if (req.query.dataFim) {
        filtro.dataEmprestimo.$lte = new Date(req.query.dataFim);
      }
    }

    // Paginação
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    // Buscar empréstimos
    const emprestimos = await Emprestimo.find(filtro)
      .populate('usuario', 'nome email')
      .populate('livro', 'titulo autor isbn')
      .skip(startIndex)
      .limit(limit)
      .sort({ dataEmprestimo: -1 });

    // Contagem total para paginação
    const total = await Emprestimo.countDocuments(filtro);

    res.status(200).json({
      sucesso: true,
      total,
      totalPaginas: Math.ceil(total / limit),
      paginaAtual: page,
      quantidadePorPagina: limit,
      data: emprestimos
    });
  } catch (err) {
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao buscar empréstimos',
      erro: err.message
    });
  }
};

// @desc    Obter empréstimos de um usuário específico
// @route   GET /api/emprestimos/usuario/:id
// @access  Privado (Admin/Bibliotecario/Próprio usuário)
exports.getEmprestimosUsuario = async (req, res) => {
  try {
    const usuarioId = req.params.id;
    
    // Verificar se o usuário existe
    const usuario = await Usuario.findById(usuarioId);
    if (!usuario) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Usuário não encontrado'
      });
    }

    // Filtrar por status (opcional)
    const filtro = { usuario: usuarioId };
    if (req.query.status) filtro.status = req.query.status;

    // Buscar empréstimos do usuário
    const emprestimos = await Emprestimo.find(filtro)
      .populate('livro', 'titulo autor isbn capa')
      .sort({ dataEmprestimo: -1 });

    res.status(200).json({
      sucesso: true,
      total: emprestimos.length,
      data: emprestimos
    });
  } catch (err) {
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao buscar empréstimos do usuário',
      erro: err.message
    });
  }
};

// @desc    Obter empréstimos de um livro específico
// @route   GET /api/emprestimos/livro/:id
// @access  Privado (Admin/Bibliotecario)
exports.getEmprestimosLivro = async (req, res) => {
  try {
    const livroId = req.params.id;
    
    // Verificar se o livro existe
    const livro = await Livro.findById(livroId);
    if (!livro) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Livro não encontrado'
      });
    }

    // Filtrar por status (opcional)
    const filtro = { livro: livroId };
    if (req.query.status) filtro.status = req.query.status;

    // Buscar empréstimos do livro
    const emprestimos = await Emprestimo.find(filtro)
      .populate('usuario', 'nome email')
      .sort({ dataEmprestimo: -1 });

    res.status(200).json({
      sucesso: true,
      total: emprestimos.length,
      data: emprestimos
    });
  } catch (err) {
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao buscar empréstimos do livro',
      erro: err.message
    });
  }
};

// @desc    Obter um empréstimo pelo ID
// @route   GET /api/emprestimos/:id
// @access  Privado (Admin/Bibliotecario/Próprio usuário do empréstimo)
exports.getEmprestimo = async (req, res) => {
  try {
    const emprestimo = await Emprestimo.findById(req.params.id)
      .populate('usuario', 'nome email documento telefone')
      .populate('livro', 'titulo autor isbn editora anoPublicacao');

    if (!emprestimo) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Empréstimo não encontrado'
      });
    }

    res.status(200).json({
      sucesso: true,
      data: emprestimo
    });
  } catch (err) {
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao buscar empréstimo',
      erro: err.message
    });
  }
};

// @desc    Criar um novo empréstimo
// @route   POST /api/emprestimos
// @access  Privado (Admin/Bibliotecario)
exports.criarEmprestimo = async (req, res) => {
  try {
    const { usuario: usuarioId, livro: livroId, dataPrevistaDevolucao } = req.body;

    // Verificar se o usuário existe e está ativo
    const usuario = await Usuario.findById(usuarioId);
    if (!usuario) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Usuário não encontrado'
      });
    }
    if (!usuario.ativo) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Usuário inativo não pode realizar empréstimos'
      });
    }

    // Verificar se o livro existe e está disponível
    const livro = await Livro.findById(livroId);
    if (!livro) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Livro não encontrado'
      });
    }
    if (livro.disponiveis <= 0) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Não há exemplares disponíveis deste livro'
      });
    }

    // Verificar se o usuário já tem empréstimos atrasados
    const emprestimosAtrasados = await Emprestimo.find({
      usuario: usuarioId,
      status: 'atrasado'
    });
    if (emprestimosAtrasados.length > 0) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Usuário possui empréstimos em atraso'
      });
    }

    // Verificar limite de empréstimos ativos por usuário (por exemplo, máximo 3)
    const emprestimosAtivos = await Emprestimo.countDocuments({
      usuario: usuarioId,
      status: 'emprestado'
    });
    if (emprestimosAtivos >= 3) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Usuário atingiu o limite de empréstimos ativos'
      });
    }

    // Criar empréstimo
    const emprestimo = await Emprestimo.create({
      usuario: usuarioId,
      livro: livroId,
      dataPrevistaDevolucao: dataPrevistaDevolucao || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // Padrão: 14 dias
      status: 'emprestado'
    });

    // Atualizar quantidade disponível do livro
    livro.disponiveis -= 1;
    await livro.save();

    // Retornar o empréstimo com informações do usuário e livro
    const emprestimoCompleto = await Emprestimo.findById(emprestimo._id)
      .populate('usuario', 'nome email')
      .populate('livro', 'titulo autor isbn');

    res.status(201).json({
      sucesso: true,
      mensagem: 'Empréstimo realizado com sucesso',
      data: emprestimoCompleto
    });
  } catch (err) {
    res.status(400).json({
      sucesso: false,
      mensagem: 'Erro ao realizar empréstimo',
      erro: err.message
    });
  }
};

// @desc    Renovar um empréstimo
// @route   PATCH /api/emprestimos/:id/renovar
// @access  Privado (Admin/Bibliotecario/Próprio usuário do empréstimo)
exports.renovarEmprestimo = async (req, res) => {
  try {
    const emprestimo = await Emprestimo.findById(req.params.id);

    if (!emprestimo) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Empréstimo não encontrado'
      });
    }

    try {
      // O método renovar() já faz todas as verificações necessárias
      emprestimo.renovar();
      await emprestimo.save();

      // Retornar o empréstimo atualizado
      const emprestimoAtualizado = await Emprestimo.findById(emprestimo._id)
        .populate('usuario', 'nome email')
        .populate('livro', 'titulo autor isbn');

      res.status(200).json({
        sucesso: true,
        mensagem: 'Empréstimo renovado com sucesso',
        data: emprestimoAtualizado
      });
    } catch (error) {
      return res.status(400).json({
        sucesso: false,
        mensagem: error.message
      });
    }
  } catch (err) {
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao renovar empréstimo',
      erro: err.message
    });
  }
};

// @desc    Devolver um empréstimo
// @route   PATCH /api/emprestimos/:id/devolver
// @access  Privado (Admin/Bibliotecario)
exports.devolverEmprestimo = async (req, res) => {
  try {
    const emprestimo = await Emprestimo.findById(req.params.id);

    if (!emprestimo) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Empréstimo não encontrado'
      });
    }

    // Verificar se já foi devolvido
    if (emprestimo.status === 'devolvido') {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Este empréstimo já foi devolvido'
      });
    }

    // Registrar devolução
    emprestimo.dataDevolucao = new Date();
    emprestimo.status = 'devolvido';
    
    // Calcular multa se necessário
    if (emprestimo.dataDevolucao > emprestimo.dataPrevistaDevolucao) {
      const valorMulta = emprestimo.calcularMulta();
      emprestimo.multa.valor = valorMulta;
      
      // Registrar observação sobre atraso
      const diasAtraso = Math.floor(
        (emprestimo.dataDevolucao - emprestimo.dataPrevistaDevolucao) / (1000 * 60 * 60 * 24)
      );
      emprestimo.observacoes = `Devolução com ${diasAtraso} dias de atraso. Multa aplicada: R$ ${valorMulta.toFixed(2)}`;
    }

    await emprestimo.save();

    // Atualizar quantidade disponível do livro
    const livro = await Livro.findById(emprestimo.livro);
    if (livro) {
      livro.disponiveis += 1;
      await livro.save();
    }

    // Retornar o empréstimo atualizado
    const emprestimoAtualizado = await Emprestimo.findById(emprestimo._id)
      .populate('usuario', 'nome email')
      .populate('livro', 'titulo autor isbn');

    res.status(200).json({
      sucesso: true,
      mensagem: 'Empréstimo devolvido com sucesso',
      multa: emprestimo.multa.valor > 0 ? {
        valor: emprestimo.multa.valor,
        mensagem: `Multa aplicada por atraso: R$ ${emprestimo.multa.valor.toFixed(2)}`
      } : null,
      data: emprestimoAtualizado
    });
  } catch (err) {
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao devolver empréstimo',
      erro: err.message
    });
  }
};

// @desc    Registrar pagamento de multa
// @route   PATCH /api/emprestimos/:id/multa/pagar
// @access  Privado (Admin/Bibliotecario)
exports.pagarMulta = async (req, res) => {
  try {
    const emprestimo = await Emprestimo.findById(req.params.id);

    if (!emprestimo) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Empréstimo não encontrado'
      });
    }

    // Verificar se há multa a ser paga
    if (emprestimo.multa.valor <= 0) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Não há multa a ser paga neste empréstimo'
      });
    }

    // Verificar se a multa já foi paga
    if (emprestimo.multa.pago) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'A multa deste empréstimo já foi paga'
      });
    }

    // Registrar pagamento
    emprestimo.multa.pago = true;
    emprestimo.multa.dataPagamento = new Date();
    
    // Adicionar observação
    const observacao = `Multa de R$ ${emprestimo.multa.valor.toFixed(2)} paga em ${new Date().toLocaleDateString('pt-BR')}`;
    emprestimo.observacoes = emprestimo.observacoes
      ? `${emprestimo.observacoes}. ${observacao}`
      : observacao;

    await emprestimo.save();

    res.status(200).json({
      sucesso: true,
      mensagem: 'Pagamento de multa registrado com sucesso',
      data: {
        id: emprestimo._id,
        multa: emprestimo.multa
      }
    });
  } catch (err) {
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao registrar pagamento de multa',
      erro: err.message
    });
  }
};

// @desc    Listar empréstimos atrasados
// @route   GET /api/emprestimos/atrasados
// @access  Privado (Admin/Bibliotecario)
exports.getEmprestimosAtrasados = async (req, res) => {
  try {
    // Buscar empréstimos atrasados
    const emprestimosAtrasados = await Emprestimo.find({
      status: 'atrasado'
    })
      .populate('usuario', 'nome email telefone')
      .populate('livro', 'titulo autor isbn')
      .sort({ dataPrevistaDevolucao: 1 }); // Ordenar pelos mais antigos primeiro

    res.status(200).json({
      sucesso: true,
      total: emprestimosAtrasados.length,
      data: emprestimosAtrasados
    });
  } catch (err) {
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao buscar empréstimos atrasados',
      erro: err.message
    });
  }
};

// @desc    Reservar um livro
// @route   POST /api/emprestimos/reservar
// @access  Privado (Todos os usuários)
exports.reservarLivro = async (req, res) => {
  try {
    const { livro: livroId } = req.body;
    const usuarioId = req.usuario._id;

    // Verificar se o livro existe
    const livro = await Livro.findById(livroId);
    if (!livro) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Livro não encontrado'
      });
    }

    // Verificar se há exemplares disponíveis para reserva
    if (livro.disponiveis <= 0) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Não há exemplares disponíveis deste livro para reserva'
      });
    }

    // Verificar se o usuário já tem empréstimos atrasados
    const emprestimosAtrasados = await Emprestimo.find({
      usuario: usuarioId,
      status: 'atrasado'
    });
    if (emprestimosAtrasados.length > 0) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Usuário possui empréstimos em atraso'
      });
    }

    // Verificar se já existe uma reserva/empréstimo ativo deste livro para este usuário
    const emprestimosAtivos = await Emprestimo.find({
      usuario: usuarioId,
      livro: livroId,
      status: { $in: ['reservado', 'emprestado'] }
    });

    if (emprestimosAtivos.length > 0) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Você já possui uma reserva ou empréstimo ativo deste livro'
      });
    }

    // Criar reserva (válida por 2 dias)
    const dataExpiracao = new Date();
    dataExpiracao.setDate(dataExpiracao.getDate() + 2);

    const reserva = await Emprestimo.create({
      usuario: usuarioId,
      livro: livroId,
      dataPrevistaDevolucao: dataExpiracao,
      status: 'reservado'
    });

    // Atualizar quantidade disponível do livro
    livro.disponiveis -= 1;
    await livro.save();

    // Retornar a reserva com informações do usuário e livro
    const reservaCompleta = await Emprestimo.findById(reserva._id)
      .populate('usuario', 'nome email')
      .populate('livro', 'titulo autor isbn');

    res.status(201).json({
      sucesso: true,
      mensagem: 'Livro reservado com sucesso. A reserva é válida por 2 dias.',
      data: reservaCompleta
    });
  } catch (err) {
    res.status(400).json({
      sucesso: false,
      mensagem: 'Erro ao reservar livro',
      erro: err.message
    });
  }
};

// @desc    Confirmar uma reserva e transformá-la em empréstimo
// @route   PATCH /api/emprestimos/:id/confirmar
// @access  Privado (Admin)
exports.confirmarReserva = async (req, res) => {
  try {
    const reserva = await Emprestimo.findById(req.params.id);

    if (!reserva) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Reserva não encontrada'
      });
    }

    // Verificar se é realmente uma reserva
    if (reserva.status !== 'reservado') {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Este registro não é uma reserva'
      });
    }

    // Converter para empréstimo
    const dataEmprestimo = new Date();
    const dataPrevista = new Date();
    dataPrevista.setDate(dataPrevista.getDate() + 14); // 14 dias para devolução

    reserva.dataEmprestimo = dataEmprestimo;
    reserva.dataPrevistaDevolucao = dataPrevista;
    reserva.status = 'emprestado';

    await reserva.save();

    const emprestimoAtualizado = await Emprestimo.findById(reserva._id)
      .populate('usuario', 'nome email')
      .populate('livro', 'titulo autor isbn');

    res.status(200).json({
      sucesso: true,
      mensagem: 'Reserva confirmada e convertida em empréstimo',
      data: emprestimoAtualizado
    });
  } catch (err) {
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao confirmar reserva',
      erro: err.message
    });
  }
};

// @desc    Atualizar a data prevista de devolução de um empréstimo
// @route   PUT /api/emprestimos/:id
// @access  Privado (Admin/Bibliotecario)
exports.atualizarEmprestimo = async (req, res) => {
  try {
    const { dataPrevistaDevolucao } = req.body;

    if (!dataPrevistaDevolucao) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Data prevista de devolução é obrigatória'
      });
    }

    // Verificar se a data é válida
    const novaData = new Date(dataPrevistaDevolucao);
    if (isNaN(novaData.getTime())) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Data prevista de devolução inválida'
      });
    }

    const emprestimo = await Emprestimo.findById(req.params.id);

    if (!emprestimo) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Empréstimo não encontrado'
      });
    }

    // Verificar se o empréstimo já foi devolvido
    if (emprestimo.status === 'devolvido') {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Não é possível atualizar um empréstimo já devolvido'
      });
    }

    // Atualizar a data prevista de devolução
    emprestimo.dataPrevistaDevolucao = novaData;
    
    // Se o empréstimo estava atrasado, verificar se com a nova data ainda está atrasado
    const hoje = new Date();
    if (emprestimo.status === 'atrasado' && novaData >= hoje) {
      emprestimo.status = 'emprestado';
    } else if (emprestimo.status === 'emprestado' && novaData < hoje) {
      emprestimo.status = 'atrasado';
    }

    await emprestimo.save();

    const emprestimoAtualizado = await Emprestimo.findById(emprestimo._id)
      .populate('usuario', 'nome email')
      .populate('livro', 'titulo autor isbn');

    res.status(200).json({
      sucesso: true,
      mensagem: 'Data prevista de devolução atualizada com sucesso',
      data: emprestimoAtualizado
    });
  } catch (err) {
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao atualizar empréstimo',
      erro: err.message
    });
  }
};

// @desc    Remover um empréstimo
// @route   DELETE /api/emprestimos/:id
// @access  Privado (Admin)
exports.removerEmprestimo = async (req, res) => {
  try {
    const emprestimo = await Emprestimo.findById(req.params.id);

    if (!emprestimo) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Empréstimo não encontrado'
      });
    }

    // Se o empréstimo estiver com status 'emprestado' ou 'reservado', devolver o livro ao estoque
    if (emprestimo.status === 'emprestado' || emprestimo.status === 'reservado') {
      const livro = await Livro.findById(emprestimo.livro);
      if (livro) {
        livro.disponiveis += 1;
        await livro.save();
      }
    }

    // Remover o empréstimo
    await Emprestimo.findByIdAndDelete(req.params.id);

    res.status(200).json({
      sucesso: true,
      mensagem: 'Empréstimo removido com sucesso'
    });
  } catch (err) {
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao remover empréstimo',
      erro: err.message
    });
  }
};
