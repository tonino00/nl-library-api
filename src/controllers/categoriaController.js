const Categoria = require('../models/Categoria');
const Livro = require('../models/Livro');

// @desc    Obter todas as categorias
// @route   GET /api/categorias
// @access  Público
exports.getCategorias = async (req, res) => {
  try {
    const categorias = await Categoria.find().sort({ nome: 1 });

    res.status(200).json({
      sucesso: true,
      total: categorias.length,
      data: categorias
    });
  } catch (err) {
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao buscar categorias',
      erro: err.message
    });
  }
};

// @desc    Obter uma categoria pelo ID
// @route   GET /api/categorias/:id
// @access  Público
exports.getCategoria = async (req, res) => {
  try {
    const categoria = await Categoria.findById(req.params.id);

    if (!categoria) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Categoria não encontrada'
      });
    }

    res.status(200).json({
      sucesso: true,
      data: categoria
    });
  } catch (err) {
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao buscar categoria',
      erro: err.message
    });
  }
};

// @desc    Criar uma nova categoria
// @route   POST /api/categorias
// @access  Privado (Admin/Bibliotecario)
exports.criarCategoria = async (req, res) => {
  try {
    // Verificar se o nome já existe
    const categoriaExiste = await Categoria.findOne({ nome: req.body.nome });
    if (categoriaExiste) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Já existe uma categoria com este nome'
      });
    }

    const categoria = await Categoria.create(req.body);

    res.status(201).json({
      sucesso: true,
      mensagem: 'Categoria criada com sucesso',
      data: categoria
    });
  } catch (err) {
    res.status(400).json({
      sucesso: false,
      mensagem: 'Erro ao criar categoria',
      erro: err.message
    });
  }
};

// @desc    Atualizar uma categoria
// @route   PUT /api/categorias/:id
// @access  Privado (Admin/Bibliotecario)
exports.atualizarCategoria = async (req, res) => {
  try {
    const categoria = await Categoria.findById(req.params.id);

    if (!categoria) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Categoria não encontrada'
      });
    }

    // Verificar se o novo nome já existe (se estiver alterando o nome)
    if (req.body.nome && req.body.nome !== categoria.nome) {
      const categoriaExiste = await Categoria.findOne({ nome: req.body.nome });
      if (categoriaExiste) {
        return res.status(400).json({
          sucesso: false,
          mensagem: 'Já existe uma categoria com este nome'
        });
      }
    }

    const categoriaAtualizada = await Categoria.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      sucesso: true,
      mensagem: 'Categoria atualizada com sucesso',
      data: categoriaAtualizada
    });
  } catch (err) {
    res.status(400).json({
      sucesso: false,
      mensagem: 'Erro ao atualizar categoria',
      erro: err.message
    });
  }
};

// @desc    Excluir uma categoria
// @route   DELETE /api/categorias/:id
// @access  Privado (Admin)
exports.excluirCategoria = async (req, res) => {
  try {
    const categoria = await Categoria.findById(req.params.id);

    if (!categoria) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Categoria não encontrada'
      });
    }

    // Verificar se há livros associados a esta categoria
    const livrosAssociados = await Livro.countDocuments({ categoria: req.params.id });
    if (livrosAssociados > 0) {
      return res.status(400).json({
        sucesso: false,
        mensagem: `Não é possível excluir a categoria pois existem ${livrosAssociados} livros associados a ela`
      });
    }

    await categoria.deleteOne();

    res.status(200).json({
      sucesso: true,
      mensagem: 'Categoria excluída com sucesso',
      data: {}
    });
  } catch (err) {
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao excluir categoria',
      erro: err.message
    });
  }
};

// @desc    Listar livros de uma categoria
// @route   GET /api/categorias/:id/livros
// @access  Público
exports.getLivrosPorCategoria = async (req, res) => {
  try {
    // Verificar se a categoria existe
    const categoria = await Categoria.findById(req.params.id);

    if (!categoria) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Categoria não encontrada'
      });
    }

    // Paginação
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    // Buscar livros da categoria
    const livros = await Livro.find({ categoria: req.params.id })
      .skip(startIndex)
      .limit(limit)
      .sort({ titulo: 1 });

    // Contagem total para paginação
    const total = await Livro.countDocuments({ categoria: req.params.id });

    res.status(200).json({
      sucesso: true,
      total,
      totalPaginas: Math.ceil(total / limit),
      paginaAtual: page,
      quantidadePorPagina: limit,
      nomeCategoria: categoria.nome,
      data: livros
    });
  } catch (err) {
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao buscar livros da categoria',
      erro: err.message
    });
  }
};
