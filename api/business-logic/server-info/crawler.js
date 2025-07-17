const {crawlers} = require('../../app.config')

function getCrawlerList() {
    return crawlers
}

module.exports = {getCrawlerList}