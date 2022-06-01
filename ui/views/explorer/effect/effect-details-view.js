import React from 'react'
import PropTypes from 'prop-types'
import {AssetLink, Amount, AccountAddress, OfferLink} from '@stellar-expert/ui-framework'
import {AssetDescriptor, parseAssetFromObject} from '@stellar-expert/asset-descriptor'
import {shortenString, formatWithAutoPrecision} from '@stellar-expert/formatter'

export default function EffectDetailsView({effect, operation}) {
    let account = <AccountAddress account={effect.account} chars={8}/>
    switch (effect.type) {
        case 'account_created':
            return <span>{account} with starting balance <Amount asset="XLM" amount={effect.starting_balance}/></span>
        case 'account_removed':
            return <span>Account {account} removed</span>
        case 'account_credited': {
            const amount = <Amount asset={parseAssetFromObject(effect)} amount={effect.amount}/>
            if (operation.type_i === 9)
                return <span>Inflation reward {amount} distributed to {account}</span>
            const destination = operation.to || operation.into || retrieveIngestedOperationAccount(operation, -1) || effect.account
            if (effect.asset_issuer === destination)
                return <span>{amount} returned to the issuing account {account}</span>
            return <span>{amount} transferred to {account}</span>
        }
        case 'account_debited':
            const amount = <Amount asset={parseAssetFromObject(effect)} amount={effect.amount}/>
            const source = operation.from || operation.source_account || retrieveIngestedOperationAccount(0)
            if (effect.asset_issuer === source)
                return <span>{amount} issued by {account}</span>
            return <span>{amount} transferred from {account}</span>
        case 'account_thresholds_updated':
            return <span>
                New thresholds: {Object.keys(effect)
                .filter(key => key.indexOf('_threshold') > 0)
                .map(key => key.split('_')[0] + '=' + effect[key])
                .join(', ')}
                </span>
        case 'account_home_domain_updated':
            return <span>Home domain: <a href={'https://' + effect.home_domain} target="_blank"
                                         rel="noreferrer noopener">{effect.home_domain}</a></span>
        case 'account_flags_updated':
            let flags = Object.keys(effect)
                .filter(key => key.indexOf('_flag') > 0)
                .map(key => key.toUpperCase() + ': ' + effect[key])
                .join(', ')
            return <span>
                {flags || '(no changes)'}
                </span>
        case 'account_inflation_destination_updated':
            return <span>
                    Inflation destination updated.
                </span>
        case 'signer_created':
        case 'signer_updated':
            return <span><AccountAddress account={effect.public_key} chars={8}/> with weight {effect.weight}</span>
        case 'signer_removed':
            return <span><AccountAddress account={effect.public_key} chars={8}/></span>
        case 'trustline_created':
        case 'trustline_updated':
            return <span>
                trust limit: <Amount asset={parseAssetFromObject(effect)} amount={effect.limit}/>
            </span>
        case 'trustline_removed':
            return <span><AssetLink asset={parseAssetFromObject(effect)}/> trustline removed</span>
        case 'trustline_authorized':
        case 'trustline_deauthorized':
        case 'trustline_authorized_to_maintain_liabilities': {
            let action = (effect.type_i === 23 || effect.type_i === 25) ? 'authorized' : 'deauthorized',
                asset = <AssetLink asset={parseAssetFromObject(effect)}/>
            return <span>
                {account} {action} {asset} trustline for account <AccountAddress account={effect.trustor} chars={8}/>
            </span>
        }
        case 'trustline_flags_updated': {
            let flags = []
            if (effect.authorized_flag) {
                flags.push('"authorized"')
            }
            if (effect.authorized_to_maintain_liabilites_flag) {
                flags.push('"authorized to maintain liabilites"')
            }
            if (effect.clawback_enabled_flag) {
                flags.push('"clawback enabled"')
            }
            let asset = <AssetLink
                asset={parseAssetFromObject(effect)}/>
            return <span>
                {account} set {asset} trustline flags [{flags.join(', ')}] for account <AccountAddress
                account={effect.trustor} chars={8}/>
            </span>
        }
        case 'offer_created':
        case 'offer_removed':
        case 'offer_updated':
            return <span className="dimmed">(offer effects not implemented in Horizon)</span>
        case 'trade':
            return <span>
                <AccountAddress account={effect.account} chars={8}/> exchanged{' '}
                <Amount asset={parseAssetFromObject(effect, 'sold_')} amount={effect.sold_amount}/>{' '}
                <span className="icon icon-shuffle color-primary"/>{' '}
                <Amount asset={parseAssetFromObject(effect, 'bought_')} amount={effect.bought_amount}/>{' '}
                (DEX offer <OfferLink offer={effect.offer_id}/> by <AccountAddress account={effect.seller}/>)
            </span>
        case 'data_created':
        case 'data_updated':
            return <span
                className="word-break condensed text-small"><code>"{effect.name}"</code> = <code>"{effect.value}"</code></span>
        case 'data_removed':
            return <span><span
                className="word-break condensed text-small"><code>"{effect.name}"</code></span> removed</span>
        case 'sequence_bumped':
            return <span>to sequence {effect.new_seq}</span>
        case 'claimable_balance_created':
            return <span>
                balance <Amount asset={AssetDescriptor.parse(effect.asset)} amount={effect.amount}/> created by{' '}
                {account}
            </span>
        case 'claimable_balance_claimant_created':
            return <span>
                claimant {account} with condition{' '}
                <span>{JSON.stringify(effect.predicate)}</span>
            </span>
        case 'claimable_balance_claimed':
            return <span>
                claimed by {account}
            </span>
        case 'account_sponsorship_created':
        case 'account_sponsorship_updated':
            return <span>
                <AccountAddress account={effect.sponsor} chars={8}/> sponsored account base reserve for{' '}
                <AccountAddress account={effect.account} chars={8}/>
            </span>
        case 'account_sponsorship_removed':
            return <span>
                <AccountAddress account={effect.former_sponsor} chars={8}/> revoked account sponsorship for{' '}
                <AccountAddress account={effect.account} chars={8}/>
            </span>
        case 'trustline_sponsorship_created':
        case 'trustline_sponsorship_updated':
            return <span>
                <AccountAddress account={effect.sponsor} chars={8}/> sponsored{' '}
                <AssetLink asset={AssetDescriptor.parse(effect.asset)}/> trustline reserve for{' '}
                <AccountAddress account={effect.account} chars={8}/>
            </span>
        case 'trustline_sponsorship_removed':
            return <span>
                <AccountAddress account={effect.former_sponsor} chars={8}/> revoked{' '}
                <AssetLink asset={AssetDescriptor.parse(effect.asset)}/> trustline sponsorship for{' '}
                <AccountAddress account={effect.account} chars={8}/>
            </span>
        case 'data_sponsorship_created':
        case 'data_sponsorship_updated':
            return <span>
                <AccountAddress account={effect.sponsor} chars={8}/> sponsored {shortenString(effect.data_name)}{' '}
                account data reserve for <AccountAddress account={effect.account} chars={8}/>
            </span>
        case 'data_sponsorship_removed':
            return <span>
                <AccountAddress account={effect.former_sponsor} chars={8}/> revoked{' '}
                {shortenString(effect.data_name)} account data sponsorship for{' '}
                <AccountAddress account={effect.account} chars={8}/>
            </span>
        case 'claimable_balance_sponsorship_created':
        case 'claimable_balance_sponsorship_updated':
            return <span>
                <AccountAddress account={effect.sponsor} chars={8}/> sponsored balance{' '}
                {shortenString(effect.balance_id.replace(/^0{8}/, ''))}
                {effect.account !== effect.sponsor && <> for <AccountAddress account={effect.account} chars={8}/>
                </>}
            </span>
        case 'claimable_balance_sponsorship_removed':
            return <span>
                <AccountAddress account={effect.sponsor} chars={8}/> revoked{' '}
                {shortenString(effect.balance_id.replace(/^0{8}/, ''))} balance sponsorship{' '}
                {effect.account !== effect.sponsor && <> for <AccountAddress account={effect.account} chars={8}/>
                </>}
            </span>
        case 'signer_sponsorship_created':
        case 'signer_sponsorship_updated':
            return <span>
                <AccountAddress account={effect.sponsor} chars={8}/> sponsored signer{' '}
                <AccountAddress account={effect.signer} chars={8}/>{' '}
                for <AccountAddress account={effect.account} chars={8}/>
            </span>
        case 'signer_sponsorship_removed':
            return <span>
                <AccountAddress account={effect.former_sponsor} chars={8}/> revoked signer{' '}
                <AccountAddress account={effect.signer} chars={8}/> sponsorship{' '}
                for <AccountAddress account={effect.account} chars={8}/>
            </span>
        case 'claimable_balance_clawed_back':
            return <span>
                balance {shortenString(effect.balance_id.replace(/^0{8}/, ''))}{' '}
                clawbacked by {account}
            </span>
        case 'liquidity_pool_deposited':
            const deposited = effect.reserves_deposited
            return <span>
                <Amount asset={deposited[0].asset} amount={deposited[0].amount}/>{' '}
                and <Amount asset={deposited[1].asset} amount={deposited[1].amount}/> deposited to{' '}
                <AssetLink asset={effect.liquidity_pool.id}/> <i className="icon icon-shuffle"/>{' '}
                {formatWithAutoPrecision(effect.shares_received)} pool shares
            </span>
        case 'liquidity_pool_withdrew':
            const received = effect.reserves_received
            return <span>
                {formatWithAutoPrecision(effect.shares_redeemed)} pool shares <i className="icon icon-shuffle"/>{' '}
                <Amount asset={received[0].asset} amount={received[0].amount}/>{' '}
                and <Amount asset={received[1].asset} amount={received[1].amount}/> withdrawn from{' '}
                <AssetLink asset={effect.liquidity_pool.id}/> pool
            </span>
        case 'liquidity_pool_trade':
            return <span>
                <AccountAddress account={effect.account} chars={8}/> swapped{' '}
                <Amount asset={AssetDescriptor.parse(effect.bought.asset)} amount={effect.bought.amount}/>{' '}
                <span className="icon icon-shuffle color-primary"/>{' '}
                <Amount asset={AssetDescriptor.parse(effect.sold.asset)} amount={effect.sold.amount}/>{' '}
                on <AssetLink asset={effect.liquidity_pool.id}/> pool
            </span>
        case 'liquidity_pool_created':
            const {reserves, id} = effect.liquidity_pool
            return <span>
                <AssetLink asset={id}/> with reserves{' '}
                <Amount asset={reserves[0].asset} amount={reserves[0].amount}/> and{' '}
                <Amount asset={reserves[1].asset} amount={reserves[1].amount}/>
            </span>
        case 'liquidity_pool_removed':
            return <span>
                <AssetLink asset={effect.liquidity_pool_id}/> removed
            </span>
        case 'liquidity_pool_revoked':
            const revoked = effect.reserves_revoked
            return <span>
                {formatWithAutoPrecision(effect.shares_revoked)} shares{' '}
                <Amount asset={revoked[0].asset} amount={revoked[0].amount}/>{' '}
                and <Amount asset={revoked[1].asset} amount={revoked[1].amount}/> revoked from{' '}
                <AssetLink asset={effect.liquidity_pool.id}/> <i className="icon icon-shuffle"/>
            </span>
    }

    return null
}

EffectDetailsView.propTypes = {
    effect: PropTypes.object.isRequired
}

function retrieveIngestedOperationAccount(operation, index) {
    if (!operation.accounts) return null
    if (index < 0) return operation.accounts[operation.accounts.length - index]
    return operation.accounts[index]
}