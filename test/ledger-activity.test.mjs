/*eslint require-await: off*/
//Async act callbacks flush the component's loading promises and effects.
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {test} from 'node:test'
import React from 'react'
import TestRenderer from 'react-test-renderer'
import {loadUiModule} from './load-ui-module.mjs'

const {act, create} = TestRenderer
const fixture = JSON.parse(readFileSync(new URL('./fixtures/ledger.json', import.meta.url)))
const {retrieveLedgerInfo} = loadUiModule('../node_modules/@stellar-expert/ui-framework/ledger/ledger-info-parser.js')
const {parseLedgerResponse} = loadUiModule('../business-logic/ledger-info.js', {
    '@stellar-expert/ui-framework': {retrieveLedgerInfo}
})

test('valid API ledger data is decoded with the actual SDK parser', () => {
    const ledger = parseLedgerResponse(fixture)
    assert.equal(ledger.sequence, fixture.sequence)
    assert.equal(ledger.operations, fixture.successful_operations)
    assert.equal(ledger.baseFee, 100)
    assert.equal(ledger.baseReserve, 5000000)
})

test('API errors and missing headers never reach the XDR decoder', () => {
    const parser = loadUiModule('../business-logic/ledger-info.js', {
        '@stellar-expert/ui-framework': {retrieveLedgerInfo: () => assert.fail('Invalid data reached XDR decoding')}
    })
    for (const data of [undefined, null, {}, {error: 'Failed to fetch', status: 500}, {status: 403},
        {...fixture, error: 'Unavailable'}, {...fixture, xdr: ''}, {...fixture, xdr: 123}]) {
        assert.throws(() => parser.parseLedgerResponse(data), /unavailable/)
    }
})

function setup(t, {loadLast = () => Promise.resolve(fixture), loadLedger = () => Promise.resolve(fixture)} = {}) {
    const listeners = new Set()
    const stream = {
        getLast: t.mock.fn(loadLast),
        on: listener => listeners.add(listener),
        off: listener => listeners.delete(listener)
    }
    const View = loadUiModule('../views/explorer/ledger/ledger-activity-view.js', {
        '@stellar-expert/ui-framework': {
            ledgerStream: stream,
            useStellarNetwork: () => 'testnet',
            Amount: ({amount}) => React.createElement('span', null, String(amount)),
            UpdateHighlighter: ({children}) => children
        },
        '../../../models/api': {apiCall: loadLedger},
        '../../../business-logic/path': {resolvePath: path => `/explorer/testnet/${path}`},
        '../../../business-logic/ledger-info': {parseLedgerResponse},
        '../widget/embed-widget-trigger': () => null
    }).default
    let renderer
    t.after(() => act(() => renderer?.unmount()))
    return {
        stream, listeners,
        get renderer() {
            return renderer
        },
        async mount() {
            await act(async () => {
                renderer = create(React.createElement(View))
            })
        },
        async emit(sequence) {
            await act(async () => {
                await Promise.all(Array.from(listeners, listener => listener(sequence)))
            })
        }
    }
}

for (const [description, data] of [
    ['an API error object', {error: 'Failed to fetch', status: 500}],
    ['a missing header', {sequence: 1}],
    ['malformed XDR', {...fixture, xdr: 'not-an-xdr-header'}]
]) {
    test(`initial loading handles ${description} without an unhandled rejection`, async t => {
        const ui = setup(t, {loadLast: () => Promise.resolve(data)})
        await ui.mount()
        assert.equal(ui.renderer.root.findAllByProps({role: 'alert'}).length, 1)
        assert.equal(ui.renderer.root.findByType('button').children.join(''), 'Retry')
        assert.equal(ui.listeners.size, 1)
    })
}

test('a rejected initial request can be retried successfully', async t => {
    let attempts = 0
    const ui = setup(t, {loadLast: () => ++attempts === 1 ? Promise.reject(new Error('Connection failed')) : Promise.resolve(fixture)})
    await ui.mount()
    await act(async () => ui.renderer.root.findByType('button').props.onClick())
    assert.equal(ui.renderer.root.findAllByProps({role: 'alert'}).length, 0)
    assert.equal(ui.stream.getLast.mock.callCount(), 2)
    assert.equal(ui.listeners.size, 1)
    assert(ui.renderer.root.findAllByType('a').some(link => link.props.href.endsWith(`/ledger/${fixture.sequence}`)))
})

test('a valid stream update recovers from an initial API failure', async t => {
    const ui = setup(t, {loadLast: () => Promise.resolve({error: 'Unavailable'})})
    await ui.mount()
    await ui.emit(fixture.sequence)
    assert.equal(ui.renderer.root.findAllByProps({role: 'alert'}).length, 0)
})

test('a rejected update is handled and a later update recovers', async t => {
    let updates = 0
    const ui = setup(t, {loadLedger: () => ++updates === 1 ? Promise.reject(new Error('Timeout')) :
        Promise.resolve({...fixture, sequence: fixture.sequence + 1, ts: fixture.ts + 5})})
    await ui.mount()
    await ui.emit(fixture.sequence + 1)
    assert.equal(ui.renderer.root.findAllByProps({role: 'alert'}).length, 1)
    await ui.emit(fixture.sequence + 1)
    assert.equal(ui.renderer.root.findAllByProps({role: 'alert'}).length, 0)
})

test('a late initial response does not overwrite a newer streamed ledger', async t => {
    let finish
    const newer = {...fixture, sequence: fixture.sequence + 1, ts: fixture.ts + 5}
    const ui = setup(t, {loadLast: () => new Promise(resolve => {
        finish = resolve
    }), loadLedger: () => Promise.resolve(newer)})
    await ui.mount()
    await ui.emit(newer.sequence)
    await act(async () => finish(fixture))
    assert(ui.renderer.root.findAllByType('a').some(link => link.props.href.endsWith(`/ledger/${newer.sequence}`)))
})

test('unmount during loading removes the listener and ignores the late result', async t => {
    let finish
    const ui = setup(t, {loadLast: () => new Promise(resolve => {
        finish = resolve
    })})
    await ui.mount()
    act(() => ui.renderer.unmount())
    assert.equal(ui.listeners.size, 0)
    await act(async () => finish(fixture))
    assert.equal(ui.listeners.size, 0)
})

for (const response of [
    {loaded: true, data: null, error: 'Unavailable'},
    {loaded: true, data: {sequence: 1}},
    {loaded: true, data: {...fixture, xdr: 'invalid'}}
]) {
    test(`ledger details handle invalid response ${JSON.stringify(response).slice(0, 65)}`, async t => {
        const View = loadUiModule('../views/explorer/ledger/ledger-view.js', {
            '@stellar-expert/ui-framework': {useExplorerApi: () => response, usePageMetadata: () => {}},
            '../../../app-settings': {activeNetwork: 'testnet'},
            '../../../business-logic/path': {},
            '../../../business-logic/ledger-info': {parseLedgerResponse},
            '../../components/error-notification-block': ({children}) => React.createElement('div', {role: 'alert'}, children),
            '../../components/crawler-screen': () => null,
            '../horizon-tracer/tracer-icon-view': () => null,
            './ledger-transactions-view': () => null
        }).default
        let renderer
        t.after(() => act(() => renderer?.unmount()))
        await act(async () => {
            renderer = create(React.createElement(View, {match: {params: {sequence: '1'}}}))
        })
        assert.match(renderer.root.findByProps({role: 'alert'}).children.join(''), /Failed to load ledger 1/)
    })
}
