const fs = require('fs')
const {StrKey} = require('stellar-sdk')

function saveRelationsMap(address, relations) {
    if (!StrKey.isValidEd25519PublicKey(address))
        return null
    fs.writeFileSync(address + '.json', JSON.stringify(relations))
}

function loadRelationsMap(address) {
    if (!StrKey.isValidEd25519PublicKey(address))
        return null
    const raw = fs.readFileSync(address + '.json', 'utf8')
    return JSON.parse(raw)
}

module.exports = {loadRelationsMap, saveRelationsMap}