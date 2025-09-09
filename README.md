# Sistema de Gerenciamento de Biblioteca - API REST

API RESTful desenvolvida com Node.js e MongoDB para gestão completa de bibliotecas, incluindo catalogação, empréstimos, devoluções e gerenciamento de usuários.

## Funcionalidades

- **Gerenciamento de Livros:** Cadastro, edição, busca e remoção de livros no acervo
- **Controle de Usuários:** Cadastro e gerenciamento de usuários com diferentes níveis de acesso (admin, bibliotecário, usuário)
- **Sistema de Empréstimos:** Controle completo de empréstimos, devoluções, renovações e multas por atraso
- **Categorização de Livros:** Organização do acervo por categorias
- **Autenticação e Autorização:** Sistema seguro com JWT para proteção de rotas
- **Documentação Swagger:** Documentação completa e interativa das APIs

## Tecnologias Utilizadas

- **Node.js:** Ambiente de execução JavaScript
- **Express:** Framework web para construção de APIs
- **MongoDB:** Banco de dados NoSQL
- **Mongoose:** ODM para modelagem de dados
- **JWT:** Autenticação baseada em tokens
- **Swagger:** Documentação interativa da API
- **bcryptjs:** Criptografia de senhas

## Pré-requisitos

- Node.js (v14 ou superior)
- MongoDB (local ou remoto)

## Instalação

1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/nl-library-api.git
cd nl-library-api
```

2. Instale as dependências

```bash
npm install
```

3. Configure as variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/biblioteca
JWT_SECRET=chave_super_secreta_biblioteca123
JWT_EXPIRES_IN=24h
```

4. Inicie o servidor

```bash
npm start
# Ou para desenvolvimento
npm run dev
```

## Estrutura do Projeto

```
├── src/
│   ├── config/        # Configurações (banco de dados, etc)
│   ├── controllers/   # Controladores da aplicação
│   ├── middlewares/   # Middlewares personalizados
│   ├── models/        # Modelos Mongoose
│   ├── routes/        # Rotas da API
│   └── index.js       # Ponto de entrada da aplicação
├── .env               # Variáveis de ambiente
├── package.json       # Dependências e scripts
└── README.md         # Documentação
```

## Uso da API

Após iniciar o servidor, acesse a documentação Swagger em:

```
http://localhost:3000/api-docs
```

### Autenticação

Para acessar as rotas protegidas, é necessário enviar o token JWT no header:

```
Authorization: Bearer seu_token_jwt
```

### Exemplos de Uso

#### Login

```bash
curl -X POST http://localhost:3000/api/usuarios/login \
  -H "Content-Type: application/json" \
  -d '{"email": "usuario@exemplo.com", "senha": "senha123"}'
```

#### Listar Livros

```bash
curl -X GET http://localhost:3000/api/livros \
  -H "Authorization: Bearer seu_token_jwt"
```

## Permissões e Papéis de Usuários

- **Administrador:** Acesso total ao sistema
- **Bibliotecário:** Gerencia livros, categorias e empréstimos
- **Usuário:** Consulta livros e gerencia seus empréstimos
