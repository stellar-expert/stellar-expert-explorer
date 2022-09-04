(async function () {
    process.env.TZ = 'Etc/UTC'

    await require('./connectors/mongodb-connector').init()

    const {port} = require('./app.config'),
        express = require('express'),
        bodyParser = require('body-parser'),
        http = require('http'),
        proxyValidator = require('./business-logic/proxy-validator')

    const app = express()
    app.disable('x-powered-by')

    app.use(proxyValidator)
    if (process.env.MODE === 'development') {
        const logger = require('morgan')
        app.use(logger('dev'))
    }

    app.use(bodyParser.json())
    app.use(bodyParser.urlencoded({extended: false}))

    //rewrite requests from the old path convention format
    app.use(function (req, res, next) {
        if (req.url.startsWith('/api/')) {
            req.url = req.url.replace('/api/', '/')
        }
        next()
    })
    //register API routes
    require('./api/routes/explorer-routes')(app)
    require('./api/routes/relation-routes')(app)
    require('./api/routes/ticker-routes')(app)
    require('./api/routes/payments-routes')(app)
    require('./api/routes/directory-routes')(app)
    require('./api/routes/price-routes')(app)
    require('./api/routes/demolisher-routes')(app)
    require('./api/routes/server-info-routes')(app)

    // error handler
    app.use((err, req, res, next) => {
        if (err && err.isBlockedByCors) return res.status(403).end()
        if (err) console.error(err)
        res.status(500).end()
    })

    const serverPort = parseInt(process.env.PORT || port || '3000')
    app.set('port', serverPort)

    const server = http.createServer(app)

    server.on('listening', () => console.log(`StellarExpert API server started on ${server.address().port} port.`))
    server.listen(serverPort)

    //TODO: add bulletproof error handling
})()