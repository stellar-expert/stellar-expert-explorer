import React, {useState} from 'react'
import {InfoTooltip as Info} from '@stellar-expert/ui-framework'
import ErrorNotificationBlock from '../../components/error-notification-block'
import TomlInfoView from '../toml/toml-info-view'
import EmbedWidgetTrigger from '../widget/embed-widget-trigger'
import {AccountClaimableBalancesSection} from '../claimable-balance/account-claimable-balances-view'
import AccountBasicPropertiesView from './account-basic-properties-view'
import AccountIssuedAssets from './account-issued-assets-view'
import AccountSignersView from './account-signers-view'
import AccountDataEntries from './account-data-entries-view'
import AccountSponsoredInfoView from './account-sponsored-info-view'
import AccountCurrentBalancesView from './account-current-balances-view'
import AccountBalanceChart from './charts/account-balance-chart-view'
import AccountHistoryTabs from './account-history-tabs-view'

export default function AccountInfoView({account}) {
    const [selectedAsset, setSelectedAsset] = useState()
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
                    </dl>
                    <AccountIssuedAssets address={account.address}/>
                    <AccountSignersView account={account}/>
                    <AccountDataEntries account={account}/>
                    <AccountSponsoredInfoView account={account}/>
                    <AccountClaimableBalancesSection address={account.address}/>
                </div>
            </div>
            <div className="column column-50">
                <div className="card">
                    <h3>
                        Account Balance
                        <EmbedWidgetTrigger path={`account/balances/${account.address}`} title="Current Account Balance"/>
                        <Info link="https://www.stellar.org/developers/guides/concepts/accounts.html#balance">
                            The number of lumens and other assets held by the account.
                        </Info>
                    </h3>
                    <hr/>
                    <AccountCurrentBalancesView account={account} onSelectAsset={setSelectedAsset}/>
                    <div className="space">
                        <AccountBalanceChart account={account} externallySelectedAsset={selectedAsset}/>
                    </div>
                </div>
            </div>
        </div>
        {account.ledgerData && account.ledgerData.home_domain &&
            <TomlInfoView account={account.address} homeDomain={account.ledgerData.home_domain} className="card space"/>}
        <AccountHistoryTabs account={account}/>
    </div>
}