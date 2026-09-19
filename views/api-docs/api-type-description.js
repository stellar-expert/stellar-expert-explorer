/**
 * Build a human-readable type description for a dereferenced schema
 * @param {{}} schema - dereferenced schema node
 * @return {String}
 */
export default function describeType(schema) {
    if (!schema || typeof schema !== 'object')
        return ''
    const variants = schema.anyOf || schema.oneOf
    if (variants?.length)
        return variants.map(describeType).filter(v => !!v).join(' | ')
    if (schema.type === 'array') {
        const items = describeType(schema.items)
        return items ? `Array of ${items}` : 'array'
    }
    const name = schema.ref || schema.title
    if (!schema.type)
        return name || ''
    return name ? `${schema.type} (${name})` : schema.type
}
