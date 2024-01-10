import React from 'react'
import {AccountAddress, BlockSelect, UtcTimestamp, InfoTooltip as Info, withErrorBoundary} from '@stellar-expert/ui-framework'
import {useResolvedFederationName} from '../../../util/federation-hooks'
import ContractStorageInfo from '../../components/contract-storage-info'
import AccountAuthorizationFlags from './account-authorization-flags-view'
import LockStatus from './account-lock-status-view'

function ActivityIndexDescription() {
    return <>
        Activity index is based on the total number of payments and trades made by the account during a certain period
        of time (last month or last year).
    </>
}

export default withErrorBoundary(function AccountBasicPropertiesView({account}) {
    const {ledgerData} = account
    const federationAddress = useResolvedFederationName(account)
    return <>
        {!!ledgerData?.home_domain && <>
            <dt>Home domain:</dt>
            <dd>
                <a href={'https://' + ledgerData.home_domain.toLowerCase()} rel="noreferrer noopener"
                   target="_blank">{ledgerData.home_domain.toLowerCase()}</a>
                {ledgerData.home_domain.toLowerCase() !== ledgerData.home_domain &&
                    <span className="dimmed text-small"> set as {ledgerData.home_domain}</span>}
                <Info link="https://www.stellar.org/developers/guides/concepts/accounts.html#home-domain">A domain name
                    that can optionally be added to the account. Clients can look up a stellar.toml from this domain.
                    The federation procol can use the home domain to look up more details about a transaction’s memo or
                    address details about an account.</Info>
            </dd>
        </>}
        {!!federationAddress && <>
            <dt>Federation address:</dt>
            <dd>
                <BlockSelect>{federationAddress}</BlockSelect>
                <Info link="https://www.stellar.org/developers/guides/concepts/federation.html">The Stellar federation
                    protocol maps Stellar addresses to more information about a given user. It’s a way for Stellar
                    client software to resolve email-like addresses into account IDs.</Info>
            </dd>
        </>}
        {account.muxedId !== undefined && <>
            <dt>Multiplexed id:</dt>
            <dd>
                <BlockSelect>{account.muxedId.toString()}</BlockSelect>
                <Info link="https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0023.md">
                    <p>
                        Multiplexed address represents a standard ed25519 Stellar account address paired with a 64-bit
                        ID.
                    </p>
                    <p>
                        A common pattern in the Stellar ecosystem is for services to share a single Stellar account ID
                        across many users, relying on the memo ID to disambiguate incoming payments.
                    </p>
                    <p>
                        Multiplexed accounts provide a straightforward option to use virtual accounts instead of
                        creating many user accounts and help to solve the widespread problem caused by users who forget to
                        attach memo IDs when depositing to custodial accounts.
                    </p>
                </Info>
            </dd>
        </>}
        <dt>Total payments:</dt>
        <dd>
            {account.payments || 0}
            <Info>Overall number of payments.</Info>
        </dd>
        <dt>Total trades:</dt>
        <dd>
            {account.trades}
            <Info>Overall number of trades.</Info>
        </dd>
        {!!account.created && <>
            <dt>Created:</dt>
            <dd>
                <UtcTimestamp date={account.created}/>
                <Info>Account creation timestamp.</Info>
            </dd>
        </>}
        {!!account.creator && <>
            <dt>Created by:</dt>
            <dd>
                <AccountAddress account={account.creator} chars={8}/>
                <Info link="https://www.stellar.org/developers/guides/concepts/list-of-operations.html#create-account">
                    The account that was used to create and provide initial funding for this account.</Info>
            </dd>
        </>}
        <ContractStorageInfo stats={account}/>
        <dt>Last year activity:</dt>
        <dd>
            {account.activity.yearly}
            <Info><ActivityIndexDescription/></Info>
        </dd>
        <dt>Last month activity:</dt>
        <dd>
            {account.activity.monthly}
            <Info><ActivityIndexDescription/></Info>
        </dd>
        {!!ledgerData && <>
            <LockStatus accountInfo={ledgerData}/>
            <dt>Operation thresholds:</dt>
            <dd>
                <span title="Low threshold">{ledgerData.thresholds.low_threshold + ''}</span> /
                <span title="Medium threshold"> {ledgerData.thresholds.med_threshold + ''}</span> /
                <span title="High threshold"> {ledgerData.thresholds.high_threshold + ''}</span>
                <Info link="https://www.stellar.org/developers/guides/concepts/accounts.html#thresholds">This field
                    specifies thresholds for low-, medium-, and high-access level operations.</Info>
            </dd>
            <AccountAuthorizationFlags accountInfo={ledgerData}/>
            {/*<dt>Inflation destination:</dt>
            <dd>
                {ledgerData.inflation_destination ?
                    <AccountAddressView account={ledgerData.inflation_destination} chars={8}/> : 'not set'}
                <Info link="https://www.stellar.org/developers/guides/concepts/inflation.html">Account
                    designated to receive inflation. Every account can vote to send inflation to a destination
                    account.</Info>
            </dd>*/}
        </>}
        {/*<div>
            <span className="dimmed">Total operations: </span>{stats.total_operations}
            <Info>Total number of operations applied to the account.</Info>
        </div>*/}
        {/*<div>
            <span className="dimmed">Total trustlines established: </span>{stats.total_trustlines}
            <Info>Established asset trustlines.</Info>
        </div>*/}
    </>
})