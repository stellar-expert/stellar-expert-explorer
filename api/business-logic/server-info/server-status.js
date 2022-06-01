const {version} = require('../../package')

function getServerInfo() {
    return {
        timezone: 'UTC',
        serverTime: new Date().getTime(),
        version
    }
}

module.exports = {getServerInfo}