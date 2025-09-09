const Livro = require('../models/Livro');
const Categoria = require('../models/Categoria');

// @desc    Obter todos os livros
// @route   GET /api/livros
// @access  Público
exports.getLivros = async (req, res) => {
  try {
    const { titulo, autor, categoria, disponivel } = req.query;
    const filtro = {};

    // Filtros opcionais
    if (titulo) filtro.titulo = { $regex: titulo, $options: 'i' };
    if (autor) filtro.autor = { $regex: autor, $options: 'i' };
    if (categoria) filtro.categoria = categoria;
    if (disponivel === 'true') filtro.disponiveis = { $gt: 0 };
    if (disponivel === 'false') filtro.disponiveis = 0;

    // Paginação
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    // Consulta com população de categoria
    const livros = await Livro.find(filtro)
      .populate('categoria', 'nome')
      .skip(startIndex)
      .limit(limit)
      .sort({ createdAt: -1 });

    // Contagem total para paginação
    const total = await Livro.countDocuments(filtro);

    res.status(200).json({
      sucesso: true,
      total,
      totalPaginas: Math.ceil(total / limit),
      paginaAtual: page,
      quantidadePorPagina: limit,
      data: livros
    });
  } catch (err) {
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao buscar livros',
      erro: err.message
    });
  }
};

// @desc    Obter um livro pelo ID
// @route   GET /api/livros/:id
// @access  Público
exports.getLivro = async (req, res) => {
  try {
    const livro = await Livro.findById(req.params.id).populate('categoria', 'nome');

    if (!livro) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Livro não encontrado'
      });
    }

    res.status(200).json({
      sucesso: true,
      data: livro
    });
  } catch (err) {
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao buscar livro',
      erro: err.message
    });
  }
};

// @desc    Criar um novo livro
// @route   POST /api/livros
// @access  Privado (Admin/Bibliotecário)
exports.criarLivro = async (req, res) => {
  try {
    // Verificar se a categoria existe
    if (req.body.categoria) {
      const categoriaExiste = await Categoria.findById(req.body.categoria);
      if (!categoriaExiste) {
        return res.status(400).json({
          sucesso: false,
          mensagem: 'Categoria não encontrada'
        });
      }
    }

    // Verificar se o ISBN já existe
    if (req.body.isbn) {
      const isbnExiste = await Livro.findOne({ isbn: req.body.isbn });
      if (isbnExiste) {
        return res.status(400).json({
          sucesso: false,
          mensagem: 'ISBN já cadastrado'
        });
      }
    }

    const livro = await Livro.create(req.body);

    res.status(201).json({
      sucesso: true,
      mensagem: 'Livro criado com sucesso',
      data: livro
    });
  } catch (err) {
    res.status(400).json({
      sucesso: false,
      mensagem: 'Erro ao criar livro',
      erro: err.message
    });
  }
};

// @desc    Atualizar um livro
// @route   PUT /api/livros/:id
// @access  Privado (Admin/Bibliotecário)
exports.atualizarLivro = async (req, res) => {
  try {
    const livro = await Livro.findById(req.params.id);

    if (!livro) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Livro não encontrado'
      });
    }

    // Verificar se a categoria existe
    if (req.body.categoria) {
      const categoriaExiste = await Categoria.findById(req.body.categoria);
      if (!categoriaExiste) {
        return res.status(400).json({
          sucesso: false,
          mensagem: 'Categoria não encontrada'
        });
      }
    }

    // Verificar se está tentando alterar o ISBN para um que já existe
    if (req.body.isbn && req.body.isbn !== livro.isbn) {
      const isbnExiste = await Livro.findOne({ isbn: req.body.isbn });
      if (isbnExiste) {
        return res.status(400).json({
          sucesso: false,
          mensagem: 'ISBN já cadastrado'
        });
      }
    }

    // Atualizar a quantidade disponível proporcionalmente se a quantidade total for alterada
    if (req.body.quantidade && req.body.quantidade !== livro.quantidade) {
      // Se estiver aumentando a quantidade
      if (req.body.quantidade > livro.quantidade) {
        const diferenca = req.body.quantidade - livro.quantidade;
        req.body.disponiveis = livro.disponiveis + diferenca;
      } 
      // Se estiver diminuindo a quantidade
      else if (req.body.quantidade < livro.quantidade) {
        const proporcao = livro.disponiveis / livro.quantidade;
        req.body.disponiveis = Math.floor(req.body.quantidade * proporcao);
        
        // Garantir que não fique negativo
        if (req.body.disponiveis < 0) {
          req.body.disponiveis = 0;
        }
      }
    }

    const livroAtualizado = await Livro.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('categoria', 'nome');

    res.status(200).json({
      sucesso: true,
      mensagem: 'Livro atualizado com sucesso',
      data: livroAtualizado
    });
  } catch (err) {
    res.status(400).json({
      sucesso: false,
      mensagem: 'Erro ao atualizar livro',
      erro: err.message
    });
  }
};

// @desc    Excluir um livro
// @route   DELETE /api/livros/:id
// @access  Privado (Admin)
exports.excluirLivro = async (req, res) => {
  try {
    const livro = await Livro.findById(req.params.id);

    if (!livro) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Livro não encontrado'
      });
    }

    // Verificar se há empréstimos ativos deste livro antes de excluir
    // Essa verificação será implementada após criarmos o modelo de Emprestimo
    // Por enquanto, apenas exclua o livro

    await livro.deleteOne();

    res.status(200).json({
      sucesso: true,
      mensagem: 'Livro excluído com sucesso',
      data: {}
    });
  } catch (err) {
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao excluir livro',
      erro: err.message
    });
  }
};

// @desc    Buscar livros por texto
// @route   GET /api/livros/busca
// @access  Público
exports.buscarLivros = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Por favor, forneça um termo de busca'
      });
    }

    const livros = await Livro.find({
      $text: { $search: q }
    }).populate('categoria', 'nome');

    res.status(200).json({
      sucesso: true,
      total: livros.length,
      data: livros
    });
  } catch (err) {
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao buscar livros',
      erro: err.message
    });
  }
};
