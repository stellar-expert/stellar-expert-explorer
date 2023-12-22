import {useState, useEffect} from 'react'
import {Keypair} from '@stellar/stellar-base'
import shajs from 'sha.js'
import albedo from '@albedo-link/intent'

const authKey = 'auth:pubkey'

const authListeners = []

function notifyAuthListeners() {
    const pk = getAuthPubkey()
    for (const al of authListeners) {
        al(pk)
    }
}

function verify({pubkey, signed_message, signature}) {
    if (signed_message.indexOf(pubkey) !== 0)
        throw new Error('Public key does not match signed auth token payload')
    const kp = Keypair.fromPublicKey(pubkey),
        messageHash = shajs('sha256').update(signed_message).digest(),
        rawSignature = Buffer.from(signature, 'hex'),
        isValid = kp.verify(messageHash, rawSignature)
    if (!isValid)
        throw new Error('Invalid auth token signature')
}

function getAuthPubkey() {
    return localStorage.getItem(authKey) || undefined
}

export function logIn() {
    albedo.publicKey()
        .then(res => {
            verify(res)
            localStorage.setItem(authKey, res.pubkey)
            notifyAuthListeners()
        })
        .catch(err => console.error(err))

}

export function logOut() {
    localStorage.removeItem(authKey)
    notifyAuthListeners()
}

export function useAuth() {
    const [authPubkey, setAuthPubkey] = useState(getAuthPubkey())
    useEffect(() => {
        authListeners.push(setAuthPubkey)
        return () => {
            const idx = authListeners.indexOf(setAuthPubkey)
            if (idx >= 0) {
                authListeners.splice(idx, 1)
            }
        }
    }, [getAuthPubkey()])
    return authPubkey
}