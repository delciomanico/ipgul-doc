const express = require('express')
const router = express.Router()
const mongoose = require("mongoose")
const bcrypt = require('bcryptjs')
const admin = require('./admin')
const passport = require('passport')
const {eLog} = require('../helper/eLog')
const {eUpload} = require('../helper/eUpload')
const {eRead} = require('../helper/eRead')
const {eAdmin} = require('../helper/eAdmin')
require('../models/Usuario')
require('../models/Departamento')
require('../models/Curso')
require('../models/Documento')


const Usuario = mongoose.model('usuario')
const Area = mongoose.model('area')
const Curso = mongoose.model('curso')
const Aluno = mongoose.model('aluno')




/// ========= rotas da area
router.get('/area', eRead ,(req,res)=>{
    Area.find().then((area)=>{
        if(area){
            res.render('usuario/area/index',{area : area})
        }
    })
})
router.get('/area/add',eLog , (req,res)=>{
    res.render('usuario/area/addArea')
})


router.post('/area/delete', eLog , (req,res)=>{
    Area.deleteOne({_id:req.body.id}).then(()=>{
        req.flash('success_msg', 'area deletada !')
        res.redirect('/usuario/area')
    }).catch((error)=>{
        req.flash('error_msg', 'Erro ao deletar area (', error,')')
        res.redirect('/usuario/area')
    })
})

router.get('/area/edit/:id', eLog , (req,res)=> {
  
    Area.findById(req.params.id).then((area)=>{
        res.render('usuario/area/editArea',{area: area})
    }).catch((erro)=>{
        req.flash('error_msg', 'A area selecionada nao existe')
        res.redirect('/usuario/area')
    })
})
router.post('/area/edit', eLog ,(req,res)=> {
  
    Area.findOne({_id: req.body.id}).then((area)=>{
        area.nome = req.body.nome
        area.slug = req.body.slug
        area.save().then(()=>{
            req.flash('success_msg', 'area editada com sucesso')
            res.redirect('/usuario/area')
        }).catch(()=>{
            req.flash('error_msg', 'erro interno ao salvar ediçao da area')
            res.redirect('/usuario/area')
        })
    }).catch((error)=>{

        req.flash('error_msg', 'Falha ao editar area')
        res.redirect('/usuario/area')
    })
    
})


router.post('/area/nova', eLog ,(req,res)=>{

    erros = []

    if(!req.body.nome || typeof req.body.nome == undefined || req.body.nome == null){
        erros.push({texto: "Nome invalido"})
    }
    if(!req.body.slug || typeof req.body.nif == undefined || req.body.slug == null){
        erros.push({texto: "SLUG invalido"})
    }
    if(req.body.nome.length < 4){
        erros.push({texto: "Nome da Area, muito pequeno"})
    }
    if(erros.length > 0){
        res.render("usuario/addArea", {erros: erros})
    }else{
        
        new Area({
            nome: req.body.nome,
            slug: req.body.slug
        }).save().then(()=>{
            req.flash('success_msg', 'Area criada com exito')
            console.log("Area cadastrada")
            res.redirect('/usuario/area')
        }).catch((err)=>{
            req.flash('error_msg', 'erro ao criar, tente novamente')
            console.log("erro no cadastro . ", err)
            res.redirect('/usuario/area')
        })
    }

})


/// ========= rotas de curso
router.get('/area/curso/:id', eRead ,(req,res)=>{
    Curso.find({area_f: req.params.id}).then((curso)=>{
        if(curso){
            res.render('usuario/area/curso/index',{curso : curso})
        }
    })
})
router.get('/curso/add',eLog , (req,res)=>{
    Area.find().then((area)=>{
        res.render('usuario/area/curso/addCurso',{area: area})
    })
})


router.post('/area/curso/delete', eLog , (req,res)=>{
    Curso.deleteOne({_id:req.body.id}).then(()=>{
        req.flash('success_msg', 'curso deletado !')
        res.redirect('/usuario/area')
    }).catch((error)=>{
        req.flash('error_msg', 'Erro ao deletar curso (', error,')')
        res.redirect('/usuario/area')
    })
})

router.get('/area/curso/edit/:id', eLog , (req,res)=> {
  
    Curso.findById(req.params.id).populate('area_f').then((curso)=>{
        res.render('usuario/area/curso/editCurso',{curso: curso})
    }).catch((erro)=>{
        req.flash('error_msg', 'O curso selecionado nao existe')
        res.redirect('/usuario/area')
    })
})
router.post('/area/curso/edit', eLog ,(req,res)=> {
  
    Curso.findOne({_id: req.body.id}).then((curso)=>{
        curso.nome = req.body.nome
        curso.slug = req.body.slug
        curso.area_f = req.body.area
        curso.save().then(()=>{
            req.flash('success_msg', 'curso editado com sucesso')
            res.redirect('/usuario/area')
        }).catch(()=>{
            req.flash('error_msg', 'erro interno ao salvar ediçao de curso')
            res.redirect('/usuario/area')
        })
    }).catch((error)=>{

        req.flash('error_msg', 'Falha ao editar curso')
        res.redirect('/usuario/area')
    })
    
})


router.post('/area/curso/nova', eLog ,(req,res)=>{

    erros = []

    if(!req.body.nome || typeof req.body.nome == undefined || req.body.nome == null){
        erros.push({texto: "Nome invalido"})
    }
    if(!req.body.slug || typeof req.body.nif == undefined || req.body.slug == null){
        erros.push({texto: "SLUG invalido"})
    }
    if(req.body.nome.length < 4){
        erros.push({texto: "Nome do curso, muito pequeno"})
    }
    if(erros.length > 0){
        res.render("usuario/area/curso/addCurso", {erros: erros})
    }else{
        
        new Curso({
            nome: req.body.nome,
            slug: req.body.slug,
            area_f: req.body.area
        }).save().then(()=>{
            req.flash('success_msg', 'Curso criado com exito')
            console.log("Curso cadastrada")
            res.redirect('/usuario/area')
        }).catch((err)=>{
            req.flash('error_msg', 'erro ao criar, tente novamente')
            console.log("erro no cadastro . ", err)
            res.redirect('/usuario/area')
        })
    }

})


/// ========= rotas de finalistas
router.get('/area/finalista/:id', eRead ,(req,res)=>{
    Aluno.find({curso: req.params.id}).then((aluno)=>{
        if(aluno){

            res.render('usuario/area/finalista/index',{curso_id: req.params.id, finalista: aluno})
        }
    })
})
router.get('/finalista_add/:id',eLog , (req,res)=>{
    Curso.findById(req.params.id).then((curso)=>
    {
        if(curso)
            res.render('usuario/area/finalista/addFinalista', {curso: curso})
    })
})


router.post('/area/finalista/delete', eLog , (req,res)=>{
    Aluno.deleteOne({_id:req.body.id}).then(()=>{
        req.flash('success_msg', 'Finalista deletado !')
        res.redirect('/usuario/area')
    }).catch((error)=>{
        req.flash('error_msg', 'Erro ao deletar finalista (', error,')')
        res.redirect('/usuario/area')
    })
})

router.get('/finalista/edit/:id', eLog , (req,res)=> {
  
    Aluno.findById(req.params.id).populate('curso').then((a)=>{
        res.render('usuario/area/finalista/editFinalista',{finalista: a})
    }).catch((erro)=>{
        req.flash('error_msg', 'O finalista selecionado nao existe')
        res.redirect('/usuario/area')
    })
})
router.post('/area/finalista/edit', eLog ,(req,res)=> {
  
    Aluno.findOne({_id: req.body.id}).then((a)=>{
            a.nome = req.body.nome,
            a.bi = req.body.bi,
            a.tel = req.body.tel,
            a.media = req.body.media,
            a.start = req.body.start,
            a.end = req.body.end,
            a.curso = req.body.curso,
            a.faculdade = req.body.faculdade,
            a.mestrado = req.body.mestrado,
            a.trabalho = req.body.trabalho
        a.save().then(()=>{
            req.flash('success_msg', 'Aluno editado com sucesso')
            res.redirect('/usuario/area/finalista/'+req.body.curso )
        }).catch((e)=>{
            req.flash('error_msg', 'erro interno ao salvar ediçao do aluno'+e)
            res.redirect('/usuario/area/finalista/'+req.body.curso)
        })
    }).catch((error)=>{

        req.flash('error_msg', 'Falha ao editar aluno '+error)
        res.redirect('/usuario/area')
    })
    
})


router.post('/area/finalista/nova', eLog ,(req,res)=>{

    erros = []

    if(!req.body.nome || typeof req.body.nome == undefined || req.body.nome == null){
        erros.push({texto: "Nome invalido"})
    }
    if(!req.body.bi || typeof req.body.bi == undefined || req.body.bi == null){
        erros.push({texto: "numero de bi invalido"})
    }
    if(req.body.nome.length < 4){
        erros.push({texto: "Nome do finalista, muito pequeno"})
    }
    if(erros.length > 0){
        res.render("usuario/finalista/addFinalista", {erros: erros})
    }else{
        
        new Aluno({
            nome: req.body.nome,
            bi: req.body.bi,
            tel: req.body.tel,
            media: req.body.media,
            start: req.body.start,
            end: req.body.end,
            curso: req.body.curso,
            faculdade: req.body.faculdade,
            mestrado: req.body.mestrado,
            trabalho: req.body.trabalho
        }).save().then(()=>{
            req.flash('success_msg', 'Aluno cadastrado com sucesso')
            console.log("Area cadastrada")
            res.redirect('/usuario/area/finalista/'+ req.body.curso)
        }).catch((err)=>{
            req.flash('error_msg', 'erro ao criar, tente novamente')
            console.log("erro no cadastro . ", err)
            res.redirect('/usuario/area/finalista/'+ req.body.curso)
        })
    }

})



//================== admin ==============

router.get('/controll', eAdmin, (req, res)=>
{
    Usuario.find().then((user)=>
    {
        res.render('admin/index', {user: user})
    })
})

router.get('/controll/edit/:id', eAdmin, (req, res)=>
{
    Usuario.findOne({_id: req.params.id}).then((user)=>
    {
        res.render('admin/editAcess', {user: user})
    })
})

router.post('/controll/edit', eAdmin, (req, res)=>
{
    Usuario.findOne({_id: req.body.id}).then((user)=>{
        user.eAdmin = req.body.nivel
        user.save().then(()=>{
            req.flash('success_msg', 'Usuario editado com sucesso')
            res.redirect('/usuario/controll')
        }).catch(()=>{
            req.flash('error_msg', 'erro interno ao salvar ediçao de Usuario')
            res.redirect('/usuario/controll')
        })
    }).catch((error)=>{

        req.flash('error_msg', 'Falha ao editar Usuario')
        res.redirect('/usuario/controll')
    })
})

router.post('/controll/delete', eAdmin , (req,res)=>{
    Usuario.deleteOne({_id:req.body.id}).then(()=>{
        req.flash('success_msg', 'Usuario deletado !')
        res.redirect('/usuario/controll')
    }).catch((error)=>{
        req.flash('error_msg', 'Erro ao deletar usuario (', error,')')
        res.redirect('/usuario/controll')
    })
})

//================= perfil ================
router.get('/perfil', eRead, (req, res)=>{
        Usuario.findOne({_id: req.user._id}).then((user)=>
        {
            res.render('usuario/perfil/index', {user: user})
        })
})

router.get('/perfil/password', eLog, (req, res)=>{
    res.render('usuario/perfil/alterPassword')
})
router.post('/perfil/password/edit', eLog, (req, res)=>{
    
    var error = []

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
        res.render("usuario/perfil/alterPassword", { error: error })
    } else {

        bcrypt.compare(req.body.senha, req.user.senha, (erro, isIgual)=>{
            if(isIgual){
                const novoUsuario = new Usuario({
                    senha: req.body.senha1
                })
                
                let senha = novoUsuario.senha
                let salt = bcrypt.genSaltSync(10)
                
                bcrypt.hash(senha,salt, (err, hashed)=>{
                    if(err){
                        console.error(err)
                        return
                    }
                    novoUsuario.senha = hashed
                    Usuario.findOne({_id: req.user._id}).then((user)=>{
                        user.senha = novoUsuario.senha
                        user.save().then(() => {
                            req.flash('success_msg', "Senha editada com Sucesso")
                            res.redirect('/usuario/perfil')
                        }).catch((error) => {
                            console.log(error)
                            req.flash('error_msg', "Houve um erro ao editar senha, tente novamente"+error)
                            res.redirect('/usuario/perfil')
                        })
                    })
                    //novoUsuario
                })

            }else{
                req.flash('error_msg', "Senha errada")
                res.redirect('/usuario/perfil')
            }
        })

    }
})

router.get('/perfil/alterName', eLog, (req, res)=>{
    Usuario.findOne({_id: req.user._id}).then((user)=>
    {
        res.render('usuario/perfil/alterName', {user: user})
    })
})

router.post('/perfil/edit', eLog ,(req,res)=> {
  
    Usuario.findOne({_id: req.body.id}).then((user)=>{
        user.nome = req.body.nome,
        user.email = req.body.email
        user.save().then(()=>{
            req.flash('success_msg', 'Dados editado com sucesso')
            res.redirect('/usuario/perfil')
        }).catch(()=>{
            req.flash('error_msg', 'erro interno ao salvar ediçao de usuario')
            res.redirect('/usuario/perfil')
        })
    }).catch((error)=>{

        req.flash('error_msg', 'Falha ao editar usuario')
        res.redirect('/usuario/area')
    })
    
})


//========================login ===========

router.get('/login',( req, res)=>{
       res.render('usuario/login')
})
router.post('/login',( req, res, next)=>{

        passport.authenticate('local',{
            successRedirect: "/",
            failureRedirect: "/usuario/login",
            failureFlash: true,
        })(req, res, next)
})

router.get('/logout' ,(req, res)=>{
    req.logout(()=>{

        req.flash('success_msg','Sessão Terminada!')
        res.redirect('/')
    })
})
module.exports = router