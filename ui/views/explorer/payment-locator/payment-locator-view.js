import React, {useState} from 'react'
import {StrKey} from 'stellar-sdk'
import {Button, useForceUpdate, useExplorerPaginatedApi} from '@stellar-expert/ui-framework'
import {AssetDescriptor} from '@stellar-expert/asset-descriptor'
import {navigation} from '@stellar-expert/navigation'
import PaymentLocatorResultsView from './payments-locator-results-view'
import './payment-locator.scss'

class PaymentLocatorQuery {
    constructor(params) {
        this.query = PaymentLocatorQuery.copyTrackedProperties(params)
    }

    query

    validate() {
        if (this.query.amount !== undefined && !/^\d+(\.\d+)?$/g.test(this.query.amount))
            return 'Invalid amount format'
        if (this.query.memo !== undefined && this.query.memo.length > 44)
            return 'Invalid memo length'
        if (this.query.asset !== undefined && !AssetDescriptor.isValid(this.query.asset))
            return 'Invalid asset – use {CODE}-{ISSUER} format or XLM'
        if (this.query.account !== undefined && !StrKey.isValidEd25519PublicKey(this.query.account))
            return 'Invalid account format'
        return null
    }

    get isEmpty() {
        return !Object.keys(this.query).length
    }

    static trackedProperties = [
        'memo',
        'amount',
        'asset',
        'account'
    ]

    static copyTrackedProperties(src, dest) {
        if (!dest) {
            dest = {}
        }
        for (let key of PaymentLocatorQuery.trackedProperties) {
            const value = src[key]
            if (value) {
                dest[key] = value
            }
        }
        return dest
    }
}

const emptyParams = {}
for (const {field} of PaymentLocatorQuery.trackedProperties) {
    emptyParams[field] = undefined
}

function PaymentLocatorView() {
    const [locatorQuery, setLocatorQuery] = useState(new PaymentLocatorQuery(navigation.query)),
        forceUpdate = useForceUpdate(),
        [autoLoad, setAutoLoad] = useState(!locatorQuery.isEmpty),
        [validationError, setValidationError] = useState(null)
    const results = useExplorerPaginatedApi({
        path: 'payments',
        query: locatorQuery.query,
        defaultQueryParams: emptyParams
    }, {
        autoLoad
    })

    function search(e) {
        if (e) {
            e.preventDefault()
        }
        results.reset()

        const error = locatorQuery.validate()
        if (error) {
            setValidationError(error)
            setAutoLoad(false)
            return
        }
        setAutoLoad(true)
        navigation.updateQuery({...emptyParams, ...locatorQuery.query})
        forceUpdate()
    }

    function setParam(name, value) {
        locatorQuery.query[name] = value
    }

    const {loading} = results

    function PaymentLocatorField({name, label, placeholder}) {
        return <div style={{padding: '0.2em 0'}}>
            <label>{label} <input type="text" name={name} placeholder={placeholder} defaultValue={locatorQuery.query[name] || ''}
                                  disabled={loading} onChange={e => setParam(name, e.target.value)}/></label>
        </div>
    }

    return <div className="payment-locator">
        <h3>Search for Payments</h3>
        <form action="#" onSubmit={e => search(e)}>
            <div className="row">
                <div className="column column-50">
                    <PaymentLocatorField name="account" label="Account"
                                         placeholder="source or destination account address"/>
                    <PaymentLocatorField name="memo" label="Transaction memo"
                                         placeholder="memo text if any, for example, 1D65Z50P"/>
                </div>
                <div className="column column-50">
                    <PaymentLocatorField name="amount" label="Payment amount"
                                         placeholder="for example, 123.15"/>
                    <PaymentLocatorField name="asset" label="Asset"
                                         placeholder="CODE-ISSUER format, leave blank for XLM"/>
                </div>
            </div>

            {!!validationError && <div className="error">Error: {validationError}</div>}
            <div className="space row">
                <div className="column column-25 column-offset-75">
                    <Button block disabled={results.loading}>Search</Button>
                </div>
            </div>
        </form>
        <div className="space">
            <PaymentLocatorResultsView payments={results}/>
        </div>
    </div>
}

export default PaymentLocatorView