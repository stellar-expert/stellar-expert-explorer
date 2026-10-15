import {readFileSync} from 'node:fs'
import {createRequire} from 'node:module'
import {fileURLToPath} from 'node:url'
import {transformSync} from '@babel/core'

//Use the application's Babel configuration for JSX; replace browser services at module boundaries.
export function loadUiModule(relativePath, replacements = {}) {
    const filename = fileURLToPath(new URL(relativePath, import.meta.url))
    const require = createRequire(filename)
    const module = {exports: {}}
    const {code} = transformSync(readFileSync(filename, 'utf8'), {filename})
    const evaluate = new Function('require', 'module', 'exports', code)
    evaluate(specifier => Object.hasOwn(replacements, specifier) ? replacements[specifier] : require(specifier), module, module.exports)
    return module.exports
}
