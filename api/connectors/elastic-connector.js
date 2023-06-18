const {Client} = require('@elastic/elasticsearch')
const config = require('../app.config.json')

const elastic = new Client({
    node: config.elastic,
    compression: true,
    suggestCompression: true,
    name: 'api'
})

module.exports = elastic