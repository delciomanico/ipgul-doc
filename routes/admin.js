const express = require('express')
const admin = express.Router()
const mongoose = require('mongoose')
const {eAdmin} = require('../helper/eAdmin')
const bcrypt = require('bcryptjs')
const passport = require('passport')
require('../models/Categoria')
require('../models/Usuario')
require('../models/Departamento')
require('../models/Municipio')
require('../models/Situacao')
require('../models/SegDoc')
require('../models/SubCategoria')
require('../models/Documento')
require('../models/Anexos')
const {format} = require('date-fns')


const Categoria = mongoose.model('categoria')
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
const {cadastrarDocumento, atualizarCaminho} = require('../helper/caddoc'); // Ajuste o caminho para sua estrutura
const {cadastrarAnexo, atualizarCAnexo} = require('../helper/cadanexo'); // Ajuste o caminho para sua estrutura
const documento = require('../models/Documento')
const { object } = require('webidl-conversions')

// Middleware de upload com lógica dinâmica
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Obtém os dois campos do formulário para determinar o caminho
        const { categoria, subcategoria } = req.body; // Ajuste para refletir os nomes reais dos campos

        // Define o caminho com base nos campos
        //const dynamicPath = path.join(__dirname, 'uploads', categoria, subcategoria);
        const dynamicPath = path.join('uploads', categoria, subcategoria);

        // Verifica e cria a pasta se não existir
        if (!fs.existsSync(dynamicPath)) {
            fs.mkdirSync(dynamicPath, { recursive: true });
        }

        // Define o caminho de destino
        cb(null, dynamicPath);
    },
    filename: function (req, file, cb) {
        // Extração da extensão do arquivo original
        const extensaoArquivo = file.originalname.split('.').pop();

        // Cria um código randômico temporário para nome inicial
        const novoNomeArquivo = crypto.randomBytes(16).toString('hex');
        const time = format(new Date(), 'yyyy-MM-dd_HH-mm');

        // Define o nome temporário
        cb(null, `${novoNomeArquivo}_${time}.${extensaoArquivo}`);
    }
});
// Middleware de upload com lógica dinâmica
const storage2 = multer.diskStorage({
    destination: function (req, file, cb) {
        // Obtém os dois campos do formulário para determinar o caminho
        const { doc } = req.body; // Ajuste para refletir os nomes reais dos campos

        // Define o caminho com base nos campos
        //const dynamicPath = path.join(__dirname, 'uploads', categoria, subcategoria);
        const dynamicPath = path.join('uploads', 'extra', doc);

        // Verifica e cria a pasta se não existir
        if (!fs.existsSync(dynamicPath)) {
            fs.mkdirSync(dynamicPath, { recursive: true });
        }

        // Define o caminho de destino
        cb(null, dynamicPath);
    },
    filename: function (req, file, cb) {
        // Extração da extensão do arquivo original
        const extensaoArquivo = file.originalname.split('.').pop();

        // Cria um código randômico temporário para nome inicial
        const novoNomeArquivo = crypto.randomBytes(16).toString('hex');
        const time = format(new Date(), 'yyyy-MM-dd_HH-mm');
        // Define o nome temporário
        cb(null, `${novoNomeArquivo}_${time}.${extensaoArquivo}`);
    }
});

// Middleware de upload
const upload = multer({ storage: storage });
const upload2 = multer({ storage: storage2 });

/// =================== Documento ===========
admin.get('/doc', async (req, res) => {

    try {
        const documentos = await Documento.find();
        
    
        res.render("admin/Documento/index", {documentos })
      } catch (erro) {
        console.log(erro);
        res.status(500).send('Erro ao buscar categorias e subcategorias');
      }

});
admin.get('/new_doc', async (req, res) => {

    try {
        const categorias = await Categoria.find();
        const subcategorias = await SubCategoria.find();
        const departamento = await Departamento.find();
        const municipio = await Municipio.find();
        const situacao = await Situacao.find();
        const seg_nivel = await SegDoc.find();
    
        res.render("admin/Documento/novo", { subcategorias, categorias, departamento, municipio, situacao, seg_nivel })
      } catch (erro) {
        console.log(erro);
        res.status(500).send('Erro ao buscar categorias e subcategorias');
      }

});



admin.post('/cad_doc', upload.single('documento'), async (req, res) => {
    try {
        // Cadastra o documento e aguarda o ID retornado
        const documentId = await cadastrarDocumento(req.body);
        const nowTimestamp = Date.now()
        const nowDate = new Date(nowTimestamp)
        const data = format(nowDate, '_yyyy-MM-dd_HH_mm');
        // Lógica para renomear o arquivo com base no ID
        const { categoria, subcategoria } = req.body;
        const dynamicPath = path.join(__dirname, 'uploads', categoria, subcategoria);
        const dynamicPaths = path.join('uploads', categoria, subcategoria);
        const originalFilePath = path.join(dynamicPaths, req.file.filename);
        const extensaoArquivo = req.file.filename.split('.').pop();
        const newFilePath = path.join(dynamicPaths, `${documentId}${data}.${extensaoArquivo}`);

        atualizarCaminho(documentId, newFilePath);
        //Documento.updateOne({_id: documentId}, { $set: { caminho: newFilePath } })
        
        // Renomeia o arquivo
        fs.rename(originalFilePath, newFilePath, (err) => {
            if (err) {
                console.error('Erro ao renomear o arquivo:', err);
                return res.status(500).send('Erro ao processar o arquivo.');
            }

            res.status(200).send({ message: 'Upload realizado com sucesso!', filePath: newFilePath });
        });
    } catch (error) {
        console.error('Erro ao realizar o upload:', error);
        res.status(500).send({ message: error.message });
    }
});

/// ============ dash

admin.get('/dash' , async (req, res) => {
    try {
        const result = [];  // Use um array para armazenar os resultados.
        const list = await Situacao.find();  // Buscando todas as situações

        // Usando o loop for...of para iterar diretamente sobre os itens da lista.
        for (const situacao of list) {
        // Realiza a contagem de documentos de forma assíncrona.
         const qt = await Documento.countDocuments({ situacao: situacao._id });

        // Cria o objeto de resultado.
        const r = {
        nome: situacao.nome,
        qt: qt,
         };

         // Adiciona o objeto ao array de resultados.
         result.push(r);
        }
        res.render('admin/dash', {dados: result})
    } catch (error) {
        console.log(error)
    }
})
/// ============ Anexos

admin.get('/anexos/:id', async (req, res) => {
    try {
      const anexos = await Anexos.find({documento: req.params.id});
      
      res.render('admin/Anexos/index', {docID: req.params.id, anexos})
    } catch (erro) {
      console.log(erro);
      res.status(500).send('Erro ao buscar categorias e subcategorias');
    }
});

admin.post('/anexos', upload2.single('documento'), async (req, res) => {
        try {
            // Cadastra o documento e aguarda o ID retornado
        const documentId = await cadastrarAnexo(req.body);
        const nowTimestamp = Date.now()
        const nowDate = new Date(nowTimestamp)
        const data = format(nowDate, '_yyyy-MM-dd_HH_mm');
        // Lógica para renomear o arquivo com base no ID
        const { doc } = req.body;
        const dynamicPath = path.join(__dirname, 'uploads', 'extra', doc);
        const dynamicPaths = path.join('uploads', 'extra', doc);
        const originalFilePath = path.join(dynamicPaths, req.file.filename);
        const extensaoArquivo = req.file.filename.split('.').pop();
        const newFilePath = path.join(dynamicPaths, `${documentId}${data}.${extensaoArquivo}`);

        atualizarCAnexo(documentId, newFilePath);
        //Documento.updateOne({_id: documentId}, { $set: { caminho: newFilePath } })
        
        // Renomeia o arquivo
        fs.rename(originalFilePath, newFilePath, (err) => {
            if (err) {
                console.error('Erro ao renomear o arquivo:', err);
                return res.status(500).send('Erro ao processar o arquivo.');
            }

            res.status(200).send({ message: 'Upload realizado com sucesso!', filePath: newFilePath });
        });
    
        } catch (error) {
            console.error('Erro ao realizar o upload:', error);
            res.status(500).send({ message: error.message });
        }
    });
    
/// models for use

admin.get('/registro' ,(req, res) => {
    Departamento.find().then((departamento)=>{
        console.log(departamento)
        res.render('registro', {departamento: departamento})
    })
})

admin.post('/registro/add' ,(req, res) => {
    var error = []

    if (!req.body.nome || typeof req.body.nome == undefined || req.body.nome == null) {
        error.push({ texto: "Nome invalido !" })
    }
    if (!req.body.senha || typeof req.body.senha == undefined || req.body.senha == null) {
        error.push({ texto: "Senha invalido !" })
    }
    if (!req.body.email || typeof req.body.email == undefined || req.body.email == null) {
        error.push({ texto: "Email invalido !" })
    }

    if (req.body.senha.length < 4) {
        error.push({ texto: "Senha muito curta" })
    }

    if (req.body.senha != req.body.senha2) {
        error.push({ texto: "Senhas não correspondem" })
    }

    if (error.length > 0) {
        res.render("registro", { error: error })
    } else {

        Usuario.findOne({ email: req.body.email }).then((usuario) => {

            if (usuario != null ) {
                req.flash('error_msg', "Ja exite um usuario com este email")
                res.redirect('/admin/registro')
            } else {
                const novoUsuario = new Usuario({
                    nome: req.body.nome,
                    email: req.body.email,
                    departamento: req.body.departamento,
                    senha: req.body.senha,
                    eAdmin: ( Usuario.find({eAdmin: 4}).lean() == 0 ) ? 4 : 0
                })
                
                let senha = novoUsuario.senha
                let salt = bcrypt.genSaltSync(10)
               // console.log( Usuario.find({eAdmin: 4}).lean() == 0  ? 4 : 0 )
                bcrypt.hash(senha,salt, (err, hashed)=>{
                    if(err){
                        console.error(err)
                        return
                    }
                    novoUsuario.senha = hashed
                    novoUsuario.save().then(() => {
                        req.flash('success_msg', "Usuario Cadastrado com Sucesso")
                        res.redirect('/')
                    }).catch((error) => {
                        console.log(error)
                        req.flash('error_msg', "Houve um erro ao criar usuario, tente novamente")
                        res.redirect('/')
                    })
                })
                    


            }

        }).catch((error) => {
            req.flash('error_msg', "Houve um erro interno (", error)
            res.redirect('/')
        })
    }
})
// ======   Categoria ===============
admin.get('/categoria', (req, res)=>{

    Categoria.find().then((categorias)=>{

        res.render('admin/Categoria/index', {categorias: categorias})
    })
})
admin.post('/new_categoria', (req, res)=>{
    erros = []

    if(!req.body.nome || typeof req.body.nome == undefined || req.body.nome == null){
        erros.push({texto: "Nome invalido"})
    }
    if(req.body.nome.length < 2){
        erros.push({texto: "Nome da categoria, muito pequena"})
    }
    if(erros.length > 0){
        res.render("admin/categoria", {erros: erros})
    }else{
        new Categoria({
            nome: req.body.nome,
            responsavel: req.body.responsavel
        }).save().then(()=>{
            req.flash('success_msg', 'Categoria criada com exito')
            console.log("Categoria cadastrada")
            res.redirect('/admin/Categoria')
        }).catch((err)=>{
            req.flash('error_msg', 'erro ao criar, tente novamente')
            console.log("erro no cadastro . ", err)
            res.redirect('/admin/Categoria')
        })
    }
})
admin.get('/categoria_delet/:id', (req, res)=>{

    Categoria.deleteOne({_id:req.params.id}).then(()=>{
        req.flash('success_msg', 'deletado !')
        res.redirect('/admin/categoria')
    }).catch((error)=>{
        req.flash('error_msg', 'Erro ao deletar (', error,')')
        res.redirect('/admin/categoria')
    })
})
// ======   Sub Categoria ===============
admin.get('/subcategoria', async (req, res) => {
    try {
      const categorias = await Categoria.find();
      const subcategorias = await SubCategoria.find().populate("categoria").populate("responsavel");
  
      res.render('admin/Subcategoria/index', { subcategorias, categorias });
    } catch (erro) {
      console.log(erro);
      res.status(500).send('Erro ao buscar categorias e subcategorias');
    }
  });
  
admin.post('/new_subcategoria', (req, res)=>{
    erros = []

    if(!req.body.nome || typeof req.body.nome == undefined || req.body.nome == null){
        erros.push({texto: "Nome invalido"})
    }
    if(req.body.nome.length < 2){
        erros.push({texto: "Nome da subcategoria, muito pequeno"})
    }
    if(erros.length > 0){
        res.render("admin/subcategoria", {erros: erros})
    }else{
        new SubCategoria({
            nome: req.body.nome,
            categoria: req.body.categoria,
            responsavel: req.body.responsavel
        }).save().then(()=>{
            req.flash('success_msg', 'criada com exito')
            console.log("cadastrada")
            res.redirect('/admin/subcategoria')
        }).catch((err)=>{
            req.flash('error_msg', 'erro ao criar, tente novamente')
            console.log("erro no cadastro . ", err)
            res.redirect('/admin/subcategoria')
        })
    }
})
admin.get('/subcategoria_delet/:id', (req, res)=>{

    SubCategoria.deleteOne({_id:req.params.id}).then(()=>{
        req.flash('success_msg', 'deletado !')
        res.redirect('/admin/subcategoria')
    }).catch((error)=>{
        req.flash('error_msg', 'Erro ao deletar (', error,')')
        res.redirect('/admin/subcategoria')
    })
})
// ======   Departamaento ===============
admin.get('/departamento', (req, res)=>{

    Departamento.find().then((departamentos)=>{

        res.render('admin/Departamento/index', {departamentos: departamentos})
    })
})
admin.get('/departamento_delet/:id', (req, res)=>{

    Departamento.deleteOne({_id:req.params.id}).then(()=>{
        req.flash('success_msg', 'Departamento deletado !')
        res.redirect('/admin/departamento')
    }).catch((error)=>{
        req.flash('error_msg', 'Erro ao deletar departamento (', error,')')
        res.redirect('/admin/departamento')
    })
})
admin.post('/new_departamento', (req, res)=>{
    erros = []

    if(!req.body.nome || typeof req.body.nome == undefined || req.body.nome == null){
        erros.push({texto: "Nome invalido"})
    }
    if(req.body.nome.length < 2){
        erros.push({texto: "Nome da departamento, muito pequena"})
    }
    if(erros.length > 0){
        res.render("admin/departamento", {erros: erros})
    }else{
        new Departamento({
            nome: req.body.nome,
        }).save().then(()=>{
            req.flash('success_msg', 'Departamento criada com exito')
            console.log("Departamento cadastrada")
            res.redirect('/admin/departamento')
        }).catch((err)=>{
            req.flash('error_msg', 'erro ao criar, tente novamente')
            console.log("erro no cadastro . ", err)
            res.redirect('/admin/departamento')
        })
    }
})
// ======   Municipio ===============
admin.get('/municipio', (req, res)=>{

    Municipio.find().then((municipio)=>{

        res.render('admin/Municipio/index', {municipio: municipio})
    })
})
admin.get('/municipio_delet/:id', (req, res)=>{

    Municipio.deleteOne({_id:req.params.id}).then(()=>{
        req.flash('success_msg', 'Municipio deletado !')
        res.redirect('/admin/municipio')
    }).catch((error)=>{
        req.flash('error_msg', 'Erro ao deletar municipio (', error,')')
        res.redirect('/admin/municipio')
    })
})
admin.post('/new_municipio', (req, res)=>{
    erros = []

    if(!req.body.nome || typeof req.body.nome == undefined || req.body.nome == null){
        erros.push({texto: "Nome invalido"})
    }
    if(req.body.nome.length < 3){
        erros.push({texto: "Nome da municipio, muito pequena"})
    }
    if(erros.length > 0){
        res.render("admin/municipio", {erros: erros})
    }else{
        new Municipio({
            nome: req.body.nome,
        }).save().then(()=>{
            req.flash('success_msg', 'Municipio criado com exito')
            res.redirect('/admin/municipio')
        }).catch((err)=>{
            req.flash('error_msg', 'erro ao criar, tente novamente')
            console.log("erro no cadastro . ", err)
            res.redirect('/admin/municipio')
        })
    }
})
// ======   Situacao ===============
admin.get('/situacao', (req, res)=>{

    Situacao.find().then((situacao)=>{

        res.render('admin/Situacao/index', {situacao: situacao})
    })
})
admin.get('/situacao_delet/:id', (req, res)=>{

    Situacao.deleteOne({_id:req.params.id}).then(()=>{
        req.flash('success_msg', 'Situacao deletado !')
        res.redirect('/admin/situacao')
    }).catch((error)=>{
        req.flash('error_msg', 'Erro ao deletar situacao (', error,')')
        res.redirect('/admin/situacao')
    })
})
admin.post('/new_situacao', (req, res)=>{
    erros = []

    if(!req.body.nome || typeof req.body.nome == undefined || req.body.nome == null){
        erros.push({texto: "Nome invalido"})
    }
    if(req.body.nome.length < 3){
        erros.push({texto: "Nome da municipio, muito pequena"})
    }
    if(erros.length > 0){
        res.render("admin/situacao", {erros: erros})
    }else{
        new Situacao({
            nome: req.body.nome,
        }).save().then(()=>{
            req.flash('success_msg', 'Situacao criado com exito')
            res.redirect('/admin/situacao')
        }).catch((err)=>{
            req.flash('error_msg', 'erro ao criar, tente novamente')
            console.log("erro no cadastro . ", err)
            res.redirect('/admin/situacao')
        })
    }
})
// ======   nivel segurança ===============
admin.get('/seg_doc', (req, res)=>{

    SegDoc.find().then((seg_doc)=>{

        res.render('admin/SegurancaDoc/index', {seg_doc: seg_doc})
    })
})
admin.get('/seg_doc_delet/:id', (req, res)=>{

    SegDoc.deleteOne({_id:req.params.id}).then(()=>{
        req.flash('success_msg', ' deletado !')
        res.redirect('/admin/seg_doc')
    }).catch((error)=>{
        req.flash('error_msg', 'Erro ao deletar (', error,')')
        res.redirect('/admin/seg_doc')
    })
})
admin.post('/new_seg_doc', (req, res)=>{
    erros = []

    if(!req.body.nome || typeof req.body.nome == undefined || req.body.nome == null){
        erros.push({texto: "Nome invalido"})
    }
    if(req.body.nome.length < 3){
        erros.push({texto: "Nome muito pequena"})
    }
    if(erros.length > 0){
        res.render("admin/seg_doc", {erros: erros})
    }else{
        new SegDoc({
            nome: req.body.nome,
        }).save().then(()=>{
            req.flash('success_msg', 'criado com exito')
            res.redirect('/admin/seg_doc')
        }).catch((err)=>{
            req.flash('error_msg', 'erro ao criar, tente novamente')
            console.log("erro no cadastro . ", err)
            res.redirect('/admin/seg_doc')
        })
    }
})
// ======   Categoria  ===============
admin.get('/categoria', (req, res)=>{

    SegDoc.find().then((seg_doc)=>{

        res.render('admin/SegurancaDoc/index', {seg_doc: seg_doc})
    })
})
admin.get('/seg_doc_delet/:id', (req, res)=>{

    SegDoc.deleteOne({_id:req.params.id}).then(()=>{
        req.flash('success_msg', ' deletado !')
        res.redirect('/admin/seg_doc')
    }).catch((error)=>{
        req.flash('error_msg', 'Erro ao deletar (', error,')')
        res.redirect('/admin/seg_doc')
    })
})
admin.post('/new_seg_doc', (req, res)=>{
    erros = []

    if(!req.body.nome || typeof req.body.nome == undefined || req.body.nome == null){
        erros.push({texto: "Nome invalido"})
    }
    if(req.body.nome.length < 3){
        erros.push({texto: "Nome muito pequena"})
    }
    if(erros.length > 0){
        res.render("admin/seg_doc", {erros: erros})
    }else{
        new SegDoc({
            nome: req.body.nome,
        }).save().then(()=>{
            req.flash('success_msg', 'criado com exito')
            res.redirect('/admin/seg_doc')
        }).catch((err)=>{
            req.flash('error_msg', 'erro ao criar, tente novamente')
            console.log("erro no cadastro . ", err)
            res.redirect('/admin/seg_doc')
        })
    }
})

//========================login ===========

admin.get('/login',( req, res)=>{
    res.render('login')
})
admin.post('/login',( req, res, next)=>{

     passport.authenticate('local',{
         successRedirect: "/admin/dash",
         failureRedirect: "/admin/login",
         failureFlash: true,
     })(req, res, next)
})

admin.get('/logout' ,(req, res)=>{
 req.logout(()=>{

     req.flash('success_msg','Sessão Terminada!')
     res.redirect('/admin/login')
 })
})


module.exports = admin
