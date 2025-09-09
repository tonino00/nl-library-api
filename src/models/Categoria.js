const mongoose = require('mongoose');

const categoriaSchema = new mongoose.Schema(
  {
    nome: {
      type: String,
      required: [true, 'O nome da categoria é obrigatório'],
      unique: true,
      trim: true
    },
    descricao: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

// Indexação para pesquisa
categoriaSchema.index({ nome: 'text', descricao: 'text' });

const Categoria = mongoose.model('Categoria', categoriaSchema);

module.exports = Categoria;
