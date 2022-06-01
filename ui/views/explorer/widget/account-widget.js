import React from 'react'
import {AccountAddress} from '@stellar-expert/ui-framework'
import ErrorNotificationBlock from '../../components/error-notification-block'
import AccountBasicPropertiesView from '../account/account-basic-properties-view'
import AccountBalanceView from '../account/account-current-balances-view'
import AccountBalanceChartView from '../account/charts/account-balance-chart-view'
import Widget from './widget'
import {useCompositeAccountInfo} from '../../../business-logic/api/account-api'
import {useRouteMatch} from 'react-router'

function AccountHeader({account, title}) {
    if (!account.address) return
    return <h2>
        <span className="dimmed">Stellar Account {title}</span>{' '}
        <AccountAddress account={account.address} chars={12}/>
        <hr className="micro-space"/>
    </h2>
}

export default function AccountWidget() {
    const {params} = useRouteMatch(),
        {snippet, id: address} = params,
        {data, loaded} = useCompositeAccountInfo(address)
    if (!loaded) return null
    if (data.nonExistentAccount)
        return <ErrorNotificationBlock>
            The account does not exist on Stellar ledger.
        </ErrorNotificationBlock>

    switch (snippet) {
        case 'summary':
            return <Widget>
                <AccountHeader account={data} title="Summary"/>
                <dl>
                    <AccountBasicPropertiesView account={data}/>
                </dl>
            </Widget>
        case 'balances':
            return <Widget>
                <AccountHeader account={data} title="Balances"/>
                <AccountBalanceView account={data}/>
            </Widget>
        case 'balance-chart':
            return <Widget center>
                <AccountHeader account={data} title="Balance History"/>
                <AccountBalanceChartView account={data} noTitle/>
            </Widget>
    }
    return <ErrorNotificationBlock>Invalid widget request</ErrorNotificationBlock>
}