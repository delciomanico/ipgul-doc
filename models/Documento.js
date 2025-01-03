const mongoose = require('mongoose')
const Schema = mongoose.Schema
const {format} = require('date-fns')

const nowTimestamp = Date.now()
const nowDate = new Date(nowTimestamp)

const Documento = Schema({
    nome: {
        type: String,
        required: true
    },
    categoria:{
        type: Schema.Types.ObjectId,
        ref: "categoria",
        required: true
    },
    subcategoria:{
        type: Schema.Types.ObjectId,
        ref: "subcategoria",
        required: true
    },
    departamento:{
        type: Schema.Types.ObjectId,
        ref: "departamento",
        required: true
    },
    municipio:{
        type: Schema.Types.ObjectId,
        ref: "municipio",
        required: true
    },
    situacao:{
        type: Schema.Types.ObjectId,
        ref: "situacao",
        required: true
    },
    origem: {
        type: String,
        required: true
    },
    versao:{
        type:  Number,
        required: true
    },
    caminho_fisico:{
        type:  String,
        required: true
    },
    caminho:{
        type:  String,
        default: " ",
        required: false
    },
    descricao:{
        type:  String,
        required: true
    },
    seg_nivel:{
        type: Schema.Types.ObjectId,
        ref: "segdoc",
        required: true
    },
    responsavel:{
        type: Schema.Types.ObjectId,
        ref: "usuario",
        required: true
    },
    data_expiracao:{
        type:  String,
        required: false
    },
    data_criacao:{
        type: String,
        default: format(nowDate, 'yyyy-MM-dd')
    }
})

mongoose.model('documento',Documento)
const documento = mongoose.model('documento',Documento)

module.exports = documento