/**
 * Create a new object, copying only specified fields.
 * @param {Object} source - Source object.
 * @param {Array<String>} fields - Fields to copy.
 * @return {Object}
 */
function cloneFields(source, fields) {
    if (!(fields instanceof Array) || !fields.length) throw new Error('Specify fields to copy.')
    const res = {}
    if (!source) {
        source = {}
    }
    for (let field of fields) {
        res[field] = source[field]
    }
    return res
}

export default cloneFields