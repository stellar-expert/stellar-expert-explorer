/*eslint require-await: off*/
//Async act callbacks let React flush pending effects and resolution promises.
import assert from 'node:assert/strict'
import {beforeEach, test} from 'node:test'
import React, {useEffect} from 'react'
import TestRenderer from 'react-test-renderer'
import * as stellarSdk from '@stellar/stellar-sdk'
import {SoranResolutionError} from '../business-logic/soran-resolution.js'
import {loadUiModule} from './load-ui-module.mjs'

const {act, create} = TestRenderer
const genericIds = loadUiModule('../node_modules/@stellar-expert/ui-framework/stellar/ledger-generic-id.js')
const stateHooks = loadUiModule('../node_modules/@stellar-expert/ui-framework/state/state-hooks.js')
const {detectSearchType} = loadUiModule('../business-logic/search.js', {'@stellar-expert/ui-framework': genericIds})
const G = 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF'
const C = 'CDSORANQAJK35UV2HR63CMB6M5NYISHMUBTB6EQY2CZ3Y7HJDIOHRJWA'
const M = 'MDHHA2WBSH4ZKIAWALPY4KVOC57ZUT6W6HWS3JBUQ4KFJRT6US4MWAAAAAAAAAAAFKV2W'

beforeEach(t => {
    t.mock.method(globalThis, 'fetch', () => assert.fail('Unit tests must not access the network'))
})

test('detect Soran only on testnet and retain existing search types', () => {
    for (const name of ['alice.nova', ' Alice.NOVA ', 'mux.orange', 'user.future']) {
        assert.deepEqual(detectSearchType(name, 'testnet'), ['soran'])
        assert.deepEqual(detectSearchType(name, 'public'), ['account', 'asset'])
        assert.deepEqual(detectSearchType(name), ['account', 'asset'])
    }
    for (const network of ['testnet', 'public']) {
        for (const [query, expected] of [
            ['alice.xlm', ['sorobandomains']], ['alice*example.org', ['federation']],
            [G, ['account', 'asset']], [C, ['contract', 'asset']], [M, ['account']],
            ['XLM', ['asset']], ['USD', ['account', 'asset']], ['a'.repeat(64), ['transaction']],
            ['4651470', ['ledger', 'offer', 'account', 'asset']], ['alice.sub.nova', ['account', 'asset']]
        ]) assert.deepEqual(detectSearchType(query, network), expected)
    }
})

function setup(t, resolve, term = 'alice.nova') {
    let network = 'testnet'
    const resolutions = []
    const standardSearches = []
    const navigations = []
    const navigation = {query: {term}, navigate: path => navigations.push(path)}
    const framework = {...stateHooks, navigation, usePageMetadata: () => {}}
    const appSettings = {get activeNetwork() {
        return network
    }, networks: {testnet: {}, public: {}}}
    const path = {resolvePath: relative => `/explorer/${network}/${relative}`}
    const SoranResult = loadUiModule('../views/explorer/search/soran-search-result-view.js', {'../../../business-logic/path': path}).default
    const replacements = {
        '@stellar/stellar-sdk': stellarSdk,
        '@stellar-expert/ui-framework': framework,
        '../../../app-settings': appSettings,
        '../../../business-logic/search': {detectSearchType},
        '../../../business-logic/path': path,
        '../../../business-logic/soran-resolution': {
            SoranResolutionError,
            resolveSoranName: (...args) => {
                resolutions.push(args)
                return resolve(...args)
            }
        },
        './soran-search-result-view': SoranResult,
        '../../components/error-notification-block': ({children}) => React.createElement('div', {role: 'alert'}, children),
        './search.scss': {}
    }
    for (const type of ['assets', 'account', 'ledger', 'operation', 'transaction', 'offer', 'contract']) {
        replacements[`./${type}-search-results-view`] = function Result({term: query, onLoaded}) {
            useEffect(() => {
                standardSearches.push({type, query})
                onLoaded(null)
            }, [query, onLoaded])
            return null
        }
    }
    const View = loadUiModule('../views/explorer/search/search-results-view.js', replacements).default
    let renderer
    t.after(() => act(() => renderer?.unmount()))
    t.mock.method(console, 'error', () => {})
    return {
        resolutions, standardSearches, navigations,
        async show(nextTerm = term, nextNetwork = network) {
            navigation.query.term = nextTerm
            network = nextNetwork
            await act(async () => {
                if (renderer) renderer.update(React.createElement(View))
                else renderer = create(React.createElement(View))
            })
        },
        get renderer() {
            return renderer
        }
    }
}

function renderedText(renderer) {
    function flatten(node) {
        if (typeof node === 'string') return node
        if (Array.isArray(node)) return node.map(flatten).join('')
        return node?.children ? flatten(node.children) : ''
    }
    return flatten(renderer.toJSON())
}

for (const [label, address, memo, destinationType] of [
    ['G with memo', G, {type: 'text', value: ' hello '}, 'account'],
    ['C contract', C, null, 'contract'],
    ['full M address', M, null, 'account']
]) {
    test(`show ${label} and link to its testnet page without automatic navigation`, async t => {
        const ui = setup(t, () => Promise.resolve({name: 'alice.nova', address, memo}), ' Alice.NOVA ')
        await ui.show()
        assert.match(renderedText(ui.renderer), /Soran name: alice.nova/)
        assert.match(renderedText(ui.renderer), new RegExp(address))
        const links = ui.renderer.root.findAllByType('a')
        assert(links.every(link => link.props.href === `/explorer/testnet/${destinationType}/${address}`))
        assert.equal(ui.navigations.length, 0)
        assert.equal(ui.standardSearches.length, 0)
        if (memo) assert.equal(ui.renderer.root.findByType('code').children.join(''), ' hello ')
    })
}

test('an absent namespace falls back to ordinary dotted asset/account search', async t => {
    const ui = setup(t, () => Promise.reject(new SoranResolutionError('missing namespace', 5)), 'USD.token')
    await ui.show()
    assert.deepEqual(ui.standardSearches, [{type: 'account', query: 'USD.token'}, {type: 'assets', query: 'USD.token'}])
    assert.equal(ui.renderer.root.findAllByProps({role: 'alert'}).length, 0)
})

for (const code of [7, 10, undefined]) {
    test(`resolution error ${code} stays visible instead of becoming a search miss`, async t => {
        const ui = setup(t, () => Promise.reject(new SoranResolutionError('Resolution unavailable', code)))
        await ui.show()
        assert.equal(ui.renderer.root.findByProps({role: 'alert'}).children.join(''), 'Resolution unavailable')
        assert.equal(ui.standardSearches.length, 0)
    })
}

test('late resolution cannot replace a newer search', async t => {
    let finishFirst
    const ui = setup(t, query => query === 'alice.nova' ? new Promise(resolve => {
        finishFirst = resolve
    }) :
        Promise.resolve({name: query, address: C, memo: null}))
    await ui.show()
    await ui.show('cyclops.nova')
    await act(async () => finishFirst({name: 'alice.nova', address: G, memo: null}))
    assert.match(renderedText(ui.renderer), /Soran name: cyclops.nova/)
    assert.doesNotMatch(renderedText(ui.renderer), /alice.nova/)
})

test('retry a failed Soran read without changing the name or reloading the page', async t => {
    let attempts = 0
    const ui = setup(t, () => ++attempts === 1
        ? Promise.reject(new SoranResolutionError('Soran resolution is unavailable. Please try again later.'))
        : Promise.resolve({name: 'alice.nova', address: G, memo: {type: 'text', value: 'hello'}}))
    await ui.show()
    assert.equal(ui.renderer.root.findAllByProps({role: 'alert'}).length, 1)
    await act(async () => ui.renderer.root.findByType('button').props.onClick())
    assert.equal(attempts, 2)
    assert.equal(ui.renderer.root.findAllByProps({role: 'alert'}).length, 0)
    assert.match(renderedText(ui.renderer), /Soran name: alice.nova/)
    assert.equal(ui.renderer.root.findByType('code').children.join(''), 'hello')
    assert.equal(ui.standardSearches.length, 0)
    assert.equal(ui.navigations.length, 0)
})

test('changing to public discards pending testnet reads and makes no new Soran request', async t => {
    let finish
    const ui = setup(t, () => new Promise(resolve => {
        finish = resolve
    }))
    await ui.show()
    await ui.show('alice.nova', 'public')
    await act(async () => finish({name: 'alice.nova', address: G, memo: null}))
    assert.equal(ui.resolutions.length, 1)
    assert.doesNotMatch(renderedText(ui.renderer), /Soran name:/)
    assert.equal(ui.standardSearches.length, 2)
    assert.equal(ui.navigations.length, 0)
})

for (const network of ['testnet', 'public']) {
    test(`existing federation resolution still searches its account on ${network}`, async t => {
        const federation = t.mock.method(stellarSdk.Federation.Server, 'resolve', () => Promise.resolve({account_id: G}))
        const ui = setup(t, () => assert.fail('Federation must not call Soran'), 'alice*example.org')
        await ui.show('alice*example.org', network)
        assert.equal(federation.mock.callCount(), 1)
        assert.equal(ui.resolutions.length, 0)
        assert.deepEqual(ui.standardSearches, [{type: 'account', query: G}, {type: 'assets', query: G}])
    })

    test(`existing .xlm resolution still searches its account on ${network}`, async t => {
        const fetch = t.mock.method(globalThis, 'fetch', () => Promise.resolve({json: () => Promise.resolve({address: G})}))
        const ui = setup(t, () => assert.fail('.xlm must not call Soran'), 'alice.xlm')
        await ui.show('alice.xlm', network)
        assert.equal(fetch.mock.callCount(), 1)
        assert.equal(ui.resolutions.length, 0)
        assert.deepEqual(ui.standardSearches, [{type: 'account', query: G}, {type: 'assets', query: G}])
    })
}
