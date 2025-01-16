const mongoose = require('mongoose')
const Schema = mongoose.Schema
const {format} = require('date-fns')


const nowTimestamp = Date.now()
const nowDate = new Date(nowTimestamp)
const Usuario = Schema({
    nome: {
        type: String,
        required: false
    },
    senha:{
        type: String,
        required: true
    },
    eAcesso:{
        type: Number,
        require: false,
        default: 4
    },
    email:{
        type: String,
        required: false
    },
    departamento:{
        type: Schema.Types.ObjectId,
        ref: "departamento",
        required: true
    },
    data:{
        type: String,
        default: format(nowDate, 'yyyy-MM-dd')
    }
})

mongoose.model('usuario',Usuario)