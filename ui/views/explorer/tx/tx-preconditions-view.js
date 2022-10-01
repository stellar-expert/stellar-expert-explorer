import React from 'react'
import {AccountAddress, InfoTooltip as Info} from '@stellar-expert/ui-framework'

function formatDateUTC(date) {
    const parseDate = new Date(date * 1000)
    if (isNaN(parseDate.valueOf())) return '∞'
    return parseDate
        .toISOString()
        .replace(/(T|\.\d+Z)/g, ' ') // make it more human friendly
        .trim()
}

function parseTimeBounds(preconditions) {
    if (!preconditions.timebounds) return null
    const {min_time, max_time} = preconditions.timebounds
    const info = <Info link="https://developers.stellar.org/docs/glossary/transactions/#time-bounds">
        The timestamp, determined by ledger time, of a lower and upper bound of when this transaction is valid. If a transaction is
        submitted too early or too late, it will fail to make it into the transaction set.
    </Info>
    if (min_time > 0 && max_time > 0)
        return <div><span className="dimmed">Valid</span>{' '}
            <span className="condensed">{formatDateUTC(min_time)} - {formatDateUTC(max_time)}</span>{info}</div>
    if (min_time > 0)
        return <div><span className="dimmed">Valid after</span> <span className="condensed">{formatDateUTC(min_time)}{info}</span></div>
    if (max_time > 0)
        return <div><span className="dimmed">Valid before</span> <span className="condensed">{formatDateUTC(max_time)}</span>{info}</div>
    return null
}

function parseLedgerBounds(preconditions) {
    if (!preconditions.ledgerbounds) return null
    const {min_ledger, max_ledger} = preconditions.ledgerbounds
    const info = <Info link="https://developers.stellar.org/docs/glossary/transactions/#ledger-bounds">
        The transaction is only valid for ledger numbers that fall into the specified ledger sequence range.
    </Info>
    if (min_ledger > 0 && max_ledger > 0) return <div><span className="dimmed">Valid
        between</span> {min_ledger} <span className="dimmed">and</span> {max_ledger} <span className="dimmed">ledgers</span>{info}</div>
    if (min_ledger > 0) return <div><span className="dimmed">Valid after ledger</span> {min_ledger}{info}</div>
    if (max_ledger > 0) return <div><span className="dimmed">Valid before ledger</span> {max_ledger}{info}</div>
    return null
}


function parseMinSequence(preconditions) {
    if (!preconditions.min_account_sequence) return null
    return <div>
        <span className="dimmed">Minimum account sequence:</span> {preconditions.min_account_sequence}
        <Info link="https://developers.stellar.org/docs/glossary/transactions/#minimum-sequence-number">
            <p>
                The transaction is valid when its source account’s sequence number satisfies{' '}
                <code>tx.minSeqNum &lt;= source.sequence &lt; tx.seqNum</code>.
            </p>
            Note that after a transaction is executed, the account will always set its sequence number to the transaction’s sequence number.
        </Info>
    </div>
}

function parseMinSequenceAge(preconditions) {
    if (!preconditions.min_account_sequence_age) return null
    return <div>
        <span className="dimmed">Minimum account sequence age:</span> {preconditions.min_account_sequence_age}{' '}
        <span className="dimmed">seconds</span>
        <Info link="https://developers.stellar.org/docs/glossary/transactions/#minimum-sequence-age">
            <p>
                The transaction is only valid after a specified duration (expressed in seconds) elapses since the account’s sequence number
                age.
            </p>
            Minimum sequence age is a precondition relating to time, but unlike time bounds which express absolute times, minimum sequence
            age is relative to when the transaction source account’s sequence number was touched.
        </Info>
    </div>
}

function parseMinSequenceGap(preconditions) {
    if (!preconditions.min_account_sequence_ledger_gap) return null
    return <div>
        <span className="dimmed">Minimum sequence ledger gap:</span> {preconditions.min_account_sequence_ledger_gap}
        <Info link="https://developers.stellar.org/docs/glossary/transactions/#minimum-sequence-ledger-gap">
            <p>
                The transaction is only valid after the current network ledger number meets (or exceeds) a particular gap relative to
                the ledger corresponding to the account’s sequence number age.
            </p>
            This is similar to the minimum sequence age, except it’s expressed as a number of ledgers rather than a duration of time.
        </Info>
    </div>
}

function parseExtraSigners(preconditions) {
    const signers = preconditions.extra_signers
    if (!signers?.length) return null
    return <div>
        <span className="dimmed">Required extra signer{signers.length > 1 ? 's' : ''}:{' '}</span>
        {signers.map((s, i) => <span key={i + s}>{i > 0 && ', '}<AccountAddress account={s}/></span>)}
        <Info link="https://developers.stellar.org/docs/glossary/transactions/#extra-signers">
            Extra signers precondition means it must have signatures that correspond to those extra signers,
            even if those signatures would not otherwise be required to authorize the transaction
            (i.e. for its source account or operations).
        </Info>
    </div>
}

export default function TxPreconditionsView({tx}) {
    const {preconditions} = tx
    if (!preconditions) return null
    const parsed = [
        parseTimeBounds(preconditions),
        parseLedgerBounds(preconditions),
        parseMinSequence(preconditions),
        parseMinSequenceAge(preconditions),
        parseMinSequenceGap(preconditions),
        parseExtraSigners(preconditions)
    ].filter(r => !!r)

    if (!parsed.length)
        return null
    return <div>
        <h4>Preconditions</h4>
        {parsed.map((component, i) => <div key={tx.id + i}>{component}</div>)}
    </div>
}