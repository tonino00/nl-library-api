const express = require('express');
const router = express.Router();
const {
  getLivros,
  getLivro,
  criarLivro,
  atualizarLivro,
  excluirLivro,
  buscarLivros
} = require('../controllers/livroController');
const { protect, autorizar } = require('../middlewares/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     Livro:
 *       type: object
 *       required:
 *         - titulo
 *         - autor
 *         - isbn
 *         - editora
 *         - anoPublicacao
 *         - categoria
 *       properties:
 *         _id:
 *           type: string
 *           description: ID automático gerado pelo MongoDB
 *         titulo:
 *           type: string
 *           description: Título do livro
 *         autor:
 *           type: string
 *           description: Nome do autor do livro
 *         autorEspiritual:
 *           type: string
 *           description: Nome do autor espiritual da obra (opcional)
 *         isbn:
 *           type: string
 *           description: ISBN do livro (único)
 *         editora:
 *           type: string
 *           description: Nome da editora
 *         anoPublicacao:
 *           type: number
 *           description: Ano de publicação do livro
 *         categoria:
 *           type: string
 *           description: ID da categoria do livro
 *         quantidade:
 *           type: number
 *           description: Quantidade total de exemplares
 *           default: 1
 *         disponiveis:
 *           type: number
 *           description: Quantidade de exemplares disponíveis
 *         descricao:
 *           type: string
 *           description: Descrição ou sinopse do livro
 *         localizacao:
 *           type: object
 *           properties:
 *             prateleira:
 *               type: string
 *             secao:
 *               type: string
 *         capa:
 *           type: string
 *           description: URL da imagem da capa
 *           default: default-book.jpg
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Data de criação do registro
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Data da última atualização
 */

/**
 * @swagger
 * /api/livros:
 *   get:
 *     summary: Retorna todos os livros
 *     description: Retorna uma lista paginada de livros com opções de filtros
 *     parameters:
 *       - in: query
 *         name: titulo
 *         schema:
 *           type: string
 *         description: Filtrar por título (parcial)
 *       - in: query
 *         name: autor
 *         schema:
 *           type: string
 *         description: Filtrar por autor (parcial)
 *       - in: query
 *         name: categoria
 *         schema:
 *           type: string
 *         description: Filtrar por ID da categoria
 *       - in: query
 *         name: disponivel
 *         schema:
 *           type: boolean
 *         description: Filtrar por disponibilidade (true/false)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número da página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Itens por página
 *     responses:
 *       200:
 *         description: Lista de livros retornada com sucesso
 *       500:
 *         description: Erro no servidor
 */
router.get('/', getLivros);

/**
 * @swagger
 * /api/livros/busca:
 *   get:
 *     summary: Busca livros por texto
 *     description: Realiza uma busca textual nos campos título, autor e ISBN
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         required: true
 *         description: Termo de busca
 *     responses:
 *       200:
 *         description: Resultados da busca
 *       400:
 *         description: Termo de busca não fornecido
 *       500:
 *         description: Erro no servidor
 */
router.get('/busca', buscarLivros);

/**
 * @swagger
 * /api/livros/{id}:
 *   get:
 *     summary: Obtém um livro pelo ID
 *     description: Retorna os detalhes de um livro específico
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID do livro
 *     responses:
 *       200:
 *         description: Livro encontrado
 *       404:
 *         description: Livro não encontrado
 *       500:
 *         description: Erro no servidor
 */
router.get('/:id', getLivro);

/**
 * @swagger
 * /api/livros:
 *   post:
 *     summary: Cria um novo livro
 *     description: Adiciona um novo livro ao catálogo
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Livro'
 *     responses:
 *       201:
 *         description: Livro criado com sucesso
 *       400:
 *         description: Dados inválidos ou ISBN duplicado
 *       500:
 *         description: Erro no servidor
 */
router.post('/', protect, autorizar('admin'), criarLivro);

/**
 * @swagger
 * /api/livros/{id}:
 *   put:
 *     summary: Atualiza um livro
 *     description: Atualiza os dados de um livro existente
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID do livro
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Livro'
 *     responses:
 *       200:
 *         description: Livro atualizado com sucesso
 *       400:
 *         description: Dados inválidos ou ISBN duplicado
 *       404:
 *         description: Livro não encontrado
 *       500:
 *         description: Erro no servidor
 */
router.put('/:id', protect, autorizar('admin'), atualizarLivro);

/**
 * @swagger
 * /api/livros/{id}:
 *   delete:
 *     summary: Remove um livro
 *     description: Exclui um livro do catálogo
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID do livro
 *     responses:
 *       200:
 *         description: Livro excluído com sucesso
 *       404:
 *         description: Livro não encontrado
 *       500:
 *         description: Erro no servidor
 */
router.delete('/:id', protect, autorizar('admin'), excluirLivro);

module.exports = router;
