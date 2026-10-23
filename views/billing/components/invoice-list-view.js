import React, {useCallback} from 'react'
import cn from 'classnames'
import {UtcTimestamp} from '@stellar-expert/ui-framework'
import {apiRequest} from '../../../business-logic/billing/billing-api'
import {findPlan, formatAmount} from '../../../business-logic/billing/api-plans'

/**
 * @typedef {Object} Invoice
 * @property {String} id
 * @property {Number} date
 * @property {String} plan - key of the plan billed, named from the catalogue here
 * @property {String} term - what was billed: "monthly", "yearly", or "plan change" for a prorated switch
 * @property {String} [method] - how it was paid
 * @property {Number} amount - charged amount, tax included
 * @property {Number} [tax] - the share of the amount that is tax
 * @property {String} [currency]
 * @property {'paid'|'pending'|'refunded'|'partially-refunded'|'chargeback'} status
 * @property {String|null} [invoiceNumber] - as printed on the invoice
 * @property {String|null} [transactionId] - the payment processor transaction, which the printable invoice is
 * issued for
 */

const statusStyles = {
    paid: 'billing-badge',
    pending: 'billing-badge pending',
    'partially-refunded': 'billing-badge pending',
    refunded: 'billing-badge inactive',
    chargeback: 'billing-badge inactive'
}

/**
 * Issued invoices. The compact form drops everything but date, amount and status so it fits a side panel
 * @param {Invoice[]} [invoices]
 * @param {String} [accountId] - the account the invoices were issued to, needed to fetch a printable copy
 * @param {Boolean} [compact]
 * @return {JSX.Element}
 */
export default function InvoiceListView({invoices, accountId, compact}) {
    if (!invoices?.length)
        return <div className="dimmed text-small text-center space">(No invoices yet)</div>

    if (compact)
        return <div className="billing-invoice-list space">
            {invoices.map(({id, date, amount, currency, status}) => <div key={id || date} className="dual-layout">
                <span className="text-small"><UtcTimestamp date={date} dateOnly/></span>
                <span className="text-small">
                    {formatAmount(amount, currency)}&emsp;<StatusView status={status}/>
                </span>
            </div>)}
        </div>

    return <table className="billing-table exportable">
        <thead>
            <tr>
                <th>Date</th>
                <th>Invoice</th>
                <th>Method</th>
                <th className="text-right collapsing">Amount</th>
                <th className="text-center collapsing">Status</th>
                <th className="text-right collapsing"><i className="icon-download" title="Download invoice"/></th>
            </tr>
        </thead>
        <tbody>
            {invoices.map(invoice => <InvoiceRowView key={invoice.id || invoice.date} invoice={invoice}
                                                     accountId={accountId}/>)}
        </tbody>
    </table>
}

/**
 * @param {Invoice} invoice
 * @param {String} [accountId]
 * @return {JSX.Element}
 * @private
 */
function InvoiceRowView({invoice, accountId}) {
    const {date, plan, term, method, amount, tax, currency, status, invoiceNumber, transactionId} = invoice

    const download = useCallback(e => {
        e.preventDefault()
        openInvoicePdf(accountId, transactionId)
    }, [accountId, transactionId])

    return <tr>
        <td data-header="Date: " className="nowrap"><UtcTimestamp date={date} dateOnly/></td>
        <td data-header="Invoice: ">
            {findPlan(plan)?.name || plan} · {term}
            {!!invoiceNumber && <div className="dimmed text-tiny">{invoiceNumber}</div>}
        </td>
        <td data-header="Method: " className="dimmed">{method || '—'}</td>
        <td data-header="Amount: " className="text-right nowrap">
            {formatAmount(amount, currency)}
            {tax > 0 && <div className="dimmed text-tiny">incl. {formatAmount(tax, currency)} tax</div>}
        </td>
        <td data-header="Status: " className="text-center">
            <StatusView status={status}/>
        </td>
        <td className="text-right">
            {!!transactionId && !!accountId && <a href="#" onClick={download}>PDF</a>}
        </td>
    </tr>
}

/**
 * @param {String} status
 * @return {JSX.Element}
 * @private
 */
function StatusView({status}) {
    return <span className={cn('text-tiny nowrap', statusStyles[status] || 'billing-badge inactive')}>
        {status?.replace(/-/g, ' ')}
    </span>
}

/**
 * Show the printable invoice in a new tab. The link to it is temporary, so it is asked for on demand - and the
 * tab is opened before the request, while the click still counts as the user's gesture for popup blockers
 * @param {String} accountId
 * @param {String} transactionId
 * @private
 */
function openInvoicePdf(accountId, transactionId) {
    const tab = window.open('', '_blank')
    if (tab) {
        tab.opener = null
    }
    apiRequest(`account/${accountId}/invoice/${transactionId}/pdf`)
        .then(({url}) => {
            if (!/^https:\/\//.test(url))
                throw new Error('The invoice is not available yet.')
            if (!tab)
                return window.location.assign(url)
            tab.location.href = url
        })
        .catch(error => {
            tab?.close()
            notify({type: 'error', message: 'Failed to retrieve the invoice. ' + error?.message})
        })
}
