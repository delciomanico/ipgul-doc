const mongoose = require('mongoose')

require('../models/Documento');
const Document = require('../models/Documento'); // Certifique-se de ajustar o caminho conforme sua estrutura
const Documento = mongoose.model('documento')
/**
 * Função para cadastrar um documento no banco de dados.
 * @param {Object} data - Os dados do documento a serem cadastrados.
 * @returns {Promise<string>} - Retorna o ID do documento criado.
 */
async function cadastrarDocumento(data) {
    try {
        // Cria um novo documento com os dados fornecidos
        const document = new Document({
            nome: data.nome,
            categoria: data.categoria,
            subcategoria: data.subcategoria,
            departamento: data.departamento,
            municipio: data.municipio,
            situacao: data.situacao,
            origem: data.origem,
            versao: data.versao,
            caminho_fisico: data.caminho_fisico,
            descricao: data.descricao,
            seg_nivel: data.seguranca,
            responsavel: data.responsavel,
            data_expiracao: data.data_expiracao,
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


async function atualizarCaminho(nome, novaIdade) {
    try {
        const result = await Documento.updateOne({_id: nome}, { $set: { caminho: novaIdade } })
        console.log('Resultado da atualização:', result);
    } catch (error) {
        console.error('Erro ao atualizar usuário:', error);
    }
}

module.exports = {cadastrarDocumento, atualizarCaminho};
