import React from 'react'
import {AssetLink, AccountAddress, InfoTooltip as Info, withErrorBoundary} from '@stellar-expert/ui-framework'
import {parseAssetFromObject} from '@stellar-expert/asset-descriptor'

function retrieveSponsoredInfo(ledgerData) {
    const res = []
    if (ledgerData.sponsor) {
        res.push({key: 'account', title: 'Account base reserve', sponsor: ledgerData.sponsor})
    }
    for (const balance of ledgerData.balances) {
        if (balance.sponsor) {
            const asset = parseAssetFromObject(balance)
            res.push({
                key: asset.toString(),
                title: <>
                    <AssetLink asset={asset}/> trustline
                </>,
                sponsor: balance.sponsor
            })
        }
    }
    for (const signer of ledgerData.signers) {
        if (signer.sponsor) {
            res.push({
                key: signer.key,
                title: <>
                    <AccountAddress chars={8} account={signer.key}/> signer
                </>,
                sponsor: signer.sponsor
            })
        }
    }
    return res
}

export default withErrorBoundary(function AccountSponsoredInfoView({account}) {
    const {ledgerData} = account || {}
    if (!ledgerData)
        return null
    const {num_sponsoring, num_sponsored} = ledgerData
    if (!num_sponsored && !num_sponsoring)
        return null
    return <>
        <h4 style={{marginBottom: 0}}>Sponsored reserves
            <Info link="https://developers.stellar.org/docs/glossary/sponsored-reserves/">The sponsoring account
                establishes the is-sponsoring-future-reserves-for relationship, and the sponsored account terminates it.
                While this relationship exists, reserve requirements that would normally accumulate on the sponsored
                account will now accumulate on the sponsoring account.</Info>
        </h4>
        <ul className="text-small">
            {num_sponsoring > 0 && <li>Account sponsors {num_sponsoring} reserves for other accounts.</li>}
            {num_sponsored > 0 && <li>{num_sponsored} reserves sponsored by other accounts.</li>}
            {retrieveSponsoredInfo(ledgerData).map(({key, title, sponsor}) => <li key={key}>
                {title} sponsored by <AccountAddress account={sponsor} chars={8}/>
            </li>)}
        </ul>
    </>
})