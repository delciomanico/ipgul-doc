const admin = require('./routes/admin')
const express = require('express')
const app = express()
const consolidate = require('consolidate')
const handlebars = require('express-handlebars')
const bodyParser = require('body-parser')
const path = require('path')
const mongoose = require('mongoose')
const flash = require('connect-flash')
const session = require('express-session')
const passport = require('passport')
const db = require('./config/db')
require('./config/auth')(passport)

//const Postagem = mongoose.model('postagem')
//const Categoria = mongoose.model('categorias')





//config
//SESSIONS
app.use(session({
    secret: "curso",
    resave: true,
    saveUninitialized: true
}))

app.use(passport.initialize())
app.use(passport.session())

app.use(flash())
//MIDDLEWARES
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg')
    res.locals.error_msg = req.flash('error_msg')
    res.locals.error = req.flash('error')
    res.locals.user = req.user
    next()
})
//views templates
app.set('views', './views')
//app.engine('html', consolidate.handlebars)
app.engine('html', handlebars.engine({ defaultLayout: 'main' }))
app.set('view engine', 'html')
//body parse
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
//mongoose
mongoose.Promise = global.Promise
mongoose.connect(db.mongoURI).then(() => {
    console.log("conectado")
}).catch((err) => {
    console.log("Erro na conexao", err)
})
//public
const uploadsDir = path.join(__dirname, 'uploads')
app.use('/admin/uploads', express.static(uploadsDir))
app.use(express.static(path.join(__dirname, "public")))


//routas
app.get('/',(req,res)=>{
    res.render('login')
})


//outros
app.use("/admin", admin)

const PORT = process.env.PORT || 8080
app.listen(PORT, () => { console.log('conectado na posta. http://localhost:8080') })
