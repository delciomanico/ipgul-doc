const mongoose = require('mongoose')

require('../models/Anexos');
const Document = require('../models/Anexos'); // Certifique-se de ajustar o caminho conforme sua estrutura
const Documento = mongoose.model('anexos')
/**
 * Função para cadastrar um documento no banco de dados.
 * @param {Object} data - Os dados do documento a serem cadastrados.
 * @returns {Promise<string>} - Retorna o ID do documento criado.
 */
async function cadastrarAnexo(data) {
    try {
        // Cria um novo documento com os dados fornecidos
        const document = new Document({
            nome: data.nome,
            documento: data.doc,
            responsavel: data.responsavel
        });

        // Salva o documento no banco de dados
        const savedDocument = await document.save();

        // Retorna o ID do documento criado
        return savedDocument._id.toString();
    } catch (error) {
        console.error('Erro ao cadastrar o documento:', error);
        throw new Error('Falha ao cadastrar o documento.');
    }
}


async function atualizarCAnexo(nome, novaIdade) {
    try {
        const result = await Documento.updateOne({_id: nome}, { $set: { caminho: novaIdade } })
    } catch (error) {
        console.error('Erro ao atualizar usuário:', error);
    }
}

module.exports = {cadastrarAnexo, atualizarCAnexo};
