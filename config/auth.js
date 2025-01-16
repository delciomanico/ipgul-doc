const localStrategy = require('passport-local').Strategy
const mongoose = require('mongoose')
const bcrypt  =  require('bcryptjs')


//model de usuario
require('../models/Usuario')
const Usuario = mongoose.model('usuario')


module.exports = function(passport){
        passport.use(new localStrategy({usernameField: "email", passwordField: "senha"}, (email, senha, done)=>{

            Usuario.findOne({email: email}).then((usuario)=>{
                if(!usuario){
                    
                    return done(null, false, {message: "Esta conta não existe"})
                }
                bcrypt.compare(senha, usuario.senha, (erro, isIgual)=>{
                    if(isIgual){
                        return done(null, usuario)
                    }else{
                        return done(null, false, {message: "Senha incorreta"})
                    }
                })
            })
        }))


        passport.serializeUser((user, done)=>{
            done(null, user.id)
        })

        passport.deserializeUser((id, done)=>{
            Usuario.findById(id).then((usuario)=>{
                done(null,usuario)
            }).catch((error)=>{
                done(error)
            })
        })
}