if(process.env.NODE_ENV == "production"){
    module.exports = {mongoURI : "https://data.mongodb-api.com/app/data-oawfamm/endpoint/data/v1"}
}else{
    module.exports = {mongoURI : "mongodb://localhost/ipgul_doc"}
}