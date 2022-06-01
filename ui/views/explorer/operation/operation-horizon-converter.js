import React from 'react'
import {AssetDescriptor, parseAssetFromObject} from '@stellar-expert/asset-descriptor'

export function convertHorizonOperation(op) {
    function parseAccount(field) {
        return op[field + '_muxed'] || op[field]
    }

    const data = {type: op.type_i, source: parseAccount('source_account')}

    switch (op.type_i) {
        case 0:
            return Object.assign(data, {
                destination: op.account,
                startingBalance: op.starting_balance
            })
        case 1:
            return Object.assign(data, {
                destination: parseAccount('to'),
                amount: op.amount,
                asset: parseAssetFromObject(op)
            })
        case 2:
            return Object.assign(data, {
                destination: parseAccount('to'),
                sourceAmount: op.source_amount,
                sourceAsset: parseAssetFromObject(op, 'source_'),
                sourceMax: op.source_max,
                destAmount: op.amount,
                destAsset: parseAssetFromObject(op)
            })
        case 3:
            return Object.assign(data, {
                sellingAsset: parseAssetFromObject(op, 'selling_'),
                buyingAsset: parseAssetFromObject(op, 'buying_'),
                amount: op.amount,
                price: op.price,
                offerId: op.offer_id
            })
        case 4:
            return Object.assign(data, {
                sellingAsset: parseAssetFromObject(op, 'selling_'),
                buyingAsset: parseAssetFromObject(op, 'buying_'),
                amount: op.amount,
                price: op.price,
                offerId: op.offer_id
            })
        case 5:
            return Object.assign({}, op, data)
        case 6:
            data.limit = op.limit
            data.asset = parseAssetFromObject(op)
            return data
        case 7:
            return Object.assign(data, {
                destination: op.trustor,
                authorized: !!op.authorize,
                asset: parseAssetFromObject(op)
            })
        case 8:
            return Object.assign(data, {
                destination: parseAccount('into')
            })
        case 9:
            return data
        case 10:
            return Object.assign(data, {
                name: op.name,
                value: op.value
            })
        case 11:
            return Object.assign(data, {
                to: op.bump_to
            })
        case 12:
            return Object.assign(data, {
                sellingAsset: parseAssetFromObject(op, 'selling_'),
                buyingAsset: parseAssetFromObject(op, 'buying_'),
                amount: op.amount,
                price: op.price,
                offerId: op.offer_id
            })
        case 13:
            return Object.assign(data, {
                destination: parseAccount('to'),
                sourceAmount: op.source_amount,
                sourceAsset: parseAssetFromObject(op, 'source_'),
                destMin: op.destination_min,
                destAmount: op.amount,
                destAsset: parseAssetFromObject(op)
            })
        case 14:
            return Object.assign(data, {
                asset: parseAssetFromObject(op),
                amount: op.amount,
                claimants: op.claimants
            })
        case 15:
            return Object.assign(data, {
                balanceId: op.balance_id.substr(8)
            })
        case 16:
            return Object.assign(data, {
                destination: op.sponsored_id
            })
        case 17:
            return data
        case 18:
            return Object.assign(data, {
                revoke: (function parseRevokeDetails() {
                    if (op.signer_key)
                        return {type: 'sponsorshipSigner', signerKey: op.signer_key, account: op.signer_account_id}
                    if (op.claimable_balance_id)
                        return {type: 'claimableBalance', balance: op.claimable_balance_id.substr(8)}
                    if (op.trustline_account_id)
                        return {type: 'trustline', account: op.trustline_account_id, asset: op.trustline_asset}
                    if (op.data_name)
                        return {type: 'data', dataName: op.data_name}
                    if (op.offer_id)
                        return {type: 'offer', offer: op.offer_id}
                    if (op.account_id)
                        return {type: 'account', account: op.account_id}
                })()
            })
        case 19:
            return Object.assign(data, {
                from: op.from,
                amount: op.amount,
                asset: parseAssetFromObject(op)
            })
        case 20:
            return Object.assign(data, {
                balanceId: op.balance_id.substr(8)
            })
        case 21:
            return Object.assign(data, {
                asset: parseAssetFromObject(op),
                destination: op.trustor,
                setFlags: (op.set_flags || []).reduce((f, c) => c | f, 0),
                clearFlags: (op.clear_flags || []).reduce((f, c) => c | f, 0)
            })
        case 22:
            return Object.assign(data, {
                poolId: op.liquidity_pool_id,
                assets: [AssetDescriptor.parse(op.reserves_max[0].asset), AssetDescriptor.parse(op.reserves_max[1].asset)],
                maxAmount: [op.reserves_max[0].amount, op.reserves_max[1].amount],
                minPrice: op.min_price,
                maxPrice: op.max_price
            })
        case 23:
            return Object.assign(data, {
                poolId: op.liquidity_pool_id,
                assets: [AssetDescriptor.parse(op.reserves_min[0].asset), AssetDescriptor.parse(op.reserves_min[1].asset)],
                shares: op.shares,
                minAmount: [op.reserves_min[0].amount, op.reserves_min[1].amount]
            })
    }
}
