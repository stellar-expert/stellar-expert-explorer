const {registerRoute} = require('../router'),
    {signTransaction} = require('../../business-logic/demolisher/account-demolisher')

module.exports = function (app) {
    registerRoute(app,
        'merge',
        {prefix: '/demolisher/:network/', method: 'post'},
        req => signTransaction(req.params.network, req.body.transaction)
    )
}