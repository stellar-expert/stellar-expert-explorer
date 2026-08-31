import React from 'react'
import cn from 'classnames'
import {UtcTimestamp} from '@stellar-expert/ui-framework'
import {findPlan} from '../../../business-logic/billing/api-plans'

/**
 * @typedef {Object} Invoice
 * @property {Number} date
 * @property {String} plan - key of the plan billed, named from the catalogue here
 * @property {String} term - length of the term billed, e.g. "monthly"
 * @property {String} [method] - how it was paid
 * @property {Number} amount - charged amount in USD
 * @property {'paid'|'pending'|'failed'} status
 * @property {String} [pdf] - link to the printable invoice
 */

const statusStyles = {
    paid: 'billing-badge',
    pending: 'billing-badge pending',
    failed: 'billing-badge inactive'
}

/**
 * Issued invoices. The compact form drops everything but date, amount and status so it fits a side panel
 * @param {Invoice[]} [invoices]
 * @param {Boolean} [compact]
 * @return {JSX.Element}
 */
export default function InvoiceListView({invoices, compact}) {
    if (!invoices?.length)
        return <div className="dimmed text-small text-center space">(No invoices yet)</div>

    if (compact)
        return <div className="billing-invoice-list space">
            {invoices.map(({date, amount, status}) => <div key={date} className="dual-layout">
                <span className="text-small"><UtcTimestamp date={date} dateOnly/></span>
                <span className="text-small">
                    ${amount.toFixed(2)}&emsp;<span className={cn('text-tiny', statusStyles[status])}>{status}</span>
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
            {invoices.map(({date, plan, term, method, amount, status, pdf}) => <tr key={date}>
                <td data-header="Date: " className="nowrap"><UtcTimestamp date={date} dateOnly/></td>
                <td data-header="Invoice: ">{findPlan(plan)?.name || plan} · {term}</td>
                <td data-header="Method: " className="dimmed">{method || '—'}</td>
                <td data-header="Amount: " className="text-right nowrap">${amount.toFixed(2)}</td>
                <td data-header="Status: " className="text-center">
                    <span className={cn('text-tiny', statusStyles[status])}>{status}</span>
                </td>
                <td className="text-right">
                    <a href={pdf || '#'} target={pdf ? '_blank' : undefined} rel="noreferrer noopener">PDF</a>
                </td>
            </tr>)}
        </tbody>
    </table>
}