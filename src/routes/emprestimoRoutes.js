const express = require('express');
const router = express.Router();
const {
  getEmprestimos,
  getEmprestimosUsuario,
  getEmprestimosLivro,
  getEmprestimo,
  criarEmprestimo,
  renovarEmprestimo,
  devolverEmprestimo,
  pagarMulta,
  getEmprestimosAtrasados
} = require('../controllers/emprestimoController');
const { protect, autorizar, verificarProprietario } = require('../middlewares/auth');
const Emprestimo = require('../models/Emprestimo');

/**
 * @swagger
 * components:
 *   schemas:
 *     Emprestimo:
 *       type: object
 *       required:
 *         - usuario
 *         - livro
 *         - dataPrevistaDevolucao
 *       properties:
 *         _id:
 *           type: string
 *           description: ID automático gerado pelo MongoDB
 *         usuario:
 *           type: string
 *           description: ID do usuário que realizou o empréstimo
 *         livro:
 *           type: string
 *           description: ID do livro emprestado
 *         dataEmprestimo:
 *           type: string
 *           format: date-time
 *           description: Data em que o empréstimo foi realizado
 *           default: Data atual
 *         dataPrevistaDevolucao:
 *           type: string
 *           format: date-time
 *           description: Data prevista para devolução
 *         dataDevolucao:
 *           type: string
 *           format: date-time
 *           description: Data em que o livro foi devolvido
 *         status:
 *           type: string
 *           enum: [emprestado, devolvido, atrasado]
 *           default: emprestado
 *           description: Status do empréstimo
 *         multa:
 *           type: object
 *           properties:
 *             valor:
 *               type: number
 *               description: Valor da multa por atraso
 *               default: 0
 *             pago:
 *               type: boolean
 *               description: Indica se a multa foi paga
 *               default: false
 *             dataPagamento:
 *               type: string
 *               format: date-time
 *               description: Data em que a multa foi paga
 *         renovacoes:
 *           type: number
 *           description: Número de renovações realizadas
 *           default: 0
 *         observacoes:
 *           type: string
 *           description: Observações sobre o empréstimo
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
 * /api/emprestimos:
 *   get:
 *     summary: Lista todos os empréstimos
 *     description: Retorna uma lista paginada de empréstimos (requer autenticação de admin/bibliotecário)
 *     parameters:
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
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [emprestado, devolvido, atrasado]
 *         description: Filtrar por status do empréstimo
 *       - in: query
 *         name: usuario
 *         schema:
 *           type: string
 *         description: ID do usuário para filtrar
 *       - in: query
 *         name: livro
 *         schema:
 *           type: string
 *         description: ID do livro para filtrar
 *       - in: query
 *         name: dataInicio
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de início para filtro (formato YYYY-MM-DD)
 *       - in: query
 *         name: dataFim
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de fim para filtro (formato YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Lista de empréstimos retornada com sucesso
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Permissão negada
 *       500:
 *         description: Erro no servidor
 */
router.get('/', protect, autorizar('admin', 'bibliotecario'), getEmprestimos);

/**
 * @swagger
 * /api/emprestimos/atrasados:
 *   get:
 *     summary: Lista empréstimos atrasados
 *     description: Retorna todos os empréstimos com status atrasado
 *     responses:
 *       200:
 *         description: Lista de empréstimos atrasados retornada com sucesso
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Permissão negada
 *       500:
 *         description: Erro no servidor
 */
router.get('/atrasados', protect, autorizar('admin', 'bibliotecario'), getEmprestimosAtrasados);

/**
 * @swagger
 * /api/emprestimos/usuario/{id}:
 *   get:
 *     summary: Lista empréstimos de um usuário específico
 *     description: Retorna todos os empréstimos de um determinado usuário
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID do usuário
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [emprestado, devolvido, atrasado]
 *         description: Filtrar por status do empréstimo
 *     responses:
 *       200:
 *         description: Lista de empréstimos do usuário retornada com sucesso
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Permissão negada
 *       404:
 *         description: Usuário não encontrado
 *       500:
 *         description: Erro no servidor
 */
router.get('/usuario/:id', protect, (req, res, next) => {
  // Permitir que usuários vejam seus próprios empréstimos
  if (req.usuario._id.toString() === req.params.id || ['admin', 'bibliotecario'].includes(req.usuario.tipo)) {
    return next();
  }
  return res.status(403).json({
    sucesso: false,
    mensagem: 'Acesso negado'
  });
}, getEmprestimosUsuario);

/**
 * @swagger
 * /api/emprestimos/livro/{id}:
 *   get:
 *     summary: Lista empréstimos de um livro específico
 *     description: Retorna todos os empréstimos de um determinado livro
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID do livro
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [emprestado, devolvido, atrasado]
 *         description: Filtrar por status do empréstimo
 *     responses:
 *       200:
 *         description: Lista de empréstimos do livro retornada com sucesso
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Permissão negada
 *       404:
 *         description: Livro não encontrado
 *       500:
 *         description: Erro no servidor
 */
router.get('/livro/:id', protect, autorizar('admin', 'bibliotecario'), getEmprestimosLivro);

/**
 * @swagger
 * /api/emprestimos/{id}:
 *   get:
 *     summary: Obtém um empréstimo pelo ID
 *     description: Retorna os detalhes de um empréstimo específico
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID do empréstimo
 *     responses:
 *       200:
 *         description: Empréstimo encontrado
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Permissão negada
 *       404:
 *         description: Empréstimo não encontrado
 *       500:
 *         description: Erro no servidor
 */
router.get('/:id', protect, verificarProprietario(Emprestimo), getEmprestimo);

/**
 * @swagger
 * /api/emprestimos:
 *   post:
 *     summary: Cria um novo empréstimo
 *     description: Realiza um empréstimo de livro para um usuário
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - usuario
 *               - livro
 *             properties:
 *               usuario:
 *                 type: string
 *                 description: ID do usuário
 *               livro:
 *                 type: string
 *                 description: ID do livro
 *               dataPrevistaDevolucao:
 *                 type: string
 *                 format: date
 *                 description: Data prevista para devolução (padrão 14 dias após o empréstimo)
 *     responses:
 *       201:
 *         description: Empréstimo realizado com sucesso
 *       400:
 *         description: Dados inválidos, livro indisponível, ou usuário com empréstimos em atraso
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Permissão negada
 *       404:
 *         description: Usuário ou livro não encontrado
 *       500:
 *         description: Erro no servidor
 */
router.post('/', protect, autorizar('admin', 'bibliotecario'), criarEmprestimo);

/**
 * @swagger
 * /api/emprestimos/{id}/renovar:
 *   patch:
 *     summary: Renova um empréstimo
 *     description: Estende o prazo de devolução de um empréstimo
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID do empréstimo
 *     responses:
 *       200:
 *         description: Empréstimo renovado com sucesso
 *       400:
 *         description: Não é possível renovar (limite excedido, empréstimo atrasado, etc.)
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Permissão negada
 *       404:
 *         description: Empréstimo não encontrado
 *       500:
 *         description: Erro no servidor
 */
router.patch('/:id/renovar', protect, verificarProprietario(Emprestimo), renovarEmprestimo);

/**
 * @swagger
 * /api/emprestimos/{id}/devolver:
 *   patch:
 *     summary: Registra a devolução de um empréstimo
 *     description: Marca um empréstimo como devolvido e aplica multas se necessário
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID do empréstimo
 *     responses:
 *       200:
 *         description: Devolução registrada com sucesso
 *       400:
 *         description: Empréstimo já devolvido
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Permissão negada
 *       404:
 *         description: Empréstimo não encontrado
 *       500:
 *         description: Erro no servidor
 */
router.patch('/:id/devolver', protect, autorizar('admin', 'bibliotecario'), devolverEmprestimo);

/**
 * @swagger
 * /api/emprestimos/{id}/multa/pagar:
 *   patch:
 *     summary: Registra o pagamento de multa
 *     description: Marca a multa de um empréstimo como paga
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID do empréstimo
 *     responses:
 *       200:
 *         description: Pagamento registrado com sucesso
 *       400:
 *         description: Não há multa a ser paga ou multa já paga
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Permissão negada
 *       404:
 *         description: Empréstimo não encontrado
 *       500:
 *         description: Erro no servidor
 */
router.patch('/:id/multa/pagar', protect, autorizar('admin', 'bibliotecario'), pagarMulta);

module.exports = router;
