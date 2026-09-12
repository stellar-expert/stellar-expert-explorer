import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {test} from 'node:test'
import {Address, MuxedAccount, Networks, rpc, xdr} from '@stellar/stellar-sdk'
import {normalizeSoranName} from '../business-logic/soran-name.js'
import {decodeSoranDestination, resolveSoranName, SoranResolutionError} from '../business-logic/soran-resolution.js'

const fixtures = JSON.parse(readFileSync(new URL('./fixtures/soran-destinations.json', import.meta.url)))
const settings = {
    passphrase: Networks.TESTNET,
    soran: {
        rpcUrl: 'https://soroban-testnet.stellar.org',
        lookupId: 'CDSORANQAJK35UV2HR63CMB6M5NYISHMUBTB6EQY2CZ3Y7HJDIOHRJWA',
        registryId: 'CCSORANDPQINYOYB5SVO45WJP2LBBYKC72HHUIRVXB4J6RUZKDAUW7G4'
    }
}
const sample = xdr.ScVal.fromXdr(fixtures.valid.find(fixture => fixture.id === 'direct-g-text').xdrBase64, 'base64')

test('normalize names without Unicode folding or changing label boundaries', () => {
    for (const [input, expected] of [
        [' Alice.Nova ', 'alice.nova'], ['A-1.NOVA', 'a-1.nova'], ['a.b', 'a.b'],
        ['a'.repeat(63) + '.' + 'b'.repeat(63), 'a'.repeat(63) + '.' + 'b'.repeat(63)]
    ]) assert.equal(normalizeSoranName(input), expected)
    for (const invalid of [
        '', null, 42, 'alice', '.nova', 'alice.', '-alice.nova', 'alice-.nova', 'alice.-nova',
        'alice.nova-', 'alice..nova', 'alice.sub.nova', 'al ice.nova', 'alice_nova', 'alice_.nova',
        'alice.nova\nextra', 'alice.nova.', 'https://alice.nova', 'alice.nova/path', 'álîce.nova',
        'Kate.nova', 'Ａlice.nova', 'alice。nova', 'a'.repeat(64) + '.nova', 'alice.' + 'a'.repeat(64)
    ]) assert.equal(normalizeSoranName(invalid), null, String(invalid))
})

for (const fixture of fixtures.valid) {
    test(`decode published XDR: ${fixture.id}`, () => {
        const actual = decodeSoranDestination(xdr.ScVal.fromXdr(fixture.xdrBase64, 'base64'))
        const [type, expected] = fixture.expectedNative
        if (type === 'Muxed') {
            const muxed = MuxedAccount.fromAddress(actual.address, '0')
            assert.equal(muxed.baseAccount().accountId(), expected.account)
            assert.equal(muxed.id(), expected.id.$bigint)
            assert.equal(actual.memo, null)
        } else {
            assert.equal(actual.address, expected.address)
            const [memoType, memoValue] = expected.memo
            assert.deepEqual(actual.memo, memoType === 'None' ? null : {
                type: memoType.toLowerCase(),
                value: memoValue?.$bigint ?? memoValue?.$bytes ?? memoValue
            })
        }
    })
}

for (const fixture of fixtures.invalid) {
    test(`reject published XDR: ${fixture.id}`, () => {
        assert.throws(() => decodeSoranDestination(xdr.ScVal.fromXdr(fixture.xdrBase64, 'base64')))
    })
}

function success(retval) {
    return {transactionData: {}, result: {retval}, latestLedger: 123}
}

function mockRpc(t, overrides = {}) {
    const calls = []
    t.mock.method(rpc.Server.prototype, 'simulateTransaction', (transaction, resources, authMode, upgradedAuth) => {
        const operation = transaction.operations[0]
        assert.equal(transaction.operations.length, 1)
        assert.equal(transaction.signatures.length, 0)
        assert.equal(transaction.networkPassphrase, Networks.TESTNET)
        assert.equal(upgradedAuth, false)
        const invocation = operation.func.invokeContract
        assert.equal(Address.fromScAddress(invocation.contractAddress).toString(), settings.soran.lookupId)
        const method = invocation.functionName.toStringStrict()
        calls.push({method, args: invocation.args})
        if (method in overrides) return overrides[method](invocation.args)
        if (method === 'registry') return success(new Address(settings.soran.registryId).toScVal())
        if (['version', 'destination_version'].includes(method)) return success(xdr.ScVal.scvU32(2))
        assert.equal(method, 'resolve_destination')
        return success(sample)
    })
    t.mock.method(rpc.Server.prototype, 'sendTransaction', () => assert.fail('Reads must never submit transactions'))
    return calls
}

test('resolve a canonical name only after validating deployment and ABI', async t => {
    const calls = mockRpc(t)
    const result = await resolveSoranName(' Alice.Nova ', 'testnet', settings)
    assert.deepEqual(result, {name: 'alice.nova', ...decodeSoranDestination(sample)})
    assert.deepEqual(calls.map(call => call.method), ['registry', 'version', 'destination_version', 'resolve_destination'])
    assert.equal(calls[3].args.length, 1)
    assert.equal(calls[3].args[0].type, 'scvString')
    assert.equal(calls[3].args[0].str.toStringStrict(), 'alice.nova')
})

test('public/unknown networks, missing configuration, and invalid input make no RPC calls', async t => {
    const calls = mockRpc(t)
    for (const network of ['public', 'futurenet', undefined]) {
        await assert.rejects(resolveSoranName('alice.nova', network, settings), /testnet only/)
    }
    await assert.rejects(resolveSoranName('alice.nova', 'testnet', {}), /testnet only/)
    await assert.rejects(resolveSoranName('alice.sub.nova', 'testnet', settings), /two valid labels/)
    assert.equal(calls.length, 0)
})

for (const [method, value] of [
    ['registry', new Address(settings.soran.lookupId).toScVal()],
    ['registry', xdr.ScVal.scvString(settings.soran.registryId)],
    ['version', xdr.ScVal.scvU32(3)],
    ['version', xdr.ScVal.scvI32(2)],
    ['destination_version', xdr.ScVal.scvU32(1)]
]) {
    test(`reject incompatible ${method} (${value.type}) before resolving`, async t => {
        const calls = mockRpc(t, {[method]: () => success(value)})
        await assert.rejects(resolveSoranName('alice.nova', 'testnet', settings), SoranResolutionError)
        assert.equal(calls.some(call => call.method === 'resolve_destination'), false)
    })
}

test('reject restoration even when the simulation also reports success', async t => {
    mockRpc(t, {resolve_destination: () => ({...success(sample), restorePreamble: {transactionData: {}}})})
    await assert.rejects(resolveSoranName('alice.nova', 'testnet', settings), /needs restoration/)
})

test('capability failures cannot be mistaken for an absent namespace', async t => {
    mockRpc(t, {registry: () => ({error: 'HostError: Error(Contract, #5)'})})
    await assert.rejects(resolveSoranName('alice.nova', 'testnet', settings), error => error.code === undefined)
})

for (const code of [5, 7, 9, 10, 11, 12, 22, 999]) {
    test(`preserve contract error ${code} without address or legacy fallback`, async t => {
        const calls = mockRpc(t, {resolve_destination: () => ({error: `HostError: Error(Contract, #${code})\nEvent log ...`})})
        await assert.rejects(resolveSoranName('alice.nova', 'testnet', settings), error => error.code === code)
        assert.equal(calls.length, 4)
    })
}

test('do not misclassify contract errors inside a host failure trace', async t => {
    mockRpc(t, {resolve_destination: () => ({error: 'HostError: Error(Budget, ExceededLimit)\nError(Contract, #5)'})})
    await assert.rejects(resolveSoranName('alice.nova', 'testnet', settings), error => error.code === undefined)
})

test('preserve typed contract errors returned as ScVal', async t => {
    mockRpc(t, {resolve_destination: () => success(xdr.ScVal.scvError(xdr.ScError.sceContract(7)))})
    await assert.rejects(resolveSoranName('alice.nova', 'testnet', settings), error => error.code === 7)
})

for (const [label, result] of [['empty response', {}], ['missing return value', {transactionData: {}}]]) {
    test(`reject ${label}`, async t => {
        mockRpc(t, {resolve_destination: () => result})
        await assert.rejects(resolveSoranName('alice.nova', 'testnet', settings), /unavailable/)
    })
}

test('report transport failures as unavailable and allow a subsequent retry', async t => {
    let failed = false
    const calls = mockRpc(t, {resolve_destination: () => {
        if (!failed) {
            failed = true
            throw new Error('network timeout')
        }
        return success(sample)
    }})
    await assert.rejects(resolveSoranName('alice.nova', 'testnet', settings), /unavailable/)
    assert.equal((await resolveSoranName('alice.nova', 'testnet', settings)).name, 'alice.nova')
    assert.equal(calls.length, 8)
})
