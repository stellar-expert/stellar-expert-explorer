import React, {useEffect, useState} from 'react'
import {formatExplorerLink, useStellarNetwork} from '@stellar-expert/ui-framework'

export function StagedSorobanParamsUpdate() {
    const [updateKey, setUpdateKey] = useState()
    const network = useStellarNetwork()
    useEffect(() => {
        fetch(`https://stellar-expert.github.io/staged-soroban-upgrades/staged-${network}.json`)
            .then(res => {
                if (!res.ok)
                    throw new Error('Failed to fetch staged soroban config changes for network ' + network)
                return res.json()
            })
            .then(res => setUpdateKey(new Date(res.timestamp) < new Date() ? null : res.upgrade))
            .catch(() => {
            })
    }, [])
    if (!updateKey)
        return null
    const link = formatExplorerLink('staged-soroban-config', encodeURIComponent(updateKey))
    return <div className="text-right">
        <a href={link} className="icon-box">Staged Soroban config changes proposal</a>
    </div>
}