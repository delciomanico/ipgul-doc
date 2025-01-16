const express = require('express')
const dep = express.Router()
exports.dep = dep
const mongoose = require('mongoose')
const {eAdmin} = require('../helper/eAdmin')
const {eDep} = require('../helper/eDep')
const {eUser} = require('../helper/eUser')
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
const {format} = require('date-fns')


const Categoria = mongoose.model('categoria')
exports.Categoria = Categoria
const Notificacoes = mongoose.model('notificacoes')
exports.Notificacoes = Notificacoes
const Usuario = mongoose.model('usuario')
const Departamento = mongoose.model('departamento')
const Municipio = mongoose.model('municipio')
const Situacao = mongoose.model('situacao')
const SegDoc = mongoose.model('segdoc')
const Documento = mongoose.model('documento')
exports.Documento = Documento
const Anexos = mongoose.model('anexos')
const SubCategoria = mongoose.model('subcategoria')
exports.SubCategoria = SubCategoria
const multer = require('multer')
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const {cadastrarDocumento, atualizarCaminho, deletarDocumento} = require('../helper/caddoc'); // Ajuste o caminho para sua estrutura
const {cadastrarAnexo, atualizarCAnexo} = require('../helper/cadanexo'); // Ajuste o caminho para sua estrutura
const {cadastrarNotif} = require('../helper/cadNotif'); // Ajuste o caminho para sua estrutura


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
dep.get('/doc', eUser , async (req, res) => {

    try {
        const categorias = await Categoria.find();
        const subcategorias = await SubCategoria.find();
        const documentos = await Documento.find({departamento: req.user.departamento})
        .populate('categoria')
        .populate('subcategoria')
        .populate('departamento')
        .populate('situacao')
        .populate('responsavel')
        .populate('municipio')
        .sort({dt: "desc"});
        res.render("admin/Documento/index", {documentos , categorias, subcategorias})
      } catch (erro) {
        console.log(erro);
        res.status(500).send('Erro ao buscar categorias e subcategorias');
      }

});
dep.get('/new_doc', eUser ,async (req, res) => {

    try {
        const categorias = await Categoria.find();
        const subcategorias = await SubCategoria.find();
        const departamento = await Departamento.find({_id: req.user.departamento});
        const municipio = await Municipio.find();
        const situacao = await Situacao.find();
        const seg_nivel = await SegDoc.find();
    
        res.render("admin/Documento/novo", { subcategorias, categorias, departamento, municipio, situacao, seg_nivel })
      } catch (erro) {
        console.log(erro);
        res.status(500).send('Erro ao buscar categorias e subcategorias');
      }

});


dep.get('/doc_delet/:id', eDep, async (req, res)=>{
    try {
        const caminho = await Documento.findOne({_id: req.params.id})
        const camAnexo = path.join('uploads','extra',req.params.id) 
        fs.rm(caminho.caminho, { recursive: true, force: true }, (err) => {
            if (err) {
                console.error('Erro ao deletar diretório:', err);
            } else {
                console.log('Diretório deletado com sucesso.');
            }
            });
        fs.rm(camAnexo, { recursive: true, force: true }, (err) => {
            if (err) {
                console.error('Erro ao deletar diretório:', err);
            } else {
                console.log('Diretório deletado com sucesso.');
            }
            });
        deletarDocumento(req.params.id);
        await Anexos.deleteMany({documento: req.params.id});
        cadastrarNotif(req.user, "Documento foi Excluido", "Exclusao");
        req.flash('success_msg', "Usuario Cadastrado com Sucesso")
        res.redirect('/doc')
    } catch (error) {
        console.error('Erro ao deletar:', error);
        res.status(500).send({ message: error.message });
    }
})

dep.post('/cad_doc', eUser, upload.single('documento'), async (req, res) => {
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

        await atualizarCaminho(documentId, newFilePath);
        //Documento.updateOne({_id: documentId}, { $set: { caminho: newFilePath } })
        
        // Renomeia o arquivo
        await fs.rename(originalFilePath, newFilePath, (err) => {
            if (err) {
                console.error('Erro ao renomear o arquivo:', err);
                return res.status(500).send('Erro ao processar o arquivo.');
            }

        });
        await cadastrarNotif(req.user, "Novo documento foi Cadastrado", "Cadastro");
        res.redirect('back');
    } catch (error) {
        console.error('Erro ao realizar o upload:', error);
        res.status(500).send({ message: error.message });
    }
});

/// ========== api ==========================00

dep.get('/documento/search_documento/doc' , eUser, async (req, res) => {
    try {
        const { cat, subCat, data, chave } = req.query;
        // Validação simples
        if (!cat || !subCat || !data || !chave) {
            return res.status(400).json({ error: 'Faltando parâmetros obrigatórios' });
        }
        const results = await Documento.find({  $or: [
            { data_criacao: data },
            { departamento: req.user.departamento },
        { categoria: cat },
        { subcategoria: subCat },
        { nome: new RegExp(chave, 'i') }
      ]})
      .populate('categoria')
      .populate('subcategoria')
      .populate('departamento')
      .populate('situacao')
      .populate('responsavel')
      .populate('municipio');
      res.json(results);  // Retorna os resultados como JSON
    } catch (error) {
        console.log(error)
      res.status(500).json({ error: 'Erro ao buscar o município' });
    }
})
dep.get('/documento/search_validade/doc' , eUser, async (req, res) => {
    try {
        const { cat, subCat, data, chave } = req.query;
        // Validação simples
        if (!cat || !subCat || !data || !chave) {
            return res.status(400).json({ error: 'Faltando parâmetros obrigatórios' });
        }
        const results = await Documento.find({  $or: [
            { data_criacao: data },
            { departamento: req.user.departamento },
        { categoria: cat },
        { subcategoria: subCat },
        { nome: new RegExp(chave, 'i') }
      ]})
      .populate('categoria')
      .populate('subcategoria')
      .populate('situacao')
      .populate('municipio');

      const documentosComDiasRestantes = results.map(doc => {
        const dataValidade = new Date(doc.data_expiracao); // Converter string para Date
        const dataAtual = new Date();
        
        // Calcular diferença em milissegundos e converter para dias
        const diferencaMilissegundos = dataValidade - dataAtual;
        const diasRestantes = Math.ceil(diferencaMilissegundos / (1000 * 60 * 60 * 24));

        return {
            ...doc._doc,  // Espalhar o conteúdo original do documento
            diasRestantes: diasRestantes > 0 ? diasRestantes : 0  // Evitar valores negativos
        };
    });
      res.json(documentosComDiasRestantes);  // Retorna os resultados como JSON
    } catch (error) {
        console.log(error)
      res.status(500).json({ error: 'Erro ao buscar o município' });
    }
})

dep.get('/api/relatorio', eUser, async (req, res) => {
    try {
        // Parse da query string
        const { start, end } = req.query; // Data de início e fim da consulta

        // Filtro de data (caso as datas estejam no formato YYYY-MM-DD)
        const filter = {};
        if (start && end) {
            filter.data_criacao = { $gte: start, $lte: end };
        }
        filter.departamento = req.user.departamento;

        // Obter a contagem por departamento
        const departamentos = await Documento.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: '$categoria', // Agrupar por departamento
                    count: { $sum: 1 } // Contar documentos por departamento
                }
            },
            { $sort: { count: -1 } } // Ordenar pela contagem, caso deseje
            ,
            {
                $lookup: {
                    from: 'categorias', // Nome correto da coleção de departamentos
                    localField: '_id', // O campo local que faz a referência (neste caso, '_id' do grupo)
                    foreignField: '_id', // O campo na coleção 'departamentos' que corresponde ao '_id' de 'documentos'
                    as: 'categoria_info' // O nome do campo onde os dados do departamento serão armazenados
                }
            },
            {
                $unwind: '$categoria_info' // Opcional: Descompacta o array de dados populados
            }
        ]);

        // Obter a contagem por status
        const status = await Documento.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: '$situacao', // Agrupar por departamento
                    count: { $sum: 1 } // Contar documentos por departamento
                }
            },
            { $sort: { count: -1 } } // Ordenar pela contagem, caso deseje
            ,{
                $lookup: {
                    from: 'situacaos', // Nome correto da coleção de departamentos
                    localField: '_id', // O campo local que faz a referência (neste caso, '_id' do grupo)
                    foreignField: '_id', // O campo na coleção 'departamentos' que corresponde ao '_id' de 'documentos'
                    as: 's_info' // O nome do campo onde os dados do departamento serão armazenados
                }
            },
            {
                $unwind: '$s_info' // Opcional: Descompacta o array de dados populados
            }
            
        ]);

        // Enviar os dados no formato esperado para o frontend
        res.json({
            departamentos: departamentos.map(d => ({
                nome: d.categoria_info.nome,
                count: d.count
            })),
            status: status.map(s => ({
                nome: s.s_info.nome,
                count: s.count
            }))
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao gerar relatório' });
    }
});

dep.get('/api/documentos/recentes',eUser, (req, res) => {
    const { start, end } = req.query;
    const startDate = start;
    const endDate = end;

    Documento.find({ data_criacao: { $gte: startDate, $lte: endDate }, departamento: req.user.departamento })
        .limit(10)
        .populate('departamento')
        .populate('responsavel')
        .populate('situacao')
        .then(docs => res.json(docs))
        .catch(err => res.status(500).json({ error: 'Erro ao buscar documentos' }));
});

dep.get('/api/documentos/status' , eUser, async (req, res) => {
    try {
        const result = [];  // Use um array para armazenar os resultados.
        const list = await Situacao.find();  // Buscando todas as situações

        const { start, end } = req.query;
        // Usando o loop for...of para iterar diretamente sobre os itens da lista.
        for (const situacao of list) {
        // Realiza a contagem de documentos de forma assíncrona.
         const qt = await Documento.countDocuments({ situacao: situacao._id ,departamento: req.user.departamento , data_criacao: {
            $gte: start,
            $lte: end
        }});

        // Cria o objeto de resultado.
        const r = {
        nome: situacao.nome,
        qt: qt,
         };

         // Adiciona o objeto ao array de resultados.
         result.push(r);
        }
        res.json({dados: result})
    } catch (error) {
        console.log(error)
    }
})


/// ============ dash

dep.get('/dash' , eUser , async (req, res) => {
    try {
        const result = [];  // Use um array para armazenar os resultados.
        const list = await Situacao.find();  // Buscando todas as situações

        // Usando o loop for...of para iterar diretamente sobre os itens da lista.
        for (const situacao of list) {
        // Realiza a contagem de documentos de forma assíncrona.
         const qt = await Documento.countDocuments({ situacao: situacao._id , departamento: req.user.departamento});

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

dep.get('/anexos/:id', eUser, async (req, res) => {
    try 
    {
      const anexos = await Anexos.find({documento: req.params.id});
      res.render('admin/Anexos/index', {docID: req.params.id, anexos});
    } catch (erro) 
    {
      console.log(erro);
      res.status(500).send('Erro ao buscar categorias e subcategorias');
    }
});

dep.post('/anexos', eUser, upload2.single('documento'), async (req, res) => {
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
        });
        caminho = await Anexos.findOne({_id: documentId});
        cadastrarNotif(req.user, "Novo Anexo foi Cadastrado", "Cadastro");
        res.redirect('/anexos/'+caminho.documento);

        } catch (error) {
            console.error('Erro ao realizar o upload:', error);
            res.status(500).send({ message: error.message });
        }
    });
    

dep.get('/anexo_delet/:id', eDep, async (req, res)=>{
    try {
        const caminho = await Anexos.findOne({_id: req.params.id})
        fs.rm(caminho.caminho, { recursive: true, force: true }, (err) => {
            if (err) {
                console.error('Erro ao deletar diretório:', err);
            } else {
                console.log('Diretório deletado com sucesso.');
            }
        });

        const resp = await Anexos.findOneAndDelete({_id: req.params.id});
        cadastrarNotif(req.user, "Anexo foi Excluido", "Exclusao");
        req.flash('success_msg', "Diretorio deletado com Sucesso")
        res.redirect('/anexos/'+caminho.documento);
    } catch (error) {
        console.error('Erro ao deletar:', error);
        res.status(500).send({ message: error.message });
    }
})

//======================== auditoria ===========
dep.get("/auditoria", eUser, async(req, res)=>{
    try {
        
        const dados =  await Notificacoes.find({departamento: req.user.departamento})
        .populate('autor')
        .sort({dt: "desc"});
        res.render("admin/Auditoria/index", {dados});
    } catch (error) {
        console.log(error)
        res.send(error)
    }
})
//======================== Validade de Documento ===========
dep.get("/doc_validade", eUser, async(req, res)=>{
    try {
        
            const categorias = await Categoria.find();
            const subcategorias = await SubCategoria.find();
            const documentos = await Documento.find({})        
            .populate('categoria')
            .populate('subcategoria')
            .populate('situacao')
            .populate('municipio');
    
            const documentosComDiasRestantes = documentos.map(doc => {
                const dataValidade = new Date(doc.data_expiracao); // Converter string para Date
                const dataAtual = new Date();
                
                // Calcular diferença em milissegundos e converter para dias
                const diferencaMilissegundos = dataValidade - dataAtual;
                const diasRestantes = Math.ceil(diferencaMilissegundos / (1000 * 60 * 60 * 24));
    
                return {
                    ...doc._doc,  // Espalhar o conteúdo original do documento
                    diasRestantes: diasRestantes > 0 ? diasRestantes : 0  // Evitar valores negativos
                };
            });
            res.render("admin/Documento/validade", {dados: documentosComDiasRestantes, categorias, subcategorias});
        } catch (error) {
            res.status(500).json({ message: 'Erro ao calcular dias restantes', error });
        }
})


// ======   Categoria ===============
dep.get('/categoria', eUser, (req, res)=>{

    Categoria.find().then((categorias)=>{

        res.render('admin/Categoria/index', {categorias: categorias})
    })
})
dep.post('/new_categoria', eUser,(req, res)=>{
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
            cadastrarNotif(req.user, "Nova categoria foi Cadastrada", "Cadastro");
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
dep.get('/categoria_delet/:id', eDep, (req, res)=>{

    Categoria.deleteOne({_id:req.params.id}).then(()=>{
        cadastrarNotif(req.user, "Categoria foi Excluida", "Exclusao");
        req.flash('success_msg', 'deletado !')
        res.redirect('/admin/categoria')
    }).catch((error)=>{
        req.flash('error_msg', 'Erro ao deletar (', error,')')
        res.redirect('/admin/categoria')
    })
})

dep.get('/categoria/search_categoria/:q', eUser, async (req, res) => {
    const query = req.params.q.toLowerCase();
    try {
      const results = await Categoria.find({ nome: new RegExp(query, 'i') }); // Exemplo usando Mongoose
      res.json(results);  // Retorna os resultados como JSON
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar o município' });
    }
});


// ======   Sub Categoria ===============
dep.get('/subcategoria', eUser ,async (req, res) => {
    try {
      const categorias = await Categoria.find();
      const subcategorias = await SubCategoria.find().populate("categoria").populate("responsavel");
  
      res.render('admin/Subcategoria/index', { subcategorias, categorias });
    } catch (erro) {
      console.log(erro);
      res.status(500).send('Erro ao buscar categorias e subcategorias');
    }
  });
  
dep.post('/new_subcategoria', eUser, (req, res)=>{
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
            cadastrarNotif(req.user, "Nova subcategoria foi Cadastrada", "Cadastro");
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
dep.get('/subcategoria_delet/:id', eDep,(req, res)=>{

    SubCategoria.deleteOne({_id:req.params.id}).then(()=>{
        cadastrarNotif(req.user, "Subcategoria foi Excluida", "Exclusao");
        req.flash('success_msg', 'deletado !')
        res.redirect('/admin/subcategoria')
    }).catch((error)=>{
        req.flash('error_msg', 'Erro ao deletar (', error,')')
        res.redirect('/admin/subcategoria')
    })
})

dep.get('/subcategoria/search_subcategoria/:q', eUser, async (req, res) => {
    const query = req.params.q.toLowerCase();
    try {
      const results = await SubCategoria.find({ nome: new RegExp(query, 'i') }); // Exemplo usando Mongoose
      res.json(results);  // Retorna os resultados como JSON
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar a subcategoria' });
    }
});

// ========================  perfil ===========

dep.get("/perfil", eUser, async(req, res)=>{
    try {
        
        const dados =  await Usuario.find({_id: req.user._id}).populate('departamento')
        res.render("admin/Contas/perfil", {dados});
    } catch (error) {
        console.log(error)
        res.send(error)
    }
})


//========================login ===========

dep.get('/login',( req, res)=>{
    res.render('login')
})
dep.post('/login',( req, res, next)=>{

     passport.authenticate('local',{
         successRedirect: "/admin/dash",
         failureRedirect: "/login",
         failureFlash: true,
     })(req, res, next)
})

dep.get('/logout' ,(req, res)=>{
 req.logout(()=>{

     req.flash('success_msg','Sessão Terminada!')
     res.redirect('/login')
 })
})

module.exports = dep
