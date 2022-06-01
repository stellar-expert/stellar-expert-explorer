import React from 'react'
import {AccountAddress} from '@stellar-expert/ui-framework'
import Info from '../../components/info-tooltip'

export default function AccountSignersView({account}) {
    const {ledgerData} = account
    if (!ledgerData) return null
    return <>
        <h4 style={{marginBottom: 0}}>Account Signers
            <Info link="https://www.stellar.org/developers/guides/concepts/accounts.html#signers">Used for
                multi-sig. This field lists other public keys and their weights, which can be used to authorize
                transactions for this account.</Info>
        </h4>
        <ul className="text-small condensed">
            {ledgerData.signers.map(({key, weight}) => <li key={key}>
                <AccountAddress name={key === account.id && 'self' || false} account={key} className="word-break"/> (w:<b>{weight}</b>)
            </li>)}
        </ul>
    </>
}