module.exports = {
    eAdmin: function(req, res, next){
        if(req.isAuthenticated() && req.user.eAdmin == 3){
            return next()
        }
        req.flash("error_msg", "Nao tem permissao para aceder a esta pagina")
        res.redirect('/')
    }
}