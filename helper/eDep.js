module.exports = {
    eDep: function(req, res, next){
        if(req.isAuthenticated() && req.user.eAcesso == 2){
            return next()
        }
        req.flash("error_msg", "Nao tem permissao para aceder a esta pagina")
        res.redirect('/404')
    }
}