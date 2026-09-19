/**
 * @typedef {{}} ApiOperation
 * @property {String} path - templated request path, e.g. "/explorer/{network}/account/{address}"
 * @property {String} method - lowercase HTTP method
 * @property {String} operationId - unique operation identifier
 * @property {String} summary - short operation title
 * @property {String} description - detailed operation description (markdown)
 * @property {String} tag - primary operation tag
 * @property {Array} parameters - fully dereferenced parameters list
 * @property {{}} responses - fully dereferenced responses map
 */

/**
 * @typedef {{}} ApiSpec
 * @property {String} slug - documentation section identifier used in the URL
 * @property {String} title - documentation section title
 * @property {String} version - API version
 * @property {String} description - general API description (markdown)
 * @property {{name: String, description: String}[]} tags - tags declared by the spec
 * @property {ApiOperation[]} operations - flat list of operations in the spec order
 */

/**
 * Dereference and normalize a raw OpenAPI document
 * @param {{}} spec - raw OpenAPI document
 * @param {{slug: String, title: String}} entry - corresponding documentation index entry
 * @return {ApiSpec}
 */
export default function parseApiSpec(spec, entry) {
    dereference(spec)
    return {
        slug: entry.slug,
        title: entry.title,
        version: spec.info?.version,
        description: spec.info?.description,
        tags: spec.tags || [],
        operations: listOperations(spec.paths)
    }
}

function listOperations(paths = {}) {
    const operations = []
    for (const [path, methods] of Object.entries(paths)) {
        for (const [method, operation] of Object.entries(methods || {})) {
            operations.push({
                path,
                method,
                operationId: operation.operationId,
                summary: operation.summary,
                description: operation.description,
                tag: operation.tags?.[0],
                parameters: operation.parameters || [],
                responses: operation.responses || {}
            })
        }
    }
    return operations
}

/**
 * Replace every $ref pointer in the document with the referenced node (in place)
 * @param {{}} spec - raw OpenAPI document
 */
function dereference(spec) {
    const resolved = new Map() //pointer -> resolved node
    const pending = new Set() //pointers currently being resolved (recursive schema detection)
    const visited = new WeakSet() //plain nodes already processed

    function pointerTarget(pointer) {
        if (!pointer.startsWith('#/'))
            return undefined
        let node = spec
        for (const part of pointer.slice(2).split('/')) {
            if (!node || typeof node !== 'object')
                return undefined
            node = node[part.replace(/~1/g, '/').replace(/~0/g, '~')]
        }
        return node
    }

    function resolveRef(pointer) {
        if (resolved.has(pointer))
            return resolved.get(pointer)
        const name = pointer.split('/').pop()
        if (pending.has(pointer)) //recursive schema - emit a stub to keep the resulting graph acyclic
            return {ref: name, type: 'object', recursive: true}
        const target = pointerTarget(pointer)
        if (!target || typeof target !== 'object') {
            console.warn('Unresolved OpenAPI reference: ' + pointer)
            return {}
        }
        pending.add(pointer)
        visited.add(target)
        //only schema component names are meaningful for the reader, parameter component keys are internal
        if (pointer.startsWith('#/components/schemas/')) {
            target.ref = name
        }
        for (const [key, value] of Object.entries(target)) {
            if (key !== 'ref') {
                target[key] = resolveNode(value)
            }
        }
        pending.delete(pointer)
        resolved.set(pointer, target)
        return target
    }

    function resolveNode(node) {
        if (!node || typeof node !== 'object')
            return node
        if (Array.isArray(node)) {
            node.forEach((value, i) => node[i] = resolveNode(value))
            return node
        }
        if (typeof node.$ref === 'string') {
            const target = resolveRef(node.$ref)
            const {$ref, ...siblings} = node
            if (!Object.keys(siblings).length)
                return target
            //sibling annotations take precedence over the referenced node (OpenAPI 3.1)
            return {...target, ...siblings, ref: target.ref}
        }
        if (visited.has(node))
            return node
        visited.add(node)
        for (const [key, value] of Object.entries(node)) {
            node[key] = resolveNode(value)
        }
        return node
    }

    resolveNode(spec.paths)
}
