import React, {useRef} from 'react'
import cn from 'classnames'
import PropTypes from 'prop-types'
import {Dropdown, InfoTooltip as Info, useDependantState} from '@stellar-expert/ui-framework'
import {resolvePath} from '../../../business-logic/path'

class MemoFormatter {
    constructor(memo, memoType) {
        this.memo = memo
        this.type = this.normalizeMemoType(memoType)
    }

    normalizeMemoType(memoType) {
        switch (memoType) {
            case 0:
                return 'none'
            case 1:
                return 'text'
            case 2:
                return 'id'
            case 3:
                return 'hash'
            case 4:
                return 'return'
            default:
                if (typeof (memoType) !== 'string')
                    throw new Error('Invalid memo type: ' + memoType)
                return memoType.toLowerCase()
        }
    }

    encodeTo(encoding) {
        switch (encoding) {
            case 'base64':
                return this.memo.toString('base64')
            case 'hex':
                return this.memo.toString('hex')
        }
        throw new Error(`Not supported memo encoding: ${encoding}`)
    }

    get availableEncodings() {
        return this.isBinary ? ['base64', 'hex'] : []
    }

    get link() {
        if (this.type === 'return')
            return resolvePath(`tx/${this.encodeTo('hex')})`)
    }

    get isBinary() {
        return this.type === 'return' || this.type === 'hash'
    }

    get hasMemo() {
        return this.type !== 'none'
    }

    format(encoding) {
        if (!encoding || encoding === 'base64' || !this.memo) {
            if (!this.memo)
                return '[empty]'
            if (this.memo instanceof Uint8Array)
                return this.memo.toString()
            return this.memo
        }
        return this.encodeTo(encoding)
    }
}

/**
 * @param {String|Object} memo
 * @param {String|Number} memoType
 * @param {String} [className]
 * @returns {JSX.Element}
 * @constructor
 */
export default function TxMemoView({memo, memoType, className}) {
    if (memo === undefined || memo === null)
        return null
    const memoRef = useRef(null)
    const [encoding, setEncoding] = useDependantState(() => {
        const memoWrapper = memoRef.current = new MemoFormatter(memo, memoType)
        switch (memoWrapper.type) {
            case 'return':
                return 'hex'
            case 'hash':
                return 'base64'
            default:
                return ''
        }
    }, [memo, memoType])
    const memoWrapper = memoRef.current
    if (!memoWrapper.hasMemo)
        return null
    const formattedMemo = memoWrapper.format(encoding)
    return <div className={cn('column', className)}>
        <span className="dimmed">Memo ({memoWrapper.type.toUpperCase()}): </span>
        <span className={cn('word-break', {condensed: memoWrapper.isBinary})}>
        {memoWrapper.link ? <a href={memoWrapper.link}>{formattedMemo}</a> : formattedMemo}
        </span>
        <Info link="https://www.stellar.org/developers/guides/concepts/transactions.html#memo">
            The memo contains optional extra information. It is the responsibility of the client to interpret this
            value.
            <div>Memos can be one of the following types:
                <ul>
                    <li><code>MEMO_TEXT</code>: A string up to 28-bytes long.</li>
                    <li><code>MEMO_ID</code>: A 64 bit unsigned integer.</li>
                    <li><code>MEMO_HASH</code>: A 32 byte hash.</li>
                    <li><code>MEMO_RETURN</code>: A 32 byte hash intended to be interpreted as the hash of the
                        transaction the sender is refunding.
                    </li>
                </ul>
            </div>
        </Info>
        {' '}
        {memoWrapper.isBinary && <>
            <span className="nowrap dimmed">(
                <Dropdown value={encoding} onChange={setEncoding}
                          options={memoWrapper.availableEncodings}/>{' '}format)</span>
            <Info link="https://en.wikipedia.org/wiki/Binary-to-text_encoding">
                Binary-to-text encoding format used to represent binary hashes.
                HEX and BASE-64 encodings are the most widely used standards.
            </Info>
        </>}
    </div>
}