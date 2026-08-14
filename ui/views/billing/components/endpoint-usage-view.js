import React from 'react'
import {formatWithAutoPrecision} from '@stellar-expert/formatter'
import DashboardSectionView from './dashboard-section-view'

/**
 * Per-endpoint breakdown of the charged allowance - shows which calls actually spend the quota
 * @param {{endpoint: String, requests: Number, credits: Number, creditsPerCall: Number}[]} [endpoints]
 * @return {JSX.Element|null}
 */
export default function EndpointUsageView({endpoints}) {
    if (!endpoints?.length)
        return null

    return <DashboardSectionView title="Where photons go" aside="A photon is one compute unit">
        <table className="billing-table exportable billing-endpoints">
            <thead>
                <tr>
                    <th>Endpoint</th>
                    <th className="text-right collapsing">Requests</th>
                    <th className="text-right collapsing">Photons/call</th>
                    <th className="text-right collapsing">Photons</th>
                </tr>
            </thead>
            <tbody>
                {endpoints.map(({endpoint, requests, credits, creditsPerCall}) => <tr key={endpoint}>
                    <td data-header="Endpoint: "><code className="billing-code">{endpoint}</code></td>
                    <td data-header="Requests: " className="text-right">{formatWithAutoPrecision(requests)}</td>
                    <td data-header="Photons/call: " className="text-right">
                        {formatWithAutoPrecision(creditsPerCall)}
                    </td>
                    <td data-header="Photons: " className="text-right billing-endpoint-total">
                        {formatWithAutoPrecision(credits)}
                    </td>
                </tr>)}
            </tbody>
        </table>
    </DashboardSectionView>
}