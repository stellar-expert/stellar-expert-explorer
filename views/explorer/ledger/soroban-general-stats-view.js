import React from 'react'
import {BlockSelect, InfoTooltip as Info, useExplorerApi} from '@stellar-expert/ui-framework'

export default function SorobanGeneralStatsView() {
    const {loaded, data} = useExplorerApi('contract-stats')
    if (!loaded)
        return <div className="loader"/>
    return <div className="segment blank">
        <h3>Soroban statistics</h3>
        <hr className="flare"/>
        {data?.error ? <div className="segment warning space">
            <div className="text-center"><i className="icon-warning-circle"/> Failed to fetch soroban statistics</div>
        </div> : <div className="row">
            <div className="column column-50">
                <dl>
                    <dt>Total contracts deployed:</dt>
                    <dd>
                        {(data.wasm + data.sac)}
                        <Info>Total number of contracts currently deployed on the network.</Info>
                    </dd>
                    <dt>Smart contracts:</dt>
                    <dd>
                        {data.wasm}
                        <Info>Number of WASM smart contracts deployed.</Info>
                    </dd>
                    <dt>SAC contracts:</dt>
                    <dd>
                        {data.sac}
                        <Info>Number of Classic assets bridged to Soroban.</Info>
                    </dd>

                </dl>
            </div>
            <div className="column column-50">
                <dl>
                    <dt>Invocations:</dt>
                    <dd>
                        {data.invocations}
                        <Info>Total number of contract invocations.</Info>
                    </dd>
                </dl>
                <dl>
                    <dt>Payments:</dt>
                    <dd>
                        {data.payments}
                        <Info>Total number of payments carried out in Soroban environment.</Info>
                    </dd>
                </dl>
            </div>
        </div>}
    </div>
}