import React, {useState} from 'react'
import {StrKey} from '@stellar/stellar-base'
import {AccountAddress, Button} from '@stellar-expert/ui-framework'
import {formatWithAutoPrecision} from '@stellar-expert/formatter'
import {apiCall} from '../../../models/api'

function HolderPositionRank({address, position, pool, shares}) {
    if (!position) return null
    const share = 100 * position.stake / shares
    return <div className="segment">
        <AccountAddress account={address} chars={12}/> holds {position.stake} pool shares
        <span className="dimmed"> ({formatWithAutoPrecision(share)}% of total supply)</span> - rank {position.position} of {position.total}
    </div>
}

export default function LiquidityPoolHolderPositionView({pool, shares}) {
    const [address, setAddress] = useState(''),
        [inProgress, setInProgress] = useState(false),
        [error, setError] = useState(''),
        [result, setResult] = useState(null)

    function checkRank() {
        if (!StrKey.isValidEd25519PublicKey(address)) {
            setError('Invalid account address')
            return
        }
        setInProgress(true)
        apiCall(`liquidity-pool/${pool}/position/${address}`)
            .then(res => {
                setResult(res)
                setInProgress(false)
            })
            .catch(e => {
                setInProgress(false)
                if (e.status === 404) {
                    setError('This account balance is zero')
                } else {
                    setError('Failed to fetch account balance and rank')
                }
            })
    }

    function editAddress(value) {
        setAddress(value)
        setError('')
        setResult(null)
    }

    return <>
        <div className="row">
            <div className="column column-75">
                <input type="text" value={address} onChange={e => editAddress(e.target.value.trim())}
                       placeholder="Copy-paste address to check its rank"/>
            </div>
            <div className="column column-25">
                <Button block outline disabled={inProgress} onClick={checkRank}>Check rank</Button>
            </div>
        </div>
        <div>
            {inProgress && <div className="loader"/>}
            {!!error && <div className="error">{error}</div>}
            <HolderPositionRank pool={pool} address={address} position={result} shares={shares}/>
        </div>
    </>
}