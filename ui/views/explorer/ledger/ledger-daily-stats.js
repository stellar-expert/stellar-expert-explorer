import React from 'react'
import {Amount, UpdateHighlighter} from '@stellar-expert/ui-framework'
import EmbedWidgetTrigger from '../widget/embed-widget-trigger'
import {use24hLedgerStats} from '../../../business-logic/api/ledger-stats-api'

export default function LedgerDailyStatsView({title = '24h Ledger Statistics'}) {
    const {loaded, data} = use24hLedgerStats(true)
    if (!loaded || data?.error)
        return <div className="loader"/>
    return <>
        <h3>
            {title}<EmbedWidgetTrigger path="network-activity/24h" title="Stellar Network 24h Stats"/>
        </h3>
        <hr className="flare"/>
        <dl>
            <dt>Total accounts:</dt>
            <dd><UpdateHighlighter><Amount amount={data.accounts}/></UpdateHighlighter></dd>

            {/*<dt>Daily active accounts:</dt>
            <dd><UpdateHighlighter><Amount amount={data.daily_active_accounts}/></UpdateHighlighter></dd>*/}

            <dt>Average ledger time:</dt>
            <dd><UpdateHighlighter>{data.avg_ledger_time}s</UpdateHighlighter></dd>

            {data.new_assets > 0 && <>
                <dt>New assets issued:</dt>
                <dd><UpdateHighlighter><Amount amount={data.new_assets}/></UpdateHighlighter></dd>
            </>}

            <dt>Processed operations:</dt>
            <dd><UpdateHighlighter><Amount amount={data.operations}/></UpdateHighlighter></dd>

            <dt>Payments:</dt>
            <dd><UpdateHighlighter><Amount amount={data.payments}/></UpdateHighlighter></dd>

            <dt>DEX trades:</dt>
            <dd><UpdateHighlighter><Amount amount={data.trades}/></UpdateHighlighter></dd>

            <dt>DEX volume:</dt>
            <dd><UpdateHighlighter><Amount amount={data.volume} adjust round asset="XLM" issuer={false}/></UpdateHighlighter></dd>
        </dl>
    </>
}