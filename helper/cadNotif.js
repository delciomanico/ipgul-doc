const mongoose = require('mongoose')

require('../models/Notificacoes')

const Notificacao = mongoose.model('notificacoes')

async function cadastrarNotif(autor, conteudo, tipo) {
    try {
        // Cria um novo documento com os dados fornecidos
        const document = new Notificacao({
            autor: autor._id,
            conteudo: conteudo,
            tipo: tipo,
            departamento: autor.departamento
        });

        // Salva o documento no banco de dados
        const savedDocument = await document.save();
        return savedDocument;
    } catch (error) {
        console.error('Erro ao cadastrar o notificacao:', error);
        throw new Error('Falha ao cadastrar o notificacao.');
    }

}

module.exports = {cadastrarNotif};
