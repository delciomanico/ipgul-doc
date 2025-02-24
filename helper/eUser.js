module.exports = {
    eUser: function(req, res, next){
        if(req.isAuthenticated() && req.user.eAcesso >= 1){
            return next()
        }
        req.flash("error_msg", "Apenas administradores podem aceder a esta pagina")
        res.redirect('/404')
    }
}