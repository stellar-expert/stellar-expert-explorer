import React from 'react'
import {useRouteMatch} from 'react-router'
import {AssetLink, AccountAddress, BlockSelect, UtcTimestamp, InfoTooltip as Info, usePageMetadata} from '@stellar-expert/ui-framework'
import {formatWithPrecision, approximatePrice} from '@stellar-expert/formatter'
import appSettings from '../../../app-settings'
import {useDexOffer} from '../../../business-logic/api/offer-api'
import CrawlerScreen from '../../components/crawler-screen'
import ErrorNotificationBlock from '../../components/error-notification-block'
import OfferHistoryTabsView from './offer-history-tabs-view'

function OfferDetailsView({offer}) {
    if (!offer)
        return <div className="loader"/>
    if (offer.nonExistentOffer)
        return <h3>Offer {offer.id} does not exist</h3>
    return <>
        <div className="segment blank">
            <h3>Summary</h3>
            <hr className="flare"/>
            <div className="row">
                <div className="column column-50">
                    <dl>
                        <dt>Owner account:</dt>
                        <dd><AccountAddress account={offer.account} chars={12}/>
                            <Info>Parent account that created the offer.</Info>
                        </dd>
                        <dt>Selling:</dt>
                        <dd><AssetLink asset={offer.selling}/>
                            <Info>An asset to sell.</Info>
                        </dd>
                        <dt>Buying:</dt>
                        <dd><AssetLink asset={offer.buying}/>
                            <Info>An asset to buy.</Info>
                        </dd>
                        <dt>Price:</dt>
                        <dd><BlockSelect>{formatWithPrecision(approximatePrice(offer.price))}</BlockSelect>
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
        <CrawlerScreen><OfferHistoryTabsView offer={offer}/></CrawlerScreen>
    </>
}

export default function OfferView() {
    const {params} = useRouteMatch()
    const {id: offerId} = params
    const {data: offer, loaded} = useDexOffer(offerId)
    let extendedInfo = ''
    if (offer?.account) {
        extendedInfo = `${offer.buying.split('-')[0]}/${offer.selling.split('-')[0]} by account ${offer.account} `
    }
    usePageMetadata({
        title: `Offer ${offerId} ${extendedInfo}on Stellar ${appSettings.activeNetwork} network DEX`,
        description: `Statistics and operations for offer ${offerId} ${extendedInfo}on Stellar ${appSettings.activeNetwork} decentralized exchange.`
    })
    if (!loaded)
        return <div className="loader"/>
    if (offer?.error) {
        return <ErrorNotificationBlock>
            Failed to fetch DEX offer.
        </ErrorNotificationBlock>
    }

    return <div className="offer-view">
        <h2><span className="dimmed">DEX offer</span> {offerId}</h2>
        <OfferDetailsView offer={offer}/>
    </div>
}