const {proxyValidationKey} = require('../app.config')

const localhost = ['::1', '127.0.0.1', '::ffff:127.0.0.1']

module.exports = function (req, res, next) {
    if (proxyValidationKey) {
        //allow localhost connections
        if (!localhost.includes(req.connection.remoteAddress)) {
            //check x-proxy-validation header
            const validation = req.headers['x-proxy-validation']
            if (validation !== proxyValidationKey) {
                res.status(403).json({error: 'Proxy validation failed'})
                return
            }
        }
    }
    next()
}