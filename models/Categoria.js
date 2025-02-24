const mongoose = require('mongoose')
const Schema = mongoose.Schema
const {format} = require('date-fns')

const nowTimestamp = Date.now()
const nowDate = new Date(nowTimestamp)

const Categoria = Schema({
    nome: {
        type: String,
        required: true
    },
    responsavel: {
        type: Schema.Types.ObjectId,
        ref: "usuario",
        required: true
    },
    data:{
        type: String,
        default: format(nowDate, 'yyyy-MM-dd')
    }
})

mongoose.model('categoria',Categoria)