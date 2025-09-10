const express = require('express');
const router = express.Router();
const {
  getCategorias,
  getCategoria,
  criarCategoria,
  atualizarCategoria,
  excluirCategoria,
  getLivrosPorCategoria
} = require('../controllers/categoriaController');
const { protect, autorizar } = require('../middlewares/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     Categoria:
 *       type: object
 *       required:
 *         - nome
 *       properties:
 *         _id:
 *           type: string
 *           description: ID automático gerado pelo MongoDB
 *         nome:
 *           type: string
 *           description: Nome da categoria
 *         descricao:
 *           type: string
 *           description: Descrição detalhada da categoria
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
 * /api/categorias:
 *   get:
 *     summary: Lista todas as categorias
 *     description: Retorna uma lista de todas as categorias de livros
 *     responses:
 *       200:
 *         description: Lista de categorias retornada com sucesso
 *       500:
 *         description: Erro no servidor
 */
router.get('/', getCategorias);

/**
 * @swagger
 * /api/categorias/{id}:
 *   get:
 *     summary: Obtém uma categoria pelo ID
 *     description: Retorna os detalhes de uma categoria específica
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID da categoria
 *     responses:
 *       200:
 *         description: Categoria encontrada
 *       404:
 *         description: Categoria não encontrada
 *       500:
 *         description: Erro no servidor
 */
router.get('/:id', getCategoria);

/**
 * @swagger
 * /api/categorias/{id}/livros:
 *   get:
 *     summary: Lista livros de uma categoria
 *     description: Retorna uma lista paginada de livros pertencentes a uma categoria específica
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID da categoria
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
 *         description: Lista de livros da categoria retornada com sucesso
 *       404:
 *         description: Categoria não encontrada
 *       500:
 *         description: Erro no servidor
 */
router.get('/:id/livros', getLivrosPorCategoria);

/**
 * @swagger
 * /api/categorias:
 *   post:
 *     summary: Cria uma nova categoria
 *     description: Adiciona uma nova categoria ao sistema
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Categoria'
 *     responses:
 *       201:
 *         description: Categoria criada com sucesso
 *       400:
 *         description: Dados inválidos ou nome duplicado
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Permissão negada
 *       500:
 *         description: Erro no servidor
 */
router.post('/', protect, autorizar('admin'), criarCategoria);

/**
 * @swagger
 * /api/categorias/{id}:
 *   put:
 *     summary: Atualiza uma categoria
 *     description: Atualiza os dados de uma categoria existente
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID da categoria
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Categoria'
 *     responses:
 *       200:
 *         description: Categoria atualizada com sucesso
 *       400:
 *         description: Dados inválidos ou nome duplicado
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Permissão negada
 *       404:
 *         description: Categoria não encontrada
 *       500:
 *         description: Erro no servidor
 */
router.put('/:id', protect, autorizar('admin'), atualizarCategoria);

/**
 * @swagger
 * /api/categorias/{id}:
 *   delete:
 *     summary: Remove uma categoria
 *     description: Exclui uma categoria do sistema (somente se não houver livros associados)
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID da categoria
 *     responses:
 *       200:
 *         description: Categoria excluída com sucesso
 *       400:
 *         description: Não é possível excluir (existem livros associados)
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Permissão negada
 *       404:
 *         description: Categoria não encontrada
 *       500:
 *         description: Erro no servidor
 */
router.delete('/:id', protect, autorizar('admin'), excluirCategoria);

module.exports = router;
