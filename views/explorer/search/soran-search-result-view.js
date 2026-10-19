import React from 'react'
import {StrKey} from '@stellar/stellar-sdk'
import {resolvePath} from '../../../business-logic/path'

export default function SoranSearchResultView({resolution}) {
    const {name, address, memo} = resolution
    const isContract = StrKey.isValidContract(address)
    const link = resolvePath(`${isContract ? 'contract' : 'account'}/${address}`)
    return <div className="segment blank space">
        <h3>Soran name: {name}</h3>
        <p>{isContract ? 'Contract' : 'Account'} destination on testnet:</p>
        <p style={{overflowWrap: 'anywhere'}}><a href={link}>{address}</a></p>
        {!!memo && <p>Required memo ({memo.type}):{' '}
            <code style={{whiteSpace: 'pre-wrap', overflowWrap: 'anywhere'}}>{memo.value}</code>
        </p>}
        {StrKey.isValidMed25519PublicKey(address) && <p className="dimmed">
            The routing ID is included in this full muxed address.
        </p>}
        <a href={link}>View {isContract ? 'contract' : 'account'} activity</a>
    </div>
}
