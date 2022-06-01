import React from 'react'
import {BlockSelect} from '@stellar-expert/ui-framework'

const interopServices = {
    'federation_server': '0002',
    'auth_server': '0003',
    'transfer_server': '0006',
    'web_auth_endpoint': '0010',
    'kyc_server': '0012',
    'transfer_server_sep0024': '0024',
    'direct_payment_server': '0031'
}

function formatSepLink(standardId) {
    return `https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-${standardId}.md`
}

export default function TomlInteropView({data}) {
    const keys = Object.keys(interopServices).filter(key => !!data[key])
    return <div>
        <div className="dimmed text-tiny">
            Please note, the metadata is loaded from the account home domain and was
            not verified by StellarExpert team.
        </div>
        <div className="micro-space">
            Supported interoperability standards:
        </div>
        <div className="micro-space">
            {keys.map(key => <div key={key}>
                <a href={formatSepLink(key)} rel="noreferrer noopener"
                   target="_blank">SEP-{interopServices[key]}</a> {key.toUpperCase()}{' '}
                <code><BlockSelect>{data[key]}</BlockSelect></code>
            </div>)}
        </div>
    </div>
}

TomlInteropView.hasInteropServices = function (tomlInfo) {
    return Object.keys(interopServices).some(key => !!tomlInfo[key])
}