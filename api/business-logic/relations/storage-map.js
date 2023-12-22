const fs = require('fs')
const {StrKey} = require('@stellar/stellar-sdk')

function saveRelationsMap(address, relations) {
    if (!StrKey.isValidEd25519PublicKey(address))
        return {}
    fs.writeFileSync(__dirname + '/' + address + '.json', JSON.stringify(relations))
    return {ok: 1}
}

function loadRelationsMap(address) {
    try {
        if (!StrKey.isValidEd25519PublicKey(address))
            return {}
        const raw = fs.readFileSync(__dirname + '/' + address + '.json', 'utf8')
        return JSON.parse(raw)
    } catch (e) {
        console.error(e)
        return {}
    }
}

module.exports = {loadRelationsMap, saveRelationsMap}