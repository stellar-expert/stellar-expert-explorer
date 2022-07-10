const MongoClient = require('mongodb').MongoClient,
    config = require('../app.config')

const connections = {
    async init() {
        for (const networkName in config.networks) {
            if (config.networks.hasOwnProperty(networkName)) {
                const network = config.networks[networkName]
                const options = {
                    appname: 'api-stellar-expert',
                    promoteValues: true,
                    promoteLongs: false,
                    keepAlive: true,
                    useNewUrlParser: true,
                    useUnifiedTopology: true,
                    poolSize: 30 // maintain up to 30 socket connections
                }
                if (network.replicaSet) {
                    options.replicaSet = network.replicaSet
                }
                try {
                    const connection = await MongoClient.connect(network.db, options),
                        db =  connections[networkName] = connection.db()
                    console.log(`Connected to ${db.databaseName}`)
                } catch (e) {
                    console.error(e)
                }
            }
        }
    }
}

module.exports = connections