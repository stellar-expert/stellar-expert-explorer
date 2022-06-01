import {approximatePrice} from '@stellar-expert/formatter'

export function convertApiOperation(op) {
    const data = {type: op.type, source: op.accounts[0]}
    switch (op.type) {
        case 0:
            return Object.assign(data, {
                destination: op.accounts[1],
                startingBalance: op.amount
            })
        case 1:
            return Object.assign(data, {
                destination: op.accounts[1],
                asset: op.assets[0],
                amount: op.amount
            })
        case 2:
            return Object.assign(data, {
                destination: op.accounts[op.accounts.length - 1],
                sourceAsset: op.assets[0],
                sourceAmount: op.source_amount,
                sourceMax: op.source_max,
                destAsset: op.assets[op.assets.length - 1],
                destAmount: op.amount,
                amount: op.amount
            })
        case 3:
            return Object.assign(data, {
                offerId: op.offer,
                createdOffer: op.createdOffer,
                sellingAsset: op.assets[0],
                buyingAsset: op.assets[1],
                price: approximatePrice(op.price),
                amount: op.source_amount
            })
        case 4:
            return Object.assign(data, {
                offerId: op.offer,
                createdOffer: op.createdOffer,
                sellingAsset: op.assets[0],
                buyingAsset: op.assets[1],
                price: approximatePrice(op.price),
                amount: op.source_amount
            })
        case 6:
            return Object.assign(data, {
                asset: op.assets[0],
                limit: op.amount
            })
        case 7:
            return Object.assign(data, {
                destination: op.accounts[1],
                asset: op.assets[0],
                authorized: op.authorized
            })
        case 8:
            return Object.assign(data, {
                destination: op.accounts[1]
            })
        case 12:
            return Object.assign(data, {
                offerId: op.offer,
                createdOffer: op.createdOffer,
                sellingAsset: op.assets[0],
                buyingAsset: op.assets[1],
                price: approximatePrice(op.price),
                amount: op.amount
            })
        case 13:
            return Object.assign(data, {
                destination: op.accounts[op.accounts.length - 1],
                sourceAsset: op.assets[0],
                sourceAmount: op.source_amount,
                destAsset: op.assets[op.assets.length - 1],
                destAmount: op.amount,
                destMin: op.dest_min,
                amount: op.amount
            })
        case 14:
            return Object.assign(data, {
                asset: op.assets[0],
                amount: op.amount,
                claimants: op.claimants
            })
        case 15:
            return Object.assign(data, {
                balanceId: op.balanceId
            })
        case 16:
            return Object.assign(data, {
                destination: op.accounts[1]
            })
        case 18:
            return Object.assign(data, {
                revoke: op.revoke
            })
        case 19:
            return Object.assign(data, {
                asset: op.assets[0],
                amount: op.amount,
                from: op.accounts[0]
            })
        case 20:
            return Object.assign(data, {
                balanceId: op.balanceId
            })
        case 21:
            return Object.assign(data, {
                destination: op.accounts[1],
                asset: op.assets[0]
            })
        case 22:
            return Object.assign(data, {
                poolId: op.pool,
                assets: op.assets,
                maxAmount: op.max_amount,
                minPrice: approximatePrice(op.price[0]),
                maxPrice: approximatePrice(op.price[1])
            })
        case 23:
            return Object.assign(data, {
                poolId: op.pool,
                assets: op.assets,
                shares: op.amount,
                minAmount: op.min_amount
            })
        case 5:
        case 9:
        case 10:
        case 11:
        case 17:
            return data
    }
    throw new Error('Unknown operation type: ' + type)
}