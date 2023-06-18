const MongoClient = require('mongodb').MongoClient
const config = require('../app.config')

const connections = {
    archive: {},

    async init() {
        for (const [networkName, networkParams] of Object.entries(config.networks)) {
            const options = {
                appname: 'api-stellar-expert',
                promoteValues: true,
                promoteLongs: false,
                directConnection: true,
                useUnifiedTopology: true,
                maxPoolSize: 30,
                minPoolSize: 2 //Maintain up to 30 socket connections
            }
            try {
                const connection = await MongoClient.connect(networkParams.db, options)
                connections[networkName] = connection.db()
                console.log(`Connected to db ${networkParams.db}`)

                const archive = await MongoClient.connect(networkParams.archive, options)
                connections.archive[networkName] = archive.db()
                console.log(`Connected to archive ${networkParams.archive}`)
            } catch (e) {
                console.error(e)
            }
        }
    }
}

module.exports = connections