import React from 'react'
import {Dropdown} from '@stellar-expert/ui-framework'

export function TypeEditor({value, setValue}) {
    if (!setValue) {
        const option = typeEditorOptions.find(opt => opt.value === value)
        return <span>{option ? option.title : 'Unknown operation type'}</span>
    }

    return <Dropdown title="Choose operation type" expanded onChange={setValue}
                     options={typeEditorOptions.map(({title, value}) => ({value, title}))}/>
}

const typeEditorOptions = [
    {
        title: 'Group: payments',
        description: 'Including CreateAccount, AccountMerge, Payment, PathPaymentStrictReceive, PathPaymentStrictSend, CreateClaimableBalance, ClaimClaimableBalance, Clawback, ClawbackClaimableBalance, Inflation operations',
        value: 'payments'
    },
    {
        title: 'Group: trustlines',
        description: 'Including ChangeTrust, AllowTrust, SetTrustLineFlags operations',
        value: 'trustlines'
    },
    {
        title: 'Group: DEX trading',
        description: 'Including ManageSellOffer, ManageBuyOffer, CreatePassiveSellOffer, LiquidityPoolDeposit, LiquidityPoolWithdraw operations',
        value: 'dex'
    },
    {
        title: 'Group: account settings',
        description: 'Including CreateAccount, SetOptions, ChangeTrust, AllowTrust, AccountMerge, Inflation, ManageData, BumpSequence, BeginSponsoringFutureReserves, EndSponsoringFutureReserves, RevokeSponsorship, SetTrustLineFlags operations',
        value: 'settings'
    },
    {
        title: 'Group: smart contracts',
        description: 'Including InvokeHostFunction, BumpFootprintExpiration, RestoreFootprint operations',
        value: 'soroban'
    },
    {
        title: 'CreateAccount',
        value: '0'
    },
    {
        title: 'Payment',
        value: '1'
    },
    {
        title: 'PathPaymentStrictReceive',
        value: '2'
    },
    {
        title: 'ManageSellOffer',
        value: '3'
    },
    {
        title: 'CreatePassiveSellOffer',
        value: '4'
    },
    {
        title: 'SetOptions',
        value: '5'
    },
    {
        title: 'ChangeTrust',
        value: '6'
    },
    {
        title: 'AllowTrust',
        value: '7'
    },
    {
        title: 'AccountMerge',
        value: '8'
    },
    {
        title: 'Inflation',
        value: '9'
    },
    {
        title: 'ManageData',
        value: '10'
    },
    {
        title: 'BumpSequence',
        value: '11'
    },
    {
        title: 'ManageBuyOffer',
        value: '12'
    },
    {
        title: 'PathPaymentStrictSend',
        value: '13'
    },
    {
        title: 'CreateClaimableBalance',
        value: '14'
    },
    {
        title: 'ClaimClaimableBalance',
        value: '15'
    },
    {
        title: 'BeginSponsoringFutureReserves',
        value: '16'
    },
    {
        title: 'EndSponsoringFutureReserves',
        value: '17'
    },
    {
        title: 'RevokeSponsorship',
        value: '18'
    },
    {
        title: 'Clawback',
        value: '19'
    },
    {
        title: 'ClawbackClaimableBalance',
        value: '20'
    },
    {
        title: 'SetTrustLineFlags',
        value: '21'
    },
    {
        title: 'LiquidityPoolDeposit',
        value: '22'
    },
    {
        title: 'LiquidityPoolWithdraw',
        value: '23'
    },
    {
        title: 'InvokeHostFunction',
        value: '24'
    },
    {
        title: 'BumpFootprintExpiration',
        value: '25'
    },
    {
        title: 'RestoreFootprint',
        value: '26'
    }
]