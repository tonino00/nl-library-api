const mongoose = require('mongoose');

const livroSchema = new mongoose.Schema(
  {
    titulo: {
      type: String,
      required: [true, 'O título do livro é obrigatório'],
      trim: true
    },
    autor: {
      type: String,
      required: [true, 'O autor do livro é obrigatório'],
      trim: true
    },
    autorEspiritual: {
      type: String,
      trim: true
    },
    isbn: {
      type: String,
      unique: true,
      required: [true, 'O ISBN do livro é obrigatório'],
      trim: true
    },
    editora: {
      type: String,
      required: [true, 'A editora do livro é obrigatória'],
      trim: true
    },
    anoPublicacao: {
      type: Number,
      required: [true, 'O ano de publicação é obrigatório']
    },
    categoria: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Categoria',
      required: [true, 'A categoria do livro é obrigatória']
    },
    quantidade: {
      type: Number,
      required: [true, 'A quantidade de exemplares é obrigatória'],
      default: 1,
      min: 0
    },
    disponiveis: {
      type: Number,
      default: function() {
        return this.quantidade;
      },
      min: 0
    },
    descricao: {
      type: String,
      trim: true
    },
    localizacao: {
      prateleira: String,
      secao: String
    },
    capa: {
      type: String,
      default: 'default-book.jpg'
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual para calcular disponibilidade
livroSchema.virtual('disponivel').get(function() {
  return this.disponiveis > 0;
});

// Indexação para pesquisa
livroSchema.index({ titulo: 'text', autor: 'text', isbn: 'text' });

// Middleware para garantir que disponiveis nunca seja maior que quantidade
livroSchema.pre('save', function(next) {
  if (this.disponiveis > this.quantidade) {
    this.disponiveis = this.quantidade;
  }
  next();
});

const Livro = mongoose.model('Livro', livroSchema);

module.exports = Livro;
