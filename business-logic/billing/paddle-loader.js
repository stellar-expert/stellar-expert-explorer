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
 * Open Paddle's inline checkout for a transaction the server prepared, inside the page rather than over it
 * @param {Paddle} paddle - as `initializePaddle()` resolves it
 * @param {String} transactionId
 * @param {String} frameTarget - class of the element the checkout frame goes into
 */
export function openInlineCheckout(paddle, transactionId, frameTarget) {
    paddle.Checkout.open({
        transactionId,
        settings: {
            displayMode: 'inline',
            frameTarget,
            frameInitialHeight: 450,
            frameStyle: 'width: 100%; min-width: 312px; background-color: transparent; border: none;',
            variant: 'one-page',
            theme: resolveCheckoutTheme(),
            allowLogout: false
        }
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
