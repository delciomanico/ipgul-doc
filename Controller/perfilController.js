/* _

const express = require('express')
const admin = express.Router()
const mongoose = require('mongoose')
const { eAdmin } = require('../helper/eAdmin')
const { eDep } = require('../helper/eDep')
const { eUser } = require('../helper/eUser')
const bcrypt = require('bcryptjs')
const passport = require('passport')
require('../models/Categoria')
require('../models/Notificacoes')
require('../models/Usuario')
require('../models/Departamento')
require('../models/Municipio')
require('../models/Situacao')
require('../models/SegDoc')
require('../models/SubCategoria')
require('../models/Documento')
require('../models/Anexos')
const { format } = require('date-fns')


const Categoria = mongoose.model('categoria')
const Notificacoes = mongoose.model('notificacoes')
const Usuario = mongoose.model('usuario')
const Departamento = mongoose.model('departamento')
const Municipio = mongoose.model('municipio')
const Situacao = mongoose.model('situacao')
const SegDoc = mongoose.model('segdoc')
const Documento = mongoose.model('documento')
const Anexos = mongoose.model('anexos')
const SubCategoria = mongoose.model('subcategoria')
const multer = require('multer')
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { cadastrarDocumento, atualizarCaminho, deletarDocumento } = require('../helper/caddoc'); // Ajuste o caminho para sua estrutura
const { cadastrarAnexo, atualizarCAnexo } = require('../helper/cadanexo'); // Ajuste o caminho para sua estrutura
const { cadastrarNotif } = require('../helper/cadNotif')
const documento = require('../models/Documento')
const { object } = require('webidl-conversions')

*/

class perfilController{
    
    getAgua(){
        return agua; 
    }

    setAgua(agua){
        this.agua=agua;
    }

    ted(){
    
    }

    _get = admin.get("edit");
    _edit = admin.get("delet");
    
}

const perfilControllerS = new perfilController();

perfilControllerS.agua();

perfilController.logica("perfil")

switch(tese){
    case "perfil/edit.js":
    break;

    case "perfil/delete.js":
    break;
}






























admin.get("/perfil", eAdmin, async (req, res) => {
    try {

        const dados = await Usuario.find({ _id: req.user._id }).populate('departamento')
        res.render("admin/Contas/perfil2", { dados });
    } catch (error) {
        console.log(error)
        res.send(error)
    }
})

admin.post("/perfil_edit", eAdmin, async (req, res) => {
    try {
        const { nome, email } = req.body;
        const usuario = await Usuario.findByIdAndUpdate(req.user._id, { nome, email }, { new: true });
        req.flash('success_msg', '  Editado!');
        res.redirect("/admin/perfil")
    } catch (error) {
        console.log(error)
        res.send(error)
    }
})

admin.post('/perfil/password', eAdmin, async (req, res) => {

    var error = []
    try {
        if (!req.body.senha || typeof req.body.senha == undefined || req.body.senha == null) {
            error.push({ texto: "Senha invalido !" })
        }

        if (req.body.senha1.length < 4) {
            error.push({ texto: "Senha muito curta" })
        }

        if (req.body.senha1 != req.body.senha2) {
            error.push({ texto: "Senhas não correspondem" })
        }

        if (error.length > 0) {
            const dados = await Usuario.find({ _id: req.user._id }).populate('departamento')
            res.render("admin/Contas/perfil2", { dados, error: error });
        } else {

            bcrypt.compare(req.body.senha, req.user.senha, (erro, isIgual) => {
                if (isIgual) {
                    const novoUsuario = new Usuario({
                        senha: req.body.senha1
                    })

                    let senha = novoUsuario.senha
                    let salt = bcrypt.genSaltSync(10)

                    bcrypt.hash(senha, salt, (err, hashed) => {
                        if (err) {
                            console.error(err)
                            return
                        }
                        novoUsuario.senha = hashed
                        Usuario.findOne({ _id: req.user._id }).then((user) => {
                            user.senha = novoUsuario.senha
                            user.save().then(() => {
                                req.flash('success_msg', "Senha editada com Sucesso")
                                res.redirect('/admin/perfil')
                            }).catch((error) => {
                                console.log(error)
                                req.flash('error_msg', "Houve um erro ao editar senha, tente novamente" + error)
                                res.redirect('/admin/perfil')
                            })
                        })
                        //novoUsuario
                    })

                } else {
                    req.flash('error_msg', "Senha errada")
                    res.redirect('/admin/perfil')
                }
            })

        }
    } catch (error) {
        console.log(error)
        res.send(error)
    }
})
