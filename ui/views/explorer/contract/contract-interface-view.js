import {CodeBlock, generateContractSourceLink, useContractSource} from '@stellar-expert/ui-framework'
import {parseContractMetadata} from '@stellar-expert/contract-wasm-interface-parser'

export function ContractInterfaceView({hash}) {
    const source = useContractSource(hash)
    if (!source)
        return <div className="segment blank">
            <div className="loader large"/>
        </div>
    const meta = parseContractMetadata(Buffer.from(source))
    //download wasm code from API
    return <div className="segment blank">
        <CodeBlock lang="rust">{parseRustInterface(meta)}</CodeBlock>
        <div className="space text-small text-right">
            <a href={generateContractSourceLink(hash)} target="_blank" className="external-link">
                <i className="icon-download-circle"/>Download contract WASM code
            </a>
        </div>
    </div>
}

const indent = '    '

function parseRustInterface(meta) {
    let res = `// RUST version: ${meta.rustVersion}\n// SDK version: ${meta.sdkVersion}\n\n`
    if (meta.functions) {
        res += '// FUNCTIONS\n\n'
        for (const [name, fn] of Object.entries(meta.functions)) {
            res += Object.entries(fn.inputs).map(([name, input]) => insertDocs(input, 0, name + ': ')).join('\n')
            res += insertDocs(fn) + `fn ${name}(${Object.entries(fn.inputs).map(([name, props]) => name + ': ' + props.type).join(', ')})`
            if (fn.outputs?.length) {
                res += ' -> ' + (fn.outputs.length > 1 ? `(${fn.outputs.join(', ')})` : fn.outputs[0])
            }
            res += '\n\n'
        }
    }

    if (meta.enums) {
        res += '// ENUMS\n\n'
        for (const [name, e] of Object.entries(meta.enums)) {
            res += '#[contracttype]\n' + insertDocs(e) + `enum ${name} {
    ${Object.entries(e.cases).map(([name, props]) => insertDocs(props, 1) + indent + name + ' = ' + props.value.toString()).join(',\n' + indent)}
}\n\n`
        }
    }

    if (meta.structs) {
        res += '// STRUCTS\n\n'
        for (const [name, s] of Object.entries(meta.structs)) {
            res += '#[contracttype]\n' + insertDocs(s) + `struct ${name} {
    ${Object.entries(s.fields).map(([name, field]) => insertDocs(field, 1) + name + ': ' + field.type).join(',\n' + indent)}
}\n\n`
        }
    }

    if (meta.unions) {
        res += '// UNIONS\n\n'
        for (const [name, u] of Object.entries(meta.unions)) {
            res += '#[contracttype]\n' + insertDocs(u) + `enum ${name} {
    ${Object.entries(u.cases).map(([name, value]) => insertDocs(value, 1) + `${name}(${value === 'void' ? '' : value.join(', ')})`).join(',\n' + indent)}
}\n\n`
        }
    }

    if (meta.errors) {
        res += '// ERRORS\n\n'
        for (const [name, e] of Object.entries(meta.errors)) {
            res += '#[contracttype]\n' + insertDocs(e) + `enum ${name} {
    ${Object.entries(e.cases).map(([name, props]) => insertDocs(props, 1) + name + ' = ' + props.value).join(',\n' + indent)}
}\n\n`
        }
    }
    return res
}

function insertDocs(props, indentLevel = 0, prefix = '') {
    if (!props.doc)
        return ''
    let res = '/// ' + prefix + props.doc + '\n'
    if (indentLevel > 0) {
        for (let i = 0; i < indentLevel; i++) {
            res = indent + res
        }
    }
    return res
}