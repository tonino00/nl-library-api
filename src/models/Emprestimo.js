const mongoose = require('mongoose');

const emprestimoSchema = new mongoose.Schema(
  {
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      required: [true, 'O usuário é obrigatório']
    },
    livro: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Livro',
      required: [true, 'O livro é obrigatório']
    },
    dataEmprestimo: {
      type: Date,
      default: Date.now
    },
    dataPrevistaDevolucao: {
      type: Date,
      required: [true, 'A data prevista de devolução é obrigatória']
    },
    dataDevolucao: {
      type: Date
    },
    status: {
      type: String,
      enum: ['reservado', 'emprestado', 'devolvido', 'atrasado'],
      default: 'emprestado'
    },
    multa: {
      valor: {
        type: Number,
        default: 0
      },
      pago: {
        type: Boolean,
        default: false
      },
      dataPagamento: {
        type: Date
      }
    },
    renovacoes: {
      type: Number,
      default: 0,
      max: 3 // Máximo de renovações permitidas
    },
    observacoes: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

// Middleware para atualizar status de atrasado
emprestimoSchema.pre('save', function(next) {
  // Se já está devolvido, não precisa verificar
  if (this.status === 'devolvido') {
    return next();
  }

  // Verificar se está atrasado
  const hoje = new Date();
  if (hoje > this.dataPrevistaDevolucao && this.status !== 'atrasado') {
    this.status = 'atrasado';
  }
  
  next();
});

// Método para calcular o valor da multa
emprestimoSchema.methods.calcularMulta = function() {
  if (this.status !== 'atrasado' || this.dataDevolucao) {
    return 0;
  }
  
  const hoje = new Date();
  const diasAtraso = Math.floor((hoje - this.dataPrevistaDevolucao) / (1000 * 60 * 60 * 24));
  
  // Valor de multa por dia (pode ser configurado em variável de ambiente)
  const valorMultaDiaria = 2.0;
  return diasAtraso * valorMultaDiaria;
};

// Método para renovar empréstimo
emprestimoSchema.methods.renovar = function() {
  if (this.renovacoes >= 3) {
    throw new Error('Número máximo de renovações atingido');
  }
  
  if (this.status === 'atrasado') {
    throw new Error('Não é possível renovar um empréstimo atrasado');
  }
  
  if (this.status === 'devolvido') {
    throw new Error('Não é possível renovar um empréstimo já devolvido');
  }
  
  // Adicionar 7 dias à data prevista de devolução
  const novaDataDevolucao = new Date(this.dataPrevistaDevolucao);
  novaDataDevolucao.setDate(novaDataDevolucao.getDate() + 7);
  
  this.dataPrevistaDevolucao = novaDataDevolucao;
  this.renovacoes += 1;
  
  return this;
};

const Emprestimo = mongoose.model('Emprestimo', emprestimoSchema);

module.exports = Emprestimo;
