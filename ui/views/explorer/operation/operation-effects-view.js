import React from 'react'
import PropTypes from 'prop-types'
import {Spoiler, useDependantState, loadOperationEffects} from '@stellar-expert/ui-framework'
import EffectDetailsView from '../effect/effect-details-view'

const effectTypes = {
    //account effects
    account_created: 'Account created',
    account_removed: 'Account removed',
    account_credited: 'Account credited',
    account_debited: 'Account debited',
    account_thresholds_updated: 'Account thresholds set',
    account_home_domain_updated: 'Account home domain set',
    account_flags_updated: 'Account flags updated',
    account_inflation_destination_updated: 'Account inflation destination set',
    //signer effects
    signer_created: 'Signer created',
    signer_removed: 'Signer removed',
    signer_updated: 'Signer updated',
    //trustline effects
    trustline_created: 'Trustline created',
    trustline_removed: 'Trustline removed',
    trustline_updated: 'Trustline updated',
    trustline_authorized: 'Trustline authorized',
    trustline_deauthorized: 'Trustline deauthorized',
    trustline_authorized_to_maintain_liabilities: 'Trustline authorized to maintain liabilities',
    trustline_flags_updated: 'Trustline flags updated',
    //trading effects
    offer_created: 'Offer created',
    offer_removed: 'Offer removed',
    offer_updated: 'Offer updated',
    trade: 'Trade',
    //data effects
    data_created: 'Data entry added',
    data_removed: 'Data entry deleted',
    data_updated: 'Data entry updated',
    sequence_bumped: 'Sequence bumped',
    //claimable balance effects
    claimable_balance_created: 'Claimable balance created',
    claimable_balance_claimant_created: 'Claimable balance claimant created',
    claimable_balance_claimed: 'Claimable balance claimed',
    //sponsorship effects
    account_sponsorship_created: 'Account sponsorship created',
    account_sponsorship_updated: 'Account sponsorship updated',
    account_sponsorship_removed: 'Account sponsorship removed',
    trustline_sponsorship_created: 'Trustline sponsorship created',
    trustline_sponsorship_updated: 'Trustline sponsorship updated',
    trustline_sponsorship_removed: 'Trustline sponsorship removed',
    data_sponsorship_created: 'Account data sponsorship created',
    data_sponsorship_updated: 'Account data sponsorship updated',
    data_sponsorship_removed: 'Account data sponsorship removed',
    claimable_balance_sponsorship_created: 'Claimable balance sponsorship created',
    claimable_balance_sponsorship_updated: 'Claimable balance sponsorship updated',
    claimable_balance_sponsorship_removed: 'Claimable balance sponsorship removed',
    signer_sponsorship_created: 'Account signer sponsorship created',
    signer_sponsorship_updated: 'Account signer sponsorship updated',
    signer_sponsorship_removed: 'Account signer sponsorship removed',
    claimable_balance_clawed_back: 'Claimable balance clawbacked',
    liquidity_pool_deposited: 'Deposited to liquidity pool',
    liquidity_pool_withdrew: 'Withdrew from liquidity pool',
    liquidity_pool_trade: 'Trade',
    liquidity_pool_created: 'Liquidity pool created',
    liquidity_pool_removed: 'Liquidity pool removed',
    liquidity_pool_revoked: 'Stake revoked from liquidity pool'
}

function OperationEffectsListView({operation, effects}) {
    if (!effects) return <div className="loader micro"/>
    if (!effects.length) return <div className="dimmed">
        &emsp;&emsp;(Yielded no effects)
    </div>
    effects = effects.filter(e => !(e.type === 'trade' && e.account !== operation.source_account))
    return <ol>
        {effects.map(e => <li key={e.id}>
            <span>{effectTypes[e.type]} - <EffectDetailsView effect={e} operation={operation}/></span>
        </li>)}
    </ol>
}

function OperationEffectsView({operation, children}) {
    const [showEffects, setShowEffects] = useDependantState(false, [operation])
    const [effects, updateEffects] = useDependantState(null, [operation])

    function handleSpoilerClick({expanded}) {
        if (!expanded) return setShowEffects(false)
        setShowEffects(true)
        if (!effects) {
            loadOperationEffects(operation.id)
                .then(res => updateEffects(res))
        }
    }

    return <>
        <Spoiler micro active expanded={showEffects} showLess="Hide operation effects" showMore="Show operation effects"
                 onChange={handleSpoilerClick} style={{margin: '0 0.3em 0 -0.2em'}}/>
        {children}
        {showEffects && <OperationEffectsListView operation={operation} effects={effects}/>}
    </>
}

OperationEffectsView.propTypes = {
    operation: PropTypes.object.isRequired
}

export default OperationEffectsView