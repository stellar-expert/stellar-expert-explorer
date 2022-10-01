import React from 'react'
import {useRouteMatch} from 'react-router'
import {AssetLink, AccountAddress, BlockSelect, UtcTimestamp, InfoTooltip as Info} from '@stellar-expert/ui-framework'
import {formatWithPrecision}  from '@stellar-expert/formatter'
import {setPageMetadata} from '../../../util/meta-tags-generator'
import appSettings from '../../../app-settings'
import {useDexOffer} from '../../../business-logic/api/offer-api'
import OfferHistoryTabsView from './offer-history-tabs-view'

function OfferDetailsView({offer}) {
    if (!offer) return <div className="loader"/>
    if (offer.nonExistentOffer) return <h3 className="text-center">Offer {offer.id} does not exist</h3>
    return <>
        <div className="card">
            <h3>Summary</h3>
            <hr/>
            <div className="row">
                <div className="column column-50">
                    <dl>
                        <dt>Owner account:</dt>
                        <dd><AccountAddress account={offer.account} chars={12}/>
                            <Info>Parent account that created the offer.</Info>
                        </dd>
                        <dt>Selling:</dt>
                        <dd><AssetLink asset={offer.selling} displayIssuer/>
                            <Info>An asset to sell.</Info>
                        </dd>
                        <dt>Buying:</dt>
                        <dd><AssetLink asset={offer.buying} displayIssuer/>
                            <Info>An asset to buy.</Info>
                        </dd>
                        <dt>Price:</dt>
                        <dd><BlockSelect>{formatWithPrecision(offer.price.n / offer.price.d)}</BlockSelect>
                            <Info>Current offer price.</Info>
                        </dd>
                    </dl>
                </div>
                <div className="column column-50">
                    <dl>
                        <dt>Total trades:</dt>
                        <dd><BlockSelect>{formatWithPrecision(offer.trades || 0)}</BlockSelect>
                            <Info>Total count of all trades for this offer.</Info>
                        </dd>
                        <dt>Created:</dt>
                        <dd><UtcTimestamp date={offer.created}/>
                            <Info>When the offer was created.</Info>
                        </dd>
                        {offer.deleted && <>
                            <dt>Removed:</dt>
                            <dd><UtcTimestamp date={offer.updated}/>
                                <Info>When the offer was removed (cancelled or fully executed).</Info>
                            </dd>
                        </>}
                    </dl>
                </div>
            </div>
        </div>
        <OfferHistoryTabsView offer={offer}/>
    </>
}

export default function OfferView() {
    const {params} = useRouteMatch(),
        {id: offerId} = params,
        {data: offer, loaded} = useDexOffer(offerId)
    if (!loaded) return <div className="loader"/>

    setPageMetadata({
        title: `Offer ${offerId} on Stellar ${appSettings.activeNetwork} network DEX`,
        description: `Statistics and operations for offer ${offerId} on Stellar ${appSettings.activeNetwork} decentralized exchange.`
    })

    return <div className="offer-view">
        <h2><span className="dimmed">DEX offer</span> {offerId}</h2>

        <OfferDetailsView offer={offer}/>
    </div>
}