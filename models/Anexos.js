const mongoose = require('mongoose')
const Schema = mongoose.Schema
const {format} = require('date-fns')

const nowTimestamp = Date.now()
const nowDate = new Date(nowTimestamp)
const Anexos = Schema({
    nome: {
        type: String,
        required: true
    },
    documento:{
        type: Schema.Types.ObjectId,
        ref: "documento",
        required: true
    },
    caminho:{
        type:  String,
        default: " ",
        required: false
    },
    responsavel:{
        type: Schema.Types.ObjectId,
        ref: "usuario",
        required: true
    },
    data:{
        type: String,
        default: format(nowDate, 'yyyy-MM-dd')
    }
})

mongoose.model('anexos',Anexos)
const documento = mongoose.model('anexos',Anexos)

module.exports = documento