import React from 'react'
import PropTypes from 'prop-types'
import {AssetLink, Amount, OfferLink, useDependantState, loadAccountOffers} from '@stellar-expert/ui-framework'
import {parseAssetFromObject} from '@stellar-expert/asset-descriptor'
import GridDataActionsView from '../../components/grid-data-actions'

function AccountOffersView({address}) {
    const [offers, setOffers] = useDependantState(() => {
        loadAccountOffers(address, {limit: 200})
            .then(offers => setOffers(offers))
        return null
    }, [address])

    if (!offers) return <div className="loader"/>
    if (!offers.length) return <div className="space dimmed text-center">(no active offers)</div>
    return <div className="segment blank">
        <table className="table exportable" data-export-prefix={address + '-offers'}>
            <thead>
            <tr>
                <th className="collapsing">Offer ID</th>
                <th className="collapsing">Selling</th>
                <th className="collapsing">Buying</th>
                <th className="collapsing">Price</th>
                <th className="collapsing">Amount</th>
            </tr>
            </thead>
            <tbody>
            {offers.map(offer => {
                const selling = parseAssetFromObject(offer.selling)
                const buying = parseAssetFromObject(offer.buying)
                return <tr key={offer.id}>
                    <td data-header="Offer ID: ">
                        <OfferLink offer={offer.id}/>
                    </td>
                    <td data-header="Selling: ">
                        <AssetLink asset={selling}/>
                    </td>
                    <td data-header="Buying: ">
                        <AssetLink asset={buying}/>
                    </td>
                    <td data-header="Price: ">
                        <Amount amount={offer.price}/> {buying.toCurrency()}/{selling.toCurrency()}
                    </td>
                    <td data-header="Amount: ">
                        <Amount amount={offer.amount} asset={selling}/>
                    </td>
                </tr>
            })}
            </tbody>
        </table>
        <GridDataActionsView model={{data: offers}}/>
    </div>
}

AccountOffersView.propTypes = {
    address: PropTypes.string.isRequired
}

export default AccountOffersView