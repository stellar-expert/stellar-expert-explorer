import React, {useState} from 'react'
import {StrKey} from '@stellar/stellar-base'
import {AccountAddress, Amount, Button} from '@stellar-expert/ui-framework'
import {formatWithAutoPrecision} from '@stellar-expert/formatter'
import {apiCall} from '../../../models/api'
import {useAssetInfo} from '../../../business-logic/api/asset-api'

function HolderPositionRank({address, position, pool}) {
    const {loaded, data: assetInfo} = useAssetInfo(pool.descriptor.toString())
    if (!position || !loaded) return null
    const {position: rank, balance, total} = position
    const share = 100 * balance / assetInfo.supply
    return <div className="segment">
        <AccountAddress account={address} chars={12}/> holds <Amount asset={pool.descriptor} amount={balance} adjust/>
        <span className="dimmed"> ({formatWithAutoPrecision(share)}% of total supply)</span> - rank {rank} of {total}
    </div>
}

export default function AssetHolderPositionView({asset}) {
    const [address, setAddress] = useState(''),
        [inProgress, setInProgress] = useState(false),
        [error, setError] = useState(''),
        [result, setResult] = useState(null)

    function checkRank() {
        if (!StrKey.isValidEd25519PublicKey(address) && !StrKey.isValidContract(address)) {
            setError('Invalid account address')
            return
        }
        setInProgress(true)
        apiCall(`asset/${asset.descriptor.toString()}/position/${address}`)
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
            <HolderPositionRank pool={asset} address={address} position={result}/>
        </div>
    </>
}