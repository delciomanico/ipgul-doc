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
/// =================== Documento ===========
admin.get('/doc', eAdmin, async (req, res) => {

    try {
        const categorias = await Categoria.find();
        const subcategorias = await SubCategoria.find();
        const documentos = await Documento.find()
            .populate('categoria')
            .populate('subcategoria')
            .populate('departamento')
            .populate('situacao')
            .populate('responsavel')
            .populate('municipio')
            .sort({ dt: "desc" });
        res.render("admin/Documento/index2", { documentos, categorias, subcategorias })
    } catch (erro) {
        console.log(erro);
        res.status(500).send('Erro ao buscar categorias e subcategorias');
    }

});
admin.get('/new_doc', eAdmin, async (req, res) => {

    try {
        const categorias = await Categoria.find();
        const subcategorias = await SubCategoria.find();
        const departamento = await Departamento.find();
        const municipio = await Municipio.find();
        const situacao = await Situacao.find();
        const seg_nivel = await SegDoc.find();

        res.render("admin/Documento/novo2", { subcategorias, categorias, departamento, municipio, situacao, seg_nivel })
    } catch (erro) {
        console.log(erro);
        res.status(500).send('Erro ao buscar categorias e subcategorias');
    }

});


admin.get('/doc_delet/:id', eAdmin, async (req, res) => {
    try {
        const caminho = await Documento.findOne({ _id: req.params.id })
        const camAnexo = path.join('uploads', 'extra', req.params.id)
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
        await deletarDocumento(req.params.id);
        Anexos.deleteMany({ documento: req.params.id });
        cadastrarNotif(req.user, "Documento foi Excluido", "Exclusao");
        req.flash('success_msg', "Usuario Cadastrado com Sucesso")
        res.redirect('/admin/doc')
    } catch (error) {
        console.error('Erro ao deletar:', error);
        res.status(500).send({ message: error.message });
    }
})

admin.post('/cad_doc', eAdmin, upload.single('documento'), async (req, res) => {
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

        });
        cadastrarNotif(req.user, "Novo documento foi Cadastrado", "Cadastro");
        res.redirect('back');
    } catch (error) {
        console.error('Erro ao realizar o upload:', error);
        res.status(500).send({ message: error.message });
    }
});


/// ========== api ==========================00

admin.get('/documento/search_documento/doc', eAdmin, async (req, res) => {
    try {
        const { cat, subCat, data, chave } = req.query;
        // Validação simples
        if (!cat || !subCat || !data || !chave) {
            return res.status(400).json({ error: 'Faltando parâmetros obrigatórios' });
        }
        const results = await Documento.find({
            $or: [
                { data_criacao: data },
                { departamento: req.user.departamento },
                { categoria: cat },
                { subcategoria: subCat },
                { nome: new RegExp(chave, 'i') }
            ]
        })
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
admin.get('/documento/search_validade/doc', eAdmin, async (req, res) => {
    try {
        const { cat, subCat, data, chave } = req.query;
        // Validação simples
        if (!cat || !subCat || !data || !chave) {
            return res.status(400).json({ error: 'Faltando parâmetros obrigatórios' });
        }
        const results = await Documento.find({
            $or: [
                { data_criacao: data },
                { departamento: req.user.departamento },
                { categoria: cat },
                { subcategoria: subCat },
                { nome: new RegExp(chave, 'i') }
            ]
        })
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

admin.get('/api/relatorio', eAdmin, async (req, res) => {
    try {
        // Parse da query string
        const { start, end } = req.query; // Data de início e fim da consulta

        // Filtro de data (caso as datas estejam no formato YYYY-MM-DD)
        const filter = {};
        if (start && end) {
            filter.data_criacao = { $gte: start, $lte: end };
        }
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
            , {
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

admin.get('/api/documentos/recentes', eAdmin, (req, res) => {
    const { start, end } = req.query;
    const startDate = start;
    const endDate = end;

    Documento.find({ data_criacao: { $gte: startDate, $lte: endDate } })
        .limit(10)
        .populate('departamento')
        .populate('responsavel')
        .populate('situacao')
        .then(docs => res.json(docs))
        .catch(err => res.status(500).json({ error: 'Erro ao buscar documentos' }));
});

admin.get('/api/documentos/status', eAdmin, async (req, res) => {
    try {
        const result = [];  // Use um array para armazenar os resultados.
        const list = await Situacao.find();  // Buscando todas as situações

        const { start, end } = req.query;
        // Usando o loop for...of para iterar diretamente sobre os itens da lista.
        for (const situacao of list) {
            // Realiza a contagem de documentos de forma assíncrona.
            const qt = await Documento.countDocuments({
                situacao: situacao._id, data_criacao: {
                    $gte: start,
                    $lte: end
                }
            });

            // Cria o objeto de resultado.
            const r = {
                nome: situacao.nome,
                qt: qt,
            };

            // Adiciona o objeto ao array de resultados.
            result.push(r);
        }
        res.json({ dados: result })
    } catch (error) {
        console.log(error)
    }
})


/// ============ dash

admin.get('/dash', eUser, async (req, res, next) => {

    if (req.user.eAcesso < 3) {
        res.redirect('/dash');
        return next();
    }

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
        res.render('admin/dash2', { dados: result })
    } catch (error) {
        console.log(error)
    }
})
/// ============ Anexos

admin.get('/anexos/:id', eAdmin, async (req, res) => {
    try {
        const anexos = await Anexos.find({ documento: req.params.id });
        res.render('admin/Anexos/index2', { docID: req.params.id, anexos });
    } catch (erro) {
        console.log(erro);
        res.status(500).send('Erro ao buscar ');
    }
});

admin.post('/anexos', eAdmin, upload2.single('documento'), async (req, res) => {
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
        cadastrarNotif(req.user, "Novo Anexo foi Cadastrado", "Cadastro");
        res.location(req.get("Referrer"))

    } catch (error) {
        console.error('Erro ao realizar o upload:', error);
        res.status(500).send({ message: error.message });
    }
});


admin.get('/anexo_delet/:id', eAdmin, async (req, res) => {
    try {
        const caminho = await Anexos.findOne({ _id: req.params.id })
        fs.rm(caminho.caminho, { recursive: true, force: true }, (err) => {
            if (err) {
                console.error('Erro ao deletar diretório:', err);
            } else {
                console.log('Diretório deletado com sucesso.');
            }
        });

        const resp = await Anexos.findOneAndDelete({ _id: req.params.id });
        cadastrarNotif(req.user, "Anexo foi Excluido", "Exclusao");
        req.flash('success_msg', "Diretorio deletado com Sucesso")
        res.redirect('/admin/anexos/' + caminho.documento);
    } catch (error) {
        console.error('Erro ao deletar:', error);
        res.status(500).send({ message: error.message });
    }
})

// ======   Categoria ===============
admin.get('/categoria', eAdmin, (req, res) => {

    Categoria.find().then((categorias) => {

        res.render('admin/Categoria/index2', { categorias: categorias })
    })
})
admin.post('/new_categoria', eAdmin, (req, res) => {
    erros = []

    if (!req.body.nome || typeof req.body.nome == undefined || req.body.nome == null) {
        erros.push({ texto: "Nome invalido" })
    }
    if (req.body.nome.length < 2) {
        erros.push({ texto: "Nome da categoria, muito pequena" })
    }
    if (erros.length > 0) {
        res.render("admin/Categoria/index2", { erros: erros })
    } else {
        new Categoria({
            nome: req.body.nome,
            responsavel: req.body.responsavel
        }).save().then(() => {
            cadastrarNotif(req.user, "Nova categoria foi Cadastrada", "Cadastro");
            req.flash('success_msg', 'Categoria criada com exito')
            console.log("Categoria cadastrada")
            res.redirect('/admin/Categoria')
        }).catch((err) => {
            req.flash('error_msg', 'erro ao criar, tente novamente')
            console.log("erro no cadastro . ", err)
            res.redirect('/admin/Categoria')
        })
    }
})
admin.get('/categoria_delet/:id', eAdmin, (req, res) => {

    Categoria.deleteOne({ _id: req.params.id }).then(() => {
        cadastrarNotif(req.user, "Categoria foi Excluida", "Exclusao");
        req.flash('success_msg', 'deletado !')
        res.redirect('/admin/categoria')
    }).catch((error) => {
        req.flash('error_msg', 'Erro ao deletar (', error, ')')
        res.redirect('/admin/categoria')
    })
})

admin.get('/categoria/search_categoria/:q', eAdmin, async (req, res) => {
    const query = req.params.q.toLowerCase();
    try {
        const results = await Categoria.find({ nome: new RegExp(query, 'i') }); // Exemplo usando Mongoose
        res.json(results);  // Retorna os resultados como JSON
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar o categoria' });
    }
});


// ======   Sub Categoria ===============
admin.get('/subcategoria', eAdmin, async (req, res) => {
    try {
        const categorias = await Categoria.find();
        const subcategorias = await SubCategoria.find().populate("categoria").populate("responsavel");

        res.render('admin/Subcategoria/index2', { subcategorias, categorias });
    } catch (erro) {
        console.log(erro);
        res.status(500).send('Erro ao buscar categorias e subcategorias');
    }
});

admin.post('/new_subcategoria', eAdmin, (req, res) => {
    erros = []

    if (!req.body.nome || typeof req.body.nome == undefined || req.body.nome == null) {
        erros.push({ texto: "Nome invalido" })
    }
    if (req.body.nome.length < 2) {
        erros.push({ texto: "Nome da subcategoria, muito pequeno" })
    }
    if (erros.length > 0) {
        res.render("/admin/Subcategoria/index2", { erros: erros })
    } else {
        new SubCategoria({
            nome: req.body.nome,
            categoria: req.body.categoria,
            responsavel: req.body.responsavel
        }).save().then(() => {
            cadastrarNotif(req.user, "Nova subcategoria foi Cadastrada", "Cadastro");
            req.flash('success_msg', 'criada com exito')
            console.log("cadastrada")
            res.redirect('/admin/subcategoria')
        }).catch((err) => {
            req.flash('error_msg', 'erro ao criar, tente novamente')
            console.log("erro no cadastro . ", err)
            res.redirect('/admin/subcategoria')
        })
    }
})
admin.get('/subcategoria_delet/:id', eAdmin, (req, res) => {

    SubCategoria.deleteOne({ _id: req.params.id }).then(() => {
        cadastrarNotif(req.user, "Subcategoria foi Excluida", "Exclusao");
        req.flash('success_msg', 'deletado !')
        res.redirect('/admin/subcategoria')
    }).catch((error) => {
        req.flash('error_msg', 'Erro ao deletar (', error, ')')
        res.redirect('/admin/subcategoria')
    })
})

admin.get('/subcategoria/search_subcategoria/:q', eAdmin, async (req, res) => {
    const query = req.params.q.toLowerCase();
    try {
        const results = await SubCategoria.find({ nome: new RegExp(query, 'i') }); // Exemplo usando Mongoose
        res.json(results);  // Retorna os resultados como JSON
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar a subcategoria' });
    }
});

// ======   Departamaento ===============
admin.get('/departamento', eAdmin, (req, res) => {

    Departamento.find().then((departamentos) => {

        res.render('admin/Departamento/index', { departamentos: departamentos })
    })
})
admin.get('/departamento_delet/:id', eAdmin, (req, res) => {

    Departamento.deleteOne({ _id: req.params.id }).then(() => {
        req.flash('success_msg', 'Departamento deletado !')
        res.redirect('/admin/departamento')
    }).catch((error) => {
        req.flash('error_msg', 'Erro ao deletar departamento (', error, ')')
        res.redirect('/admin/departamento')
    })
})
admin.post('/new_departamento', eAdmin, (req, res) => {
    erros = []

    if (!req.body.nome || typeof req.body.nome == undefined || req.body.nome == null) {
        erros.push({ texto: "Nome invalido" })
    }
    if (req.body.nome.length < 2) {
        erros.push({ texto: "Nome da departamento, muito pequena" })
    }
    if (erros.length > 0) {
        res.render("admin/departamento", { erros: erros })
    } else {
        new Departamento({
            nome: req.body.nome,
        }).save().then(() => {
            req.flash('success_msg', 'Departamento criada com exito')
            console.log("Departamento cadastrada")
            res.redirect('/admin/departamento')
        }).catch((err) => {
            req.flash('error_msg', 'erro ao criar, tente novamente')
            console.log("erro no cadastro . ", err)
            res.redirect('/admin/departamento')
        })
    }
})
admin.post('/departamento_edit', eAdmin, async (req, res) =>{
    try {
        const { id, nome } = req.body;
        const responsavel = req.user._id;
        const departamento = await Departamento.findByIdAndUpdate(id, { nome, responsavel}, { new: true });
        req.flash('success_msg', '  Editado!');
        res.redirect("/admin/departamento")
    } catch (error) {
        console.log(error)
        res.send(error)
    }
})
admin.get('/departamento/search_departamento/:q', eAdmin, async (req, res) => {
    const query = req.params.q.toLowerCase();
    try {
        const results = await Departamento.find({ nome: new RegExp(query, 'i') }); // Exemplo usando Mongoose
        res.json(results);  // Retorna os resultados como JSON
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar o departamento' });
    }
});
// ======   Municipio ===============
admin.get('/municipio', eAdmin, (req, res) => {

    Municipio.find().then((municipio) => {
        res.render('admin/Municipio/index', { municipio: municipio })
    })
})
admin.get('/municipio_delet/:id', eAdmin, (req, res) => {

    Municipio.deleteOne({ _id: req.params.id }).then(() => {
        req.flash('success_msg', 'Municipio deletado !')
        res.redirect('/admin/municipio')
    }).catch((error) => {
        req.flash('error_msg', 'Erro ao deletar municipio (', error, ')')
        res.redirect('/admin/municipio')
    })
})
admin.post('/new_municipio', eAdmin, (req, res) => {
    erros = []

    if (!req.body.nome || typeof req.body.nome == undefined || req.body.nome == null) {
        erros.push({ texto: "Nome invalido" })
    }
    if (req.body.nome.length < 3) {
        erros.push({ texto: "Nome da municipio, muito pequena" })
    }
    if (erros.length > 0) {
        res.render("admin/municipio", { erros: erros })
    } else {
        new Municipio({
            nome: req.body.nome,
        }).save().then(() => {
            req.flash('success_msg', 'Municipio criado com exito')
            res.redirect('/admin/municipio')
        }).catch((err) => {
            req.flash('error_msg', 'erro ao criar, tente novamente')
            console.log("erro no cadastro . ", err)
            res.redirect('/admin/municipio')
        })
    }
})

admin.post('/municipio_edit', eAdmin, async (req, res) =>{
    try {
        const { id, nome } = req.body;
        const responsavel = req.user._id;
        const municipio = await Municipio.findByIdAndUpdate(id, { nome, responsavel}, { new: true });
        req.flash('success_msg', '  Editado!');
        res.redirect("/admin/municipio")
    } catch (error) {
        console.log(error)
        res.send(error)
    }
})
admin.get('/municipio/search_municipio/:q', eAdmin, async (req, res) => {
    const query = req.params.q.toLowerCase();
    try {
        const results = await Municipio.find({ nome: new RegExp(query, 'i') }); // Exemplo usando Mongoose
        res.json(results);  // Retorna os resultados como JSON
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar o município' });
    }
});

// ======   Situacao ===============
admin.get('/situacao', eAdmin, (req, res) => {

    Situacao.find().then((situacao) => {

        res.render('admin/Situacao/index', { situacao: situacao })
    })
})
admin.get('/situacao_delet/:id', eAdmin, (req, res) => {

    Situacao.deleteOne({ _id: req.params.id }).then(() => {
        req.flash('success_msg', 'Situacao deletado !')
        res.redirect('/admin/situacao')
    }).catch((error) => {
        req.flash('error_msg', 'Erro ao deletar situacao (', error, ')')
        res.redirect('/admin/situacao')
    })
})
admin.post('/new_situacao', eAdmin, (req, res) => {
    erros = []

    if (!req.body.nome || typeof req.body.nome == undefined || req.body.nome == null) {
        erros.push({ texto: "Nome invalido" })
    }
    if (req.body.nome.length < 3) {
        erros.push({ texto: "Nome da municipio, muito pequena" })
    }
    if (erros.length > 0) {
        res.render("admin/situacao", { erros: erros })
    } else {
        new Situacao({
            nome: req.body.nome,
        }).save().then(() => {
            req.flash('success_msg', 'Situacao criado com exito')
            res.redirect('/admin/situacao')
        }).catch((err) => {
            req.flash('error_msg', 'erro ao criar, tente novamente')
            console.log("erro no cadastro . ", err)
            res.redirect('/admin/situacao')
        })
    }
})

admin.post('/situacao_edit', eAdmin, async (req, res) =>{
    try {
        const { id, nome } = req.body;
        const responsavel = req.user._id;
        const situacao = await Situacao.findByIdAndUpdate(id, { nome, responsavel}, { new: true });
        req.flash('success_msg', '  Editado!');
        res.redirect("/admin/situacao")
    } catch (error) {
        console.log(error)
        res.send(error)
    }
})

admin.get('/situacao/search_situacao/:q', eAdmin, async (req, res) => {
    const query = req.params.q.toLowerCase();
    try {
        const results = await Situacao.find({ nome: new RegExp(query, 'i') }); // Exemplo usando Mongoose
        res.json(results);  // Retorna os resultados como JSON
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar a situacao' });
    }
});
// ======   nivel segurança ===============
admin.get('/seg_doc', eAdmin, (req, res) => {

    SegDoc.find().then((seg_doc) => {

        res.render('admin/SegurancaDoc/index', { seg_doc: seg_doc })
    })
})
admin.get('/seg_doc_delet/:id', eAdmin, (req, res) => {

    SegDoc.deleteOne({ _id: req.params.id }).then(() => {
        req.flash('success_msg', ' deletado !')
        res.redirect('/admin/seg_doc')
    }).catch((error) => {
        req.flash('error_msg', 'Erro ao deletar (', error, ')')
        res.redirect('/admin/seg_doc')
    })
})
admin.post('/new_seg_doc', eAdmin, (req, res) => {
    erros = []

    if (!req.body.nome || typeof req.body.nome == undefined || req.body.nome == null) {
        erros.push({ texto: "Nome invalido" })
    }
    if (req.body.nome.length < 3) {
        erros.push({ texto: "Nome muito pequena" })
    }
    if (erros.length > 0) {
        res.render("admin/seg_doc", { erros: erros })
    } else {
        new SegDoc({
            nome: req.body.nome,
        }).save().then(() => {
            req.flash('success_msg', 'criado com exito')
            res.redirect('/admin/seg_doc')
        }).catch((err) => {
            req.flash('error_msg', 'erro ao criar, tente novamente')
            console.log("erro no cadastro . ", err)
            res.redirect('/admin/seg_doc')
        })
    }
})

admin.get('/seg_doc/search_seg_doc/:q', eAdmin, async (req, res) => {
    const query = req.params.q.toLowerCase();
    try {
        const results = await SegDoc.find({ nome: new RegExp(query, 'i') }); // Exemplo usando Mongoose
        res.json(results);  // Retorna os resultados como JSON
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar o município' });
    }
});


//======================== contas ===========

admin.get("/contas", eAdmin, async (req, res) => {
    try {

        const contas = await Usuario.find().populate('departamento')
        res.render("admin/Contas/index", { contas });
    } catch (error) {
        console.log(error)
        res.send(error)
    }
})

admin.get('/conta_delet/:id', eAdmin, (req, res) => {

    Usuario.deleteOne({ _id: req.params.id }).then(() => {
        req.flash('success_msg', ' deletado !')
        res.redirect('contas')
    }).catch((error) => {
        req.flash('error_msg', 'Erro ao deletar (', error, ')')
        res.redirect('contas')
    })
})

admin.get('/conta/search_conta/:q', eAdmin, async (req, res) => {
    const query = req.params.q.toLowerCase();
    try {
        const results = await Usuario.find({ nome: new RegExp(query, 'i') }); // Exemplo usando Mongoose
        res.json(results);  // Retorna os resultados como JSON
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar conta' });
    }
});

admin.post('/conta_edit', eAdmin, async (req, res) =>{
    try {
        const { id, eAcesso } = req.body;
        const conta = await Usuario.findByIdAndUpdate(id, {eAcesso}, { new: true });
        req.flash('success_msg', '  Editado!');
        res.redirect("/admin/contas")
    } catch (error) {
        console.log(error)
        res.send(error)
    }
})
//======================== auditoria ===========
admin.get("/auditoria", eAdmin, async (req, res) => {
    try {

        const dados = await Notificacoes.find().populate('autor').sort({ dt: "desc" });
        res.render("admin/Auditoria/index2", { dados });
    } catch (error) {
        console.log(error)
        res.send(error)
    }
})

admin.get('/auditoria_delet/:id', eAdmin, (req, res) => {

    Notificacoes.deleteOne({ _id: req.params.id }).then(() => {
        req.flash('success_msg', ' deletado !')
        res.redirect('/admin/auditoria')
    }).catch((error) => {
        req.flash('error_msg', 'Erro ao deletar (', error, ')')
        res.redirect('/admin/auditoria')
    })
})

admin.get('/auditoria/search_auditoria/:q', eAdmin, async (req, res) => {
    const query = req.params.q.toLowerCase();
    try {
        const results = await Usuario.find({ nome: new RegExp(query, 'i') }); // Exemplo usando Mongoose
        res.json(results);  // Retorna os resultados como JSON
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar conta' });
    }
});


//======================== Validade de Documento ===========
admin.get("/doc_validade", eAdmin, async (req, res) => {
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
        res.render("admin/Documento/validade2", { dados: documentosComDiasRestantes, categorias, subcategorias });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao calcular dias restantes', error });
    }
})

// ========================  perfil ===========

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


//========================login ===========

admin.get('/login', (req, res) => {
    res.render('login')
})
admin.post('/login', (req, res, next) => {

    passport.authenticate('local', {
        successRedirect: "/admin/dash",
        failureRedirect: "/login",
        failureFlash: true,
    })(req, res, next)
})

admin.get('/logout', (req, res) => {
    req.logout(() => {

        req.flash('success_msg', 'Sessão Terminada!')
        res.redirect('/login')
    })
})
module.exports = admin
