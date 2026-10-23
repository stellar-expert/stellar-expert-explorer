import {initializePaddle as loadPaddle} from '@paddle/paddle-js'
import {apiRequest} from './billing-api'

/**
 * Paddle.js, set up once per page for the environment the billing server works against. Paddle.js accepts
 * one initialization only, so its events reach the pages through a listener set rather than through
 * per-checkout callbacks
 */

/**
 * @type {Set<Function>}
 * @private
 */
const listeners = new Set()

/**
 * @type {Promise<Paddle>|null}
 * @private
 */
let initialization = null

/**
 * Load and initialize Paddle.js
 * @return {Promise<Paddle>} - the same instance for every caller
 */
export function initializePaddle() {
    if (!initialization) {
        initialization = apiRequest('plans', {auth: false})
            .catch(e => {
                throw new Error('Failed to load the payment form. ' + e.message)
            })
            .then(({paddle}) => {
                if (!paddle?.clientToken)
                    throw new Error('Online payments are not available at the moment.')
                return loadPaddle({environment: paddle.environment, token: paddle.clientToken, eventCallback: dispatch})
            })
            .then(paddle => {
                if (!paddle)
                    throw new Error('Failed to load the payment form.')
                return paddle
            })
            .catch(e => {
                //a server hiccup should not rule out the next attempt (a script that failed to load stays failed
                //inside Paddle's loader until the page reloads)
                initialization = null
                throw e
            })
    }
    return initialization
}

/**
 * Receive Paddle.js events
 * @param {Function} listener - called with every `{name, data}` event Paddle.js emits
 * @return {Function} - removes the listener
 */
export function subscribePaddleEvents(listener) {
    listeners.add(listener)
    return () => listeners.delete(listener)
}

/**
 * Open Paddle's overlay checkout for a transaction the server prepared
 * @param {String} transactionId
 * @return {Promise<Boolean>} - true once the transaction completes, false when the overlay is closed without it
 */
export async function openOverlayCheckout(transactionId) {
    const paddle = await initializePaddle()
    return new Promise(resolve => {
        const unsubscribe = subscribePaddleEvents(({name, data}) => {
            if (data?.transaction_id && data.transaction_id !== transactionId)
                return
            if (name === 'checkout.completed' || name === 'checkout.closed') {
                unsubscribe()
                resolve(name === 'checkout.completed')
            }
        })
        paddle.Checkout.open({
            transactionId,
            settings: {displayMode: 'overlay', theme: resolveCheckoutTheme(), allowLogout: false}
        })
    })
}

/**
 * Checkout theme matching the one the site is shown in
 * @return {'light'|'dark'}
 */
export function resolveCheckoutTheme() {
    return document.documentElement.dataset.theme === 'night' ? 'dark' : 'light'
}

/**
 * @param {{name: String, data: {}}} event
 * @private
 */
function dispatch(event) {
    for (const listener of listeners) {
        try {
            listener(event)
        } catch (e) {
            console.error(e)
        }
    }
}
