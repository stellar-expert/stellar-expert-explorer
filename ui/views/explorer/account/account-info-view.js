import React from 'react'
import ErrorNotificationBlock from '../../components/error-notification-block'
import EmbedWidgetTrigger from '../widget/embed-widget-trigger'
import AccountBasicPropertiesView from './account-basic-properties-view'
import AccountIssuedAssets from './account-issued-assets-view'
import AccountSignersView from './account-signers-view'
import AccountDataEntries from './account-data-entries-view'
import AccountSponsoredInfoView from './account-sponsored-info-view'
import AccountClaimableBalancesView from './account-claimable-balances-view'
import Info from '../../components/info-tooltip'
import AccountCurrentBalancesView from './account-current-balances-view'
import AccountBalanceChart from './charts/account-balance-chart-view'
import TomlInfoView from '../toml/toml-info-view'
import AccountHistoryTabs from './account-history-tabs-view'

export default function AccountInfoView({account}) {
    if (!account) return <div className="loader"/>
    if (account.nonExistentAccount) return <ErrorNotificationBlock>
        The account does not exist on Stellar ledger.
    </ErrorNotificationBlock>
    return <div>
        <div className="row space">
            <div className="column column-50">
                <div className="card">
                    <h3>Summary
                        <EmbedWidgetTrigger path={`account/summary/${account.address}`} title="Account Summary"/>
                    </h3>
                    <hr/>
                    <dl>
                        <AccountBasicPropertiesView account={account}/>
                        {/* <AccountStatsView account={account}/> */}
                    </dl>
                    <AccountIssuedAssets address={account.address}/>
                    <AccountSignersView account={account}/>
                    <AccountDataEntries account={account}/>
                    <AccountSponsoredInfoView account={account}/>
                    <AccountClaimableBalancesView address={account.address}/>
                </div>
            </div>
            <div className="column column-50">
                <div className="card">
                    <h3>
                        Account Balance
                        <EmbedWidgetTrigger path={`account/balances/${account.address}`}
                                            title="Current Account Balance"/>
                        <Info link="https://www.stellar.org/developers/guides/concepts/accounts.html#balance">
                            The number of lumens and other assets held by the account.
                        </Info>
                    </h3>
                    <hr/>
                    <AccountCurrentBalancesView account={account}/>
                    <div className="space">
                        <AccountBalanceChart account={account}/>
                    </div>
                </div>
            </div>
        </div>
        {account.ledgerData && account.ledgerData.home_domain &&
        <TomlInfoView account={account.address} homeDomain={account.ledgerData.home_domain} className="card space"/>}
        <AccountHistoryTabs account={account}/>
    </div>
}