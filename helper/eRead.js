module.exports = {
    eRead: function(req, res, next){
        if(req.isAuthenticated() && req.user.eAdmin >= 1){
            return next()
        }
        req.flash("error_msg", "Apenas administradores podem aceder a esta pagina")
        res.redirect('/')
    }
}