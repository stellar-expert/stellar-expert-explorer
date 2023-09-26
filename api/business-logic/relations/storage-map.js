const fs = require('fs')
const {StrKey} = require('stellar-sdk')

function saveRelationsMap(address, relations) {
    if (!StrKey.isValidEd25519PublicKey(address))
        return {}
    fs.writeFileSync(address + '.json', JSON.stringify(relations))
    return {ok: 1}
}

function loadRelationsMap(address) {
    if (!StrKey.isValidEd25519PublicKey(address))
        return {}
    const raw = fs.readFileSync(address + '.json', 'utf8')
    return JSON.parse(raw)
}

module.exports = {loadRelationsMap, saveRelationsMap}