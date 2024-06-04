import React, {useEffect} from 'react'
import {useRouteMatch} from 'react-router'
import {
    AssetLink,
    AccountAddress,
    BlockSelect,
    UtcTimestamp,
    InfoTooltip as Info,
    useAssetMeta,
    setPageMetadata
} from '@stellar-expert/ui-framework'
import {formatWithPrecision, approximatePrice, formatDateUTC} from '@stellar-expert/formatter'
import {useDexOffer} from '../../../business-logic/api/offer-api'
import {previewUrlCreator} from '../../../business-logic/api/metadata-api'
import {prepareMetadata} from '../../../util/prepareMetadata'
import checkPageReadiness from '../../../util/page-readiness'
import appSettings from '../../../app-settings'
import OfferHistoryTabsView from './offer-history-tabs-view'

function OfferDetailsView({offer, metadata}) {
    if (!offer) return <div className="loader"/>
    if (offer.nonExistentOffer) return <h3>Offer {offer.id} does not exist</h3>
    const sellingAssetMeta = useAssetMeta(offer.selling)
    const buyingAssetMeta = useAssetMeta(offer.buying)

    useEffect(() => {
        if (!sellingAssetMeta || !buyingAssetMeta)
            return null
        const infoList = [
            {name: 'Selling', value: sellingAssetMeta, type: 'asset'},
            {name: 'Buying', value: buyingAssetMeta, type: 'asset'},
            {name: 'Price', value: formatWithPrecision(approximatePrice(offer.price))},
            {name: 'Total trades', value: formatWithPrecision(offer.trades || 0)},
            {name: 'Created', value: `${formatDateUTC(offer.created)} UCT`}
        ]
        if (offer.deleted) {
            infoList.push({name: 'Removed', value: `${formatDateUTC(offer.updated)} UCT`})
        }
        previewUrlCreator(prepareMetadata({
            title: `Offer ${offer.id}`,
            description: `Created by ${offer.account}`,
            infoAssets: true,
            infoList
        }))
            .then(previewUrl => {
                setPageMetadata({...metadata, facebookImage: previewUrl})
                checkPageReadiness({...metadata, facebookImage: previewUrl})
            })
    }, [sellingAssetMeta, buyingAssetMeta])

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
        <OfferHistoryTabsView offer={offer}/>
    </>
}

export default function OfferView() {
    const {params} = useRouteMatch()
    const {id: offerId} = params
    const {data: offer, loaded} = useDexOffer(offerId)
    if (!loaded)
        return <div className="loader"/>

    const metadata = {
        title: `Offer ${offerId} on Stellar ${appSettings.activeNetwork} network DEX`,
        description: `Statistics and operations for offer ${offerId} on Stellar ${appSettings.activeNetwork} decentralized exchange.`
    }
    setPageMetadata(metadata)

    return <div className="offer-view">
        <h2><span className="dimmed">DEX offer</span> {offerId}</h2>
        <OfferDetailsView offer={offer} metadata={metadata}/>
    </div>
}