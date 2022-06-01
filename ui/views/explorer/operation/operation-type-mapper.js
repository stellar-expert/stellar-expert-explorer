const mapping = {
    0: 'CreateAccount',
    1: 'Payment',
    2: 'PathPaymentStrictReceive',
    3: 'ManageSellOffer',
    4: 'CreatePassiveSellOffer',
    5: 'SetOptions',
    6: 'ChangeTrust',
    7: 'AllowTrust',
    8: 'AccountMerge',
    9: 'Inflation',
    10: 'ManageData',
    11: 'BumpSequence',
    12: 'ManageBuyOffer',
    13: 'PathPaymentStrictReceive',
    14: 'CreateClaimableBalance',
    15: 'ClaimClaimableBalance',
    16: 'BeginSponsoringFutureReserves',
    17: 'EndSponsoringFutureReserves',
    18: 'RevokeSponsorship',
    19: 'Clawback',
    20: 'ClawbackClaimClaimableBalance',
    21: 'SetTrustLineFlags',
    22: 'LiquidityPoolDeposit',
    23: 'LiquidityPoolWithdraw'
}

function decodeOperationType(type) {
    return mapping[type]
}

module.exports = decodeOperationType