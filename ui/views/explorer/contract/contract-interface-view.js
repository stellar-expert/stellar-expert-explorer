import {CodeBlock, generateContractSourceLink, useContractSource} from '@stellar-expert/ui-framework'
import {parseContractMetadata} from '@stellar-expert/contract-wasm-interface-parser'
//import SACInterface from './sac-interface.txt'

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

function parseRustInterface(meta) {
    let res = `// RUST version: ${meta.rustVersion}\n// SDK version: ${meta.sdkVersion}\n\n`
    if (meta.functions) {
        res += '// FUNCTIONS\n\n'
        for (const [name, fn] of Object.entries(meta.functions)) {
            res += Object.entries(fn.inputs).map(([name, input]) => insertDocs(input, 0, name + ': ')).filter(v => !!v).join('\n')
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
            res += insertDocs(e) + `#[contracttype]\nenum ${name} {
${Object.entries(e.cases).map(([name, props]) => insertDocs(props, 1) + indent(name, 1) + ' = ' + props.value.toString()).join(',\n')}
}\n\n`
        }
    }

    if (meta.structs) {
        res += '// STRUCTS\n\n'
        for (const [name, s] of Object.entries(meta.structs)) {
            res += insertDocs(s) + `#[contracttype]\nstruct ${name} {
${Object.entries(s.fields).map(([name, field]) => insertDocs(field, 1) + indent(name, 1) + ': ' + field.type).join(',\n')}
}\n\n`
        }
    }

    if (meta.unions) {
        res += '// UNIONS\n\n'
        for (const [name, u] of Object.entries(meta.unions)) {
            res += insertDocs(u) + `#[contracttype]\nenum ${name} {
${Object.entries(u.cases).map(([name, value]) => insertDocs(value, 1) + `${indent(name, 1)}(${value === 'void' ? '' : value.join(', ')})`).join(',\n')}
}\n\n`
        }
    }

    if (meta.errors) {
        res += '// ERRORS\n\n'
        res += `#[contracterror]\nenum Errors {
${Object.entries(meta.errors).map(([name, props]) => insertDocs(props, 1) + indent(name, 1) + ' = ' + props.value).join(',\n')}
}\n\n`
    }
    return res
}

function insertDocs(props, level = 0, prefix = '') {
    if (!props.doc)
        return ''
    let res = '/// ' + prefix + props.doc.replaceAll('\n', '\n' + indent('/// ', level)) + '\n'
    return indent(res, level)
}

function indent(value, level) {
    if (!level)
        return value
    return '  '.repeat(level) + value
}