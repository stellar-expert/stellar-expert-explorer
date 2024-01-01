import {CodeBlock} from '@stellar-expert/ui-framework'
import {parseContractMetadata} from '@stellar-expert/contract-wasm-interface-parser'
import {generateContractSourceLink, useContractSource} from '../../../business-logic/api/contract-api'

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
        for (const fn of meta.functions) {
            res += `fn ${fn.name}(${fn.inputs.map(input => input.name + ': ' + input.type).join(', ')})`
            if (fn.outputs?.length) {
                res += ' -> ' + (fn.outputs.length > 1 ? `(${fn.outputs.join(', ')})` : fn.outputs[0])
            }
            res += '\n\n'
        }
    }

    if (meta.enums) {
        res += '// ENUMS\n\n'
        for (const e of meta.enums) {
            res += `#[contracttype]
enum ${e.name} {
    ${e.cases.map(c => c.name + ' = ' + c.value).join(',\n    ')}
}\n\n`
        }
    }

    if (meta.structs) {
        res += '// STRUCTS\n\n'
        for (const s of meta.structs) {
            res += `#[contracttype]
struct ${s.name} {
    ${s.fields.map(field => field.name + ': ' + field.type).join(',\n    ')}
}\n\n`
        }
    }

    if (meta.unions) {
        res += '// UNIONS\n\n'
        for (const u of meta.unions) {
            res += `#[contracttype]
enum ${u.name} {
    ${Object.entries(u.cases).map(([name, value]) => `${name}(${value === 'void' ? '' : value.join(', ')})`).join(',\n    ')}
}\n\n`
        }
    }

    if (meta.errors) {
        res += '// ERRORS\n\n'
        for (const e of meta.errors) {
            res += `#[contracterror]
enum ${e.name} {
    ${e.cases.map(field => field.name + ' = ' + field.value).join(',\n    ')}
}\n\n`
        }
    }
    return res
}