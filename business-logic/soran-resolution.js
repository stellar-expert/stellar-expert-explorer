import {Account, Address, Contract, MuxedAccount, StrKey, TransactionBuilder, nativeToScVal, rpc} from '@stellar/stellar-sdk'
import {normalizeSoranName} from './soran-name.js'

export class SoranResolutionError extends Error {
    constructor(message, code) {
        super(message)
        this.name = 'SoranResolutionError'
        this.code = code
    }
}

function invalidResult() {
    throw new SoranResolutionError('Soran returned an unsupported or invalid destination.')
}

function readSymbol(value) {
    if (value?.type !== 'scvSymbol') invalidResult()
    return value.sym.toStringStrict()
}

function readVariant(value) {
    if (value?.type !== 'scvVec' || !value.vec?.length) invalidResult()
    const [tag, ...args] = value.vec
    return [readSymbol(tag), args]
}

function readStruct(value, fields) {
    if (value?.type !== 'scvMap' || value.map?.length !== fields.length) invalidResult()
    const result = {}
    for (let i = 0; i < fields.length; i++) {
        //Soroban struct keys are symbols in canonical order; reject duplicates and unknown fields.
        const entry = value.map[i]
        if (readSymbol(entry.key) !== fields[i]) invalidResult()
        result[fields[i]] = entry.val
    }
    return result
}

function readAddress(value, accountOnly = false) {
    if (value?.type !== 'scvAddress') invalidResult()
    const address = Address.fromScVal(value).toString()
    if (!StrKey.isValidEd25519PublicKey(address) && (accountOnly || !StrKey.isValidContract(address))) invalidResult()
    return address
}

function readId(value) {
    if (value?.type !== 'scvU64' || typeof value.u64 !== 'bigint' || value.u64 < 0n || value.u64 > 18446744073709551615n) {
        invalidResult()
    }
    return value.u64.toString()
}

function readMemo(value) {
    const [type, args] = readVariant(value)
    if (type === 'None' && !args.length) return null
    if (args.length !== 1) invalidResult()
    const [memo] = args
    switch (type) {
    case 'Id':
        return {type: 'id', value: readId(memo)}
    case 'Text':
        if (memo.type !== 'scvString' || memo.str.length < 1 || memo.str.length > 28) invalidResult()
        return {type: 'text', value: memo.str.toStringStrict()}
    case 'Hash': {
        if (memo.type !== 'scvBytes') invalidResult()
        const bytes = memo.bytes.toBytes()
        if (bytes.length !== 32) invalidResult()
        return {type: 'hash', value: Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')}
    }
    default:
        return invalidResult()
    }
}

//Decode the destination ABI at the XDR boundary, preserving memos and full muxed IDs.
export function decodeSoranDestination(value) {
    try {
        const [type, args] = readVariant(value)
        if (args.length !== 1) invalidResult()
        if (type === 'Direct') {
            const payment = readStruct(args[0], ['address', 'memo'])
            const address = readAddress(payment.address)
            const memo = readMemo(payment.memo)
            if (StrKey.isValidContract(address) && memo) invalidResult()
            return {address, memo}
        }
        if (type === 'Muxed') {
            const payment = readStruct(args[0], ['account', 'id'])
            const account = readAddress(payment.account, true)
            const id = readId(payment.id)
            return {address: new MuxedAccount(new Account(account, '0'), id).accountId(), memo: null}
        }
        return invalidResult()
    } catch (error) {
        if (error instanceof SoranResolutionError) throw error
        return invalidResult()
    }
}

function contractError(code) {
    if (code === 5) return new SoranResolutionError('Soran namespace not found.', code)
    if (code === 7) return new SoranResolutionError('This Soran name is unregistered or expired.', code)
    return new SoranResolutionError('Soran could not resolve this name. Please try again later.', code)
}

//Read only: no wallet, signature, transaction submission, Soran API, or Soran SDK.
export async function resolveSoranName(query, network, settings) {
    if (network !== 'testnet' || !settings?.soran) {
        throw new SoranResolutionError('Soran name resolution is available on testnet only.')
    }
    const name = normalizeSoranName(query)
    if (!name) throw new SoranResolutionError('Enter a Soran name with two valid labels, such as alice.nova.')

    const {lookupId, registryId, rpcUrl} = settings.soran
    const server = new rpc.Server(rpcUrl)
    //SDK 17 configures RPC request timeouts on its HTTP client, in milliseconds.
    server.httpClient.defaults.timeout = 15000
    const contract = new Contract(lookupId)
    async function read(method, args = []) {
        const transaction = new TransactionBuilder(
            new Account('GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF', '0'),
            {fee: '100', networkPassphrase: settings.passphrase}
        ).addOperation(contract.call(method, ...args)).setTimeout(30).build()
        const result = await server.simulateTransaction(transaction, undefined, undefined, false)
        if (rpc.Api.isSimulationRestore(result)) {
            throw new SoranResolutionError('Soran contract state needs restoration. Please try again after it has been restored.')
        }
        if (rpc.Api.isSimulationError(result)) {
            //Only classify the top-level contract error, never an error mentioned in a dependency's trace.
            const match = /^HostError: Error\(Contract, #(\d+)\)/.exec(result.error)
            throw contractError(method === 'resolve_destination' && match ? Number(match[1]) : undefined)
        }
        if (!rpc.Api.isSimulationSuccess(result) || !result.result?.retval) {
            throw new SoranResolutionError('Soran resolution is unavailable. Please try again later.')
        }
        const value = result.result.retval
        if (value.type === 'scvError' && value.error.type === 'sceContract') {
            throw contractError(method === 'resolve_destination' ? value.error.contractCode : undefined)
        }
        return value
    }

    try {
        const checks = await Promise.allSettled([read('registry'), read('version'), read('destination_version')])
        for (const check of checks) {
            if (check.status === 'rejected') throw check.reason
        }
        const [registry, version, destinationVersion] = checks.map(check => check.value)
        if (readAddress(registry) !== registryId || version.type !== 'scvU32' || version.u32 !== 2 ||
            destinationVersion.type !== 'scvU32' || destinationVersion.u32 !== 2) {
            throw new SoranResolutionError('The Soran deployment is incompatible with this explorer.')
        }
        const destination = await read('resolve_destination', [nativeToScVal(name, {type: 'string'})])
        return {name, ...decodeSoranDestination(destination)}
    } catch (error) {
        if (error instanceof SoranResolutionError) throw error
        throw new SoranResolutionError('Soran resolution is unavailable. Please try again later.')
    }
}
