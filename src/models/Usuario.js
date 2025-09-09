const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const usuarioSchema = new mongoose.Schema(
  {
    nome: {
      type: String,
      required: [true, 'O nome é obrigatório'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'O email é obrigatório'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Por favor, forneça um email válido']
    },
    senha: {
      type: String,
      required: [true, 'A senha é obrigatória'],
      minlength: 6,
      select: false
    },
    tipo: {
      type: String,
      enum: ['admin', 'bibliotecario', 'usuario'],
      default: 'usuario'
    },
    documento: {
      tipo: {
        type: String,
        enum: ['cpf', 'rg'],
        required: [true, 'O tipo de documento é obrigatório']
      },
      numero: {
        type: String,
        required: [true, 'O número do documento é obrigatório'],
        unique: true
      }
    },
    telefone: {
      type: String,
      required: [true, 'O telefone é obrigatório']
    },
    endereco: {
      logradouro: String,
      numero: String,
      complemento: String,
      bairro: String,
      cidade: String,
      estado: String,
      cep: String
    },
    foto: {
      type: String,
      default: 'default-user.jpg'
    },
    ativo: {
      type: Boolean,
      default: true
    },
    dataNascimento: {
      type: Date,
      required: [true, 'A data de nascimento é obrigatória']
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date
  },
  {
    timestamps: true
  }
);

// Middleware para criptografar senha antes de salvar
usuarioSchema.pre('save', async function(next) {
  // Se a senha não foi modificada, prossiga
  if (!this.isModified('senha')) {
    return next();
  }
  
  // Criptografar a senha com bcrypt
  const salt = await bcrypt.genSalt(10);
  this.senha = await bcrypt.hash(this.senha, salt);
  next();
});

// Método para verificar senha
usuarioSchema.methods.verificarSenha = async function(senhaFornecida) {
  return await bcrypt.compare(senhaFornecida, this.senha);
};

const Usuario = mongoose.model('Usuario', usuarioSchema);

module.exports = Usuario;
