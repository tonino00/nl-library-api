const express = require('express');
const router = express.Router();
const {
  getUsuarios,
  getUsuario,
  registrarUsuario,
  loginUsuario,
  atualizarUsuario,
  alterarTipoUsuario,
  alterarStatusUsuario,
  alterarSenha,
  removerUsuario
} = require('../controllers/usuarioController');
const { protect, autorizar, verificarProprietario } = require('../middlewares/auth');
const Usuario = require('../models/Usuario');

/**
 * @swagger
 * components:
 *   schemas:
 *     Usuario:
 *       type: object
 *       required:
 *         - nome
 *         - email
 *         - senha
 *         - documento
 *         - telefone
 *         - dataNascimento
 *       properties:
 *         _id:
 *           type: string
 *           description: ID automático gerado pelo MongoDB
 *         nome:
 *           type: string
 *           description: Nome completo do usuário
 *         email:
 *           type: string
 *           description: Email do usuário (único)
 *         senha:
 *           type: string
 *           description: Senha do usuário (mínimo 6 caracteres)
 *         tipo:
 *           type: string
 *           enum: [admin, leitor]
 *           default: leitor
 *           description: Tipo/Nível de acesso do usuário
 *         documento:
 *           type: string
 *           description: Documento de identificação do usuário (CPF ou RG)
 *         telefone:
 *           type: string
 *           description: Número de telefone para contato
 *         endereco:
 *           type: object
 *           properties:
 *             logradouro:
 *               type: string
 *             numero:
 *               type: string
 *             complemento:
 *               type: string
 *             bairro:
 *               type: string
 *             cidade:
 *               type: string
 *             estado:
 *               type: string
 *             cep:
 *               type: string
 *           description: Endereço completo
 *         foto:
 *           type: string
 *           description: URL da foto de perfil
 *           default: default-user.jpg
 *         ativo:
 *           type: boolean
 *           description: Indica se o usuário está ativo
 *           default: true
 *         dataNascimento:
 *           type: string
 *           format: date
 *           description: Data de nascimento
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
 * /api/usuarios:
 *   get:
 *     summary: Lista todos os usuários
 *     description: Retorna uma lista paginada de usuários (requer autenticação de admin)
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
 *         name: tipo
 *         schema:
 *           type: string
 *           enum: [admin, leitor]
 *         description: Filtrar por tipo de usuário
 *       - in: query
 *         name: ativo
 *         schema:
 *           type: boolean
 *         description: Filtrar por status (ativo/inativo)
 *     responses:
 *       200:
 *         description: Lista de usuários retornada com sucesso
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Permissão negada
 *       500:
 *         description: Erro no servidor
 */
router.get('/', protect, autorizar('admin'), getUsuarios);

/**
 * @swagger
 * /api/usuarios/{id}:
 *   get:
 *     summary: Obtém um usuário pelo ID
 *     description: Retorna os detalhes de um usuário específico
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID do usuário
 *     responses:
 *       200:
 *         description: Usuário encontrado
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Permissão negada
 *       404:
 *         description: Usuário não encontrado
 *       500:
 *         description: Erro no servidor
 */
router.get('/:id', protect, verificarProprietario(Usuario), getUsuario);

/**
 * @swagger
 * /api/usuarios:
 *   post:
 *     summary: Registra um novo usuário
 *     description: Cria um novo registro de usuário
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Usuario'
 *     responses:
 *       201:
 *         description: Usuário registrado com sucesso
 *       400:
 *         description: Dados inválidos ou email/documento duplicado
 *       500:
 *         description: Erro no servidor
 */
router.post('/', registrarUsuario);

/**
 * @swagger
 * /api/usuarios/login:
 *   post:
 *     summary: Login de usuário
 *     description: Autentica um usuário e retorna um token JWT
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - senha
 *             properties:
 *               email:
 *                 type: string
 *               senha:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login bem-sucedido
 *       400:
 *         description: Dados insuficientes
 *       401:
 *         description: Credenciais inválidas
 *       500:
 *         description: Erro no servidor
 */
router.post('/login', loginUsuario);

/**
 * @swagger
 * /api/usuarios/{id}:
 *   put:
 *     summary: Atualiza um usuário
 *     description: Atualiza os dados de um usuário existente
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID do usuário
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Usuario'
 *     responses:
 *       200:
 *         description: Usuário atualizado com sucesso
 *       400:
 *         description: Dados inválidos ou email/documento duplicado
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Permissão negada
 *       404:
 *         description: Usuário não encontrado
 *       500:
 *         description: Erro no servidor
 */
router.put('/:id', protect, verificarProprietario(Usuario), atualizarUsuario);

/**
 * @swagger
 * /api/usuarios/{id}/tipo:
 *   patch:
 *     summary: Altera o tipo de um usuário
 *     description: Atualiza o nível de acesso de um usuário (requer autenticação de admin)
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID do usuário
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tipo
 *             properties:
 *               tipo: {
 *                 type: String,
 *                 enum: ['admin', 'leitor'],
 *                 default: 'leitor'
 *               }
 *     responses:
 *       200:
 *         description: Tipo de usuário alterado com sucesso
 *       400:
 *         description: Tipo inválido
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Permissão negada
 *       404:
 *         description: Usuário não encontrado
 *       500:
 *         description: Erro no servidor
 */
router.patch('/:id/tipo', protect, autorizar('admin'), alterarTipoUsuario);

/**
 * @swagger
 * /api/usuarios/{id}/status:
 *   patch:
 *     summary: Altera o status de um usuário
 *     description: Ativa ou desativa um usuário (requer autenticação de admin)
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID do usuário
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ativo
 *             properties:
 *               ativo:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Status de usuário alterado com sucesso
 *       400:
 *         description: Parâmetro ativo não fornecido
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Permissão negada
 *       404:
 *         description: Usuário não encontrado
 *       500:
 *         description: Erro no servidor
 */
router.patch('/:id/status', protect, autorizar('admin'), alterarStatusUsuario);

/**
 * @swagger
 * /api/usuarios/{id}/senha:
 *   patch:
 *     summary: Altera a senha de um usuário
 *     description: Atualiza a senha de um usuário existente (requer autenticação do próprio usuário)
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID do usuário
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - senhaAtual
 *               - novaSenha
 *             properties:
 *               senhaAtual:
 *                 type: string
 *               novaSenha:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Senha alterada com sucesso
 *       400:
 *         description: Dados inválidos ou nova senha muito curta
 *       401:
 *         description: Senha atual incorreta
 *       403:
 *         description: Permissão negada
 *       404:
 *         description: Usuário não encontrado
 *       500:
 *         description: Erro no servidor
 */
router.patch('/:id/senha', protect, verificarProprietario(Usuario), alterarSenha);

/**
 * @swagger
 * /api/usuarios/{id}:
 *   delete:
 *     summary: Remove um usuário
 *     description: Remove um usuário pelo ID (requer autenticação de admin)
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID do usuário
 *     responses:
 *       200:
 *         description: Usuário removido com sucesso
 *       400:
 *         description: Usuário não pode ser removido (possui empréstimos ativos)
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Permissão negada
 *       404:
 *         description: Usuário não encontrado
 *       500:
 *         description: Erro no servidor
 */
router.delete('/:id', protect, autorizar('admin'), removerUsuario);

module.exports = router;
