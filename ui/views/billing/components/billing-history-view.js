import React, {useEffect, useState} from 'react'
import {apiRequest} from '../../../business-logic/billing/billing-api'
import SegmentLoader from '../utils/segment-loader-view'
import InvoiceListView from './invoice-list-view'

const day = 24 * 60 * 60 * 1000

/**
 * Everything an account has been billed
 * @param {String} [account] - undefined while the session resolves
 * @param {{from: Number, to: Number}} [filters] - period to report, the whole history when not set
 * @return {JSX.Element}
 */
export default function BillingHistoryView({account, filters}) {
    const [invoices, setInvoices] = useState()
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (!account)
            return

        setIsLoading(true)
        apiRequest(`account/${account}/invoice`)
            .then(res => setInvoices(res.invoices))
            .catch(error => notify({type: 'error', message: 'Failed to load billing history. ' + error?.message}))
            .finally(() => setIsLoading(false))
    }, [account])

    if (isLoading || !account)
        return <SegmentLoader inside/>
    return <InvoiceListView invoices={selectPeriod(invoices, filters)}/>
}

/**
 * Invoices raised within the period asked for
 * @param {Invoice[]} [invoices]
 * @param {{from: Number, to: Number}} [filters] - bounds in Unix seconds, as the filter editor reports them
 * @return {Invoice[]|undefined}
 * @private
 */
function selectPeriod(invoices, {from, to} = {}) {
    if (!invoices?.length || (!from && !to))
        return invoices
    return invoices.filter(invoice => (!from || invoice.date >= from * 1000) &&
        (!to || invoice.date < to * 1000 + day))
}