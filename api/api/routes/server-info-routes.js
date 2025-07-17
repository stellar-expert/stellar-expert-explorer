const {getServerInfo} = require('../../business-logic/server-info/server-status')
const {getCrawlerList} = require('../../business-logic/server-info/crawler')
const {registerRoute} = require('../router')

module.exports = function (app) {
    registerRoute(app,
        '',
        {prefix: '/', headers: {'Cache-Control': 'no-store'}},
        () => getServerInfo())

    registerRoute(app,
        'crawlers',
        {prefix: '/'},
        () => getCrawlerList())
}