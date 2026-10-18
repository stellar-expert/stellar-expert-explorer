/**
 * Build a compact human-readable type description for a dereferenced schema, e.g. "array of AssetInfo"
 * @param {{}} schema - dereferenced schema node
 * @param {Boolean} [named] - prefer the schema component name over "object" (array items and variants)
 * @return {String}
 */
export default function describeType(schema, named = false) {
    if (!schema || typeof schema !== 'object')
        return ''
    const variants = schema.anyOf || schema.oneOf
    if (variants?.length)
        return variants.map(variant => describeType(variant, true)).filter(v => !!v).join(' | ')
    if (schema.type === 'array') {
        const items = describeType(schema.items, true)
        if (!items)
            return 'array'
        return 'array of ' + (items.includes(' | ') ? `(${items})` : items)
    }
    const name = schema.ref || schema.title
    if (schema.type === 'object' || schema.allOf || (!schema.type && name))
        return named && name ? name : 'object'
    if (!schema.type)
        return ''
    const type = Array.isArray(schema.type) ? schema.type.join(' | ') : schema.type
    return schema.format ? `${type} · ${schema.format}` : type
}

/**
 * Describe value constraints of a schema, e.g. "1–200"
 * @param {{}} schema - dereferenced schema node
 * @return {String}
 */
export function describeConstraints(schema) {
    if (!schema)
        return ''
    const parts = [
        describeRange(schema.minimum, schema.maximum),
        describeRange(schema.minLength, schema.maxLength, ' chars'),
        describeRange(schema.minItems, schema.maxItems, ' items')
    ]
    if (schema.uniqueItems) {
        parts.push('unique')
    }
    return parts.filter(p => !!p).join(', ')
}

function describeRange(min, max, unit = '') {
    const hasMin = min !== undefined && min !== null
    const hasMax = max !== undefined && max !== null
    if (hasMin && hasMax)
        return `${min}–${max}${unit}`
    if (hasMin)
        return `≥ ${min}${unit}`
    if (hasMax)
        return `≤ ${max}${unit}`
    return ''
}
