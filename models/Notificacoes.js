const mongoose = require('mongoose')
const Schema = mongoose.Schema
const {format} = require('date-fns')

const nowTimestamp = Date.now()
const nowDate = new Date(nowTimestamp)

const Notificacoes = Schema({
    autor: {
        type: Schema.Types.ObjectId,
        ref: "usuario",
        required: true
    },
    departamento: {
        type: Schema.Types.ObjectId,
        ref: "departamento",
        required: true
    },
    conteudo: {
        type: String,
        required: true
    },
    tipo: {
        type: String,
        required: true
    },
    data:{
        type: String,
        default: format(nowDate, 'yyyy-MM-dd')
    },
    dt:{
        type: Date,
        default: Date.now()
    }
})

mongoose.model('notificacoes',Notificacoes)