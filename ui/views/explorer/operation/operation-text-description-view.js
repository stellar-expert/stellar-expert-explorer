import React from 'react'
import {AssetLink, AccountAddress, Amount, OfferLink} from '@stellar-expert/ui-framework'
import {AssetDescriptor} from '@stellar-expert/asset-descriptor'
import {shortenString, formatWithAutoPrecision} from '@stellar-expert/formatter'

//0
function CreateAccountDescriptionView({source, destination, startingBalance}) {
    return <>
        <AccountAddress account={source} chars={8}/> created account{' '}
        <AccountAddress account={destination} chars={8}/>{' '}
        with starting balance <Amount amount={startingBalance} asset="XLM"/>
    </>
}

//1
function PaymentDescriptionView({source, destination, asset, amount}) {
    return <>
        <AccountAddress account={source} chars={8}/> transferred{' '}
        <Amount amount={amount} asset={AssetDescriptor.parse(asset)}/> to{' '}
        <AccountAddress account={destination} chars={8}/>
    </>
}

//2
function PathPaymentStrictReceiveDescriptionView({
                                                     source,
                                                     destination,
                                                     sourceAsset,
                                                     sourceAmount,
                                                     sourceMax,
                                                     destAsset,
                                                     destAmount
                                                 }) {
    return <>
        <AccountAddress account={source} chars={8}/> transferred{' '}
        <Amount amount={sourceAmount} asset={AssetDescriptor.parse(sourceAsset)}/>{' '}
        <span className="dimmed">(max <Amount amount={sourceMax} asset={AssetDescriptor.parse(sourceAsset)}/>)</span>
        {' '}<i className="icon icon-shuffle color-primary"/>{' '}
        <Amount amount={destAmount} asset={AssetDescriptor.parse(destAsset)}/> to{' '}
        <AccountAddress account={destination} chars={8}/>
    </>
}

//3
function ManageSellOfferDescriptionView({
                                            source,
                                            offerId,
                                            createdOffer,
                                            sellingAsset,
                                            buyingAsset,
                                            amount,
                                            price,
                                            passive
                                        }) {
    if (offerId > 0 && parseFloat(amount) === 0)
        return <CancelledOfferDescriptionView source={source} offerId={offerId}/>
    const of = offerId > 0 ? offerId : createdOffer
    return <>
        <AccountAddress account={source} chars={8}/>{' '}
        {offerId > 0 ? 'updated' : 'placed new'} {!!passive && 'passive '}
        offer{of > 0 && <> <OfferLink offer={of}/></>} – sell{' '}
        <Amount amount={amount} asset={AssetDescriptor.parse(sellingAsset)}/> for{' '}
        <AssetLink asset={buyingAsset}/> at{' '}
        {formatWithAutoPrecision(price)}{' '}
        {AssetDescriptor.parse(buyingAsset).toCurrency()}/{AssetDescriptor.parse(sellingAsset).toCurrency()}
    </>
}

//3,12
function CancelledOfferDescriptionView({source, offerId}) {
    return <>
        <AccountAddress account={source} chars={8}/> cancelled offer <OfferLink offer={offerId}/>
    </>
}

//4
function ManagePassiveSellOfferDescriptionView(op) {
    return <ManageSellOfferDescriptionView {...op} passive={true}/>
}

//5
function SetOptionsDescriptionView({
                                       source,
                                       setFlags,
                                       clearFlags,
                                       homeDomain,
                                       inflationDest,
                                       lowThreshold,
                                       medThreshold,
                                       highThreshold,
                                       signer,
                                       masterWeight
                                   }) {
    return <>
        <AccountAddress account={source} chars={8}/> set account options.{' '}
        {setFlags && setFlags.indexOf(1) >= 0 ? 'Trustline authorization required flag set. ' : null}
        {setFlags && setFlags.indexOf(2) >= 0 ? 'Trustline authorization revocable flag set. ' : null}
        {clearFlags && clearFlags.indexOf(1) >= 0 ? 'Trustline authorization required flag unset. ' : null}
        {clearFlags && clearFlags.indexOf(2) >= 0 ? 'Trustline authorization revocable flag unset. ' : null}
        {homeDomain ? <>Home domain set to <a href={`https://${homeDomain}`} target="_blank"
                                              rel="noreferrer noopener">{homeDomain}</a>. </> : null}
        {inflationDest ? <>Inflation destination set to <AccountAddress account={inflationDest}
                                                                        chars={8}/>. </> : null}
        {lowThreshold !== undefined ? `Low threshold set to ${lowThreshold}. ` : null}
        {medThreshold !== undefined ? `Medium threshold set to ${medThreshold}. ` : null}
        {highThreshold !== undefined ? `High threshold set to ${highThreshold}. ` : null}
        {signer !== undefined ? <>Signer <AccountAddress account={signer.key} chars={8}/> weight set
            to {signer.weight}. </> : null}
        {masterWeight !== undefined ? `Master key weight set to ${masterWeight}. ` : null}
    </>
}

//6
function ChangeTrustDescriptionView({source, asset, limit}) {
    if (limit > 0)
        return <>
            <AccountAddress account={source} chars={8}/> established trustline to <AssetLink asset={asset}/>
            {limit !== '922337203685.4775807' && <> with limit <Amount amount={limit} asset={asset}/></>}
        </>
    return <>
        <AccountAddress account={source} chars={8}/> removed trustline to <AssetLink asset={asset}/>
    </>
}

//7
function AllowTrustDescriptionView({source, asset, destination, authorized}) {
    return <>
        <AccountAddress account={source} chars={8}/>{' '}
        {authorized ? 'authorized ' : 'deauthorized '}
        <AssetLink asset={asset}/> trustline for account{' '}
        <AccountAddress account={destination} chars={8}/>
    </>
}

//8
function MergeAccountDescriptionView({source, destination}) {
    return <>
        <AccountAddress account={source} chars={8}/> was merged into account{' '}
        <AccountAddress account={destination} chars={8}/>
    </>
}

//9
function InflationDescriptionView({source}) {
    return <>
        <AccountAddress account={source} chars={8}/> initiated <AssetLink asset="XLM"/> inflation
    </>
}

//10
function ManageDataDescriptionView({source, name, value}) {
    return <>
        <AccountAddress account={source} chars={8}/>{' '}
        {!name ? 'updated data entries' :
            value !== undefined ?
                <>set data entry <span
                    className="word-break condensed text-small"><code>"{name}"</code> = <code>"{value}"</code></span></> :
                <>deleted data entry <span className="word-break condensed text-small"><code>"{name}"</code></span></>}
    </>
}

//11
function BumpSequenceDescriptionView({source, to}) {
    return <>
        Bump sequence for account <AccountAddress account={source} chars={8}/>
        {!!to && <> to {to}</>}
    </>
}

//12
function ManageBuyOfferDescriptionView({source, offerId, createdOffer, sellingAsset, buyingAsset, amount, price}) {
    if (offerId > 0 && parseFloat(amount) === 0)
        return <CancelledOfferDescriptionView source={source} offerId={offerId}/>
    const of = offerId > 0 ? offerId : createdOffer
    return <>
        <AccountAddress account={source} chars={8}/>{' '}
        {offerId > 0 ? 'updated' : 'placed new'} offer
        {of > 0 && <> <OfferLink offer={of}/></>} – buy{' '}
        <Amount amount={amount} asset={AssetDescriptor.parse(buyingAsset)}/> for{' '}
        <AssetLink asset={sellingAsset}/> at{' '}
        {formatWithAutoPrecision(price)}{' '}
        {AssetDescriptor.parse(sellingAsset).toCurrency()}/{AssetDescriptor.parse(buyingAsset).toCurrency()}
    </>
}

//13
function PathPaymentStrictSendDescriptionView({
                                                  source,
                                                  destination,
                                                  sourceAsset,
                                                  sourceAmount,
                                                  destAsset,
                                                  destAmount,
                                                  destMin
                                              }) {
    return <>
        <AccountAddress account={source} chars={8}/> transferred{' '}
        <Amount amount={sourceAmount} asset={AssetDescriptor.parse(sourceAsset)}/>{' '}
        <i className="icon icon-shuffle color-primary"/>{' '}
        <Amount amount={destAmount} asset={AssetDescriptor.parse(destAsset)}/>{' '}
        <span className="dimmed">(min <Amount amount={destMin} asset={AssetDescriptor.parse(destAsset)}/>)</span>{' '}
        to <AccountAddress account={destination} chars={8}/>
    </>
}

//14
function CreateClaimableBalanceDescriptionView({source, asset, amount, claimants}) {
    return <>
        <AccountAddress account={source} chars={8}/> created claimable balance{' '}
        <Amount amount={amount} asset={AssetDescriptor.parse(asset)}/>{' '}
        with claimant conditions <pre>{JSON.stringify(claimants, null, '  ')}</pre>
    </>
}

//15
function ClaimClaimableBalanceDescriptionView({source, balanceId}) {
    return <>
        <AccountAddress account={source} chars={8}/> claimed balance {shortenString(balanceId)}
    </>
}

//16
function BeginSponsoringFutureReservesDescriptionView({sponsor, destination}) {
    return <>
        <AccountAddress account={sponsor} chars={8}/> began sponsoring reserves for{' '}
        <AccountAddress account={destination} chars={8}/>
    </>
}

//17
function EndSponsoringFutureReservesDescriptionView({account}) {
    return <>
        Ended sponsoring reserves for{' '}
        <AccountAddress account={account} chars={8}/>
    </>
}

//18
function RevokeSponsorshipDescriptionView({source, revoke}) {
    function processRevokeDetails() {
        switch (revoke.type) {
            case 'account':
                return <>account <AccountAddress account={revoke.account} chars={8}/></>
            case 'offer':
                return <>offer <OfferLink offer={revoke.offer}/></>
            case 'data':
                return <>data entry {revoke.dataName}</>
            case 'trustline':
                return <>trustline <AssetLink asset={revoke.asset}/> for account{' '}
                    <AccountAddress account={revoke.account} chars={8}/></>
            case 'claimableBalance':
                const {balance} = revoke
                return <>balance {shortenString(balance)}</>
            case 'sponsorshipSigner':
                return <><AccountAddress account={revoke.signerKey} chars={8}/> signer for account{' '}
                    <AccountAddress account={revoke.account} chars={8}/></>
        }
    }

    return <>
        <AccountAddress account={source} chars={8}/> revoked sponsorship for the {processRevokeDetails()}
    </>
}

//19
function ClawbackDescriptionView({source, from, amount, asset}) {
    return <>
        <AccountAddress account={source} chars={8}/> clawbacked <Amount asset={asset} amount={amount}/>{' '}
        from <AccountAddress account={from}/>
    </>
}

//20
function ClawbackClaimableBalanceDescriptionView({source, balanceId}) {
    return <>
        <AccountAddress account={source} chars={8}/> clawbacked claimable balance {shortenString(balanceId)}
    </>
}

//21
function SetTrustLineFlagsDescriptionView({source, destination, asset, setFlags, clearFlags}) {
    const flags = setFlags !== undefined && <> {setFlags}, cleared flags {clearFlags}</>
    return <>
        <AccountAddress account={source} chars={8}/> set <AssetLink asset={asset}/> trustline flags{flags} for
        account <AccountAddress account={destination} chars={8}/>
    </>
}

//22
function DepositLiquidityDescriptionView({source, poolId, assets, maxAmount, minPrice, maxPrice}) {
    return <>
        <AccountAddress account={source} chars={8}/> deposited liquidity <Amount asset={assets[0]} amount={maxAmount[0]}/>{' '}
        and <Amount asset={assets[1]} amount={maxAmount[1]}/> to <AssetLink asset={poolId}/>{' '}
        <span className="dimmed">(price range {formatWithAutoPrecision(minPrice)} - {formatWithAutoPrecision(maxPrice)})</span>
    </>
}

//23
function WithdrawLiquidityDescriptionView({source, poolId, assets, shares, minAmount}) {
    return <>
        <AccountAddress account={source} chars={8}/> withdrew {formatWithAutoPrecision(shares)} shares from <AssetLink asset={poolId}/>
        {(minAmount[0] > 0 || minAmount[1] > 0) && <span className="dimmed"> (minimum <Amount asset={assets[0]} amount={minAmount[0]}/>{' '}
            and <Amount asset={assets[1]} amount={minAmount[1]}/>)</span>}
    </>
}

const typeMapping = {
    0: CreateAccountDescriptionView,
    1: PaymentDescriptionView,
    2: PathPaymentStrictReceiveDescriptionView,
    3: ManageSellOfferDescriptionView,
    4: ManagePassiveSellOfferDescriptionView,
    5: SetOptionsDescriptionView,
    6: ChangeTrustDescriptionView,
    7: AllowTrustDescriptionView,
    8: MergeAccountDescriptionView,
    9: InflationDescriptionView,
    10: ManageDataDescriptionView,
    11: BumpSequenceDescriptionView,
    12: ManageBuyOfferDescriptionView,
    13: PathPaymentStrictSendDescriptionView,
    14: CreateClaimableBalanceDescriptionView,
    15: ClaimClaimableBalanceDescriptionView,
    16: BeginSponsoringFutureReservesDescriptionView,
    17: EndSponsoringFutureReservesDescriptionView,
    18: RevokeSponsorshipDescriptionView,
    19: ClawbackDescriptionView,
    20: ClawbackClaimableBalanceDescriptionView,
    21: SetTrustLineFlagsDescriptionView,
    22: DepositLiquidityDescriptionView,
    23: WithdrawLiquidityDescriptionView
}

export default function OpTextDescriptionView({type, ...props}) {
    const elementType = typeMapping[type]
    return React.createElement(elementType, props)
}