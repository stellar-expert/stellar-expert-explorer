const {registerRoute} = require('../router'),
    {getServerInfo} = require('../../business-logic/server-info/server-status')

module.exports = function (app) {
    registerRoute(app,
        '',
        {prefix:'/', prettyPrint: true},
        () => getServerInfo())
}