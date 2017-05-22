exports.DATABASE_URL = process.env.DATABASE_URL ||
                       global.DATABASE_URL ||
                       'mongodb://jdog:blackhawks1@ds149551.mlab.com:49551/blogly'
exports.PORT = process.env.PORT || 8080;