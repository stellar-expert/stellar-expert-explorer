import {Asset, Keypair, Operation, Account, TransactionBuilder, Transaction} from '@stellar/stellar-base'
import {Horizon} from '@stellar/stellar-sdk'

const server = new Horizon.Server('https://horizon-testnet.stellar.org')

const XLM = Asset.native()

async function createRootAccount() {
    const rootKeypair = Keypair.random()
    const response = await fetch(
        `https://friendbot.stellar.org?addr=${rootKeypair.publicKey()}`
    )
    if (!response.ok)
        throw new Error('Unable to fund acc')
    return rootKeypair
}

function buildAssets(rootPublicKey, assetsCount = 0) {
    const assets = []
    if (assetsCount > 0) {
        for (let i = 0; i < assetsCount; i++) {
            assets.push(new Asset(`ASSET${i}`, rootPublicKey))
        }
    }
    return assets
}

/**
 * @typedef {Object} MultiSig
 * @property {Number} masterWeight
 * @property {Number} lowThreshold
 * @property {Number} medThreshold
 * @property {Number} highThreshold
 * @property {Number[]} signers Array of weigths. Max count is 10
 */

/**
 * Generata account data.
 * @typedef {Object} AccountData
 * @property {Number} assetsCount Number of assets to add to generated account.
 * @property {Boolean} createOffers Should generated account contain offers.
 * @property {Number} dataEntriesCount Data entries count.
 * @property {MultiSig} multisig Multisig data
 */


class SingleAccountBuilder {
    constructor(root, assets, accountData) {
        this.root = root
        this.assets = assets
        this.accountData = accountData
        this.keypair = Keypair.random()
    }

    async buildAccount() {
        const pubkey = this.keypair.publicKey(),
            rootPubkey = this.root.publicKey()

        //create account
        await this.__exec([Operation.createAccount({
            destination: pubkey,
            startingBalance: '175',
            source: rootPubkey
        })], rootPubkey)

        //make account multisig
        const operations = [],
            signers = []

        //create data entries
        for (let i = 0; i < this.accountData.dataEntriesCount; i++) {
            operations.push(Operation.manageData({
                name: `dateEntry${i}`,
                value: `dateEntryValue${i}`,
                source: pubkey
            }))
        }

        //create trustline, move assets and create bids or offers
        for (let i = 0; i < this.accountData.assetsCount; i++) {
            const asset = this.assets[i]
            operations.push(Operation.changeTrust({
                asset,
                source: pubkey
            }))
            operations.push(Operation.payment({
                asset,
                source: rootPubkey,
                destination: pubkey,
                amount: '100'
            }))

            if (this.accountData.createOffers) {
                //random bid or offer
                if (Math.random() >= 0.5) {
                    operations.push(Operation.manageSellOffer({
                        amount: '10',
                        price: 0.001,
                        selling: asset,
                        buying: XLM,
                        source: pubkey
                    }))
                } else {
                    operations.push(Operation.manageBuyOffer({
                        buyAmount: '10',
                        price: 0.001,
                        selling: XLM,
                        buying: asset,
                        source: pubkey
                    }))
                }
            }
        }

        if (this.accountData.multisig && this.accountData.multisig.signers.length > 0) {
            if (this.accountData.multisig.signers.length > 10)
                throw new Error('Max signers count(10) exceeded')

            for (let signerweight of this.accountData.multisig.signers) {
                const signerKeyPair = Keypair.random()
                signers.push(signerKeyPair.secret())

                operations.push(Operation.setOptions({
                    signer: {
                        ed25519PublicKey: signerKeyPair.publicKey(),
                        weight: signerweight || 1
                    },
                    source: pubkey
                }))
            }

            let highTrahshold = this.accountData.multisig.highThreshold || this.accountData.multisig.signers.length
            operations.push(Operation.setOptions({
                masterWeight: this.accountData.multisig.masterWeight || 1,
                lowThreshold: this.accountData.multisig.lowThreshold || 1,
                medThreshold: this.accountData.multisig.medThreshold || 1,
                highThreshold: highTrahshold,
                source: pubkey
            }))
        } else {
            signers.push(this.keypair.secret())
        }

        await this.__exec(operations)

        this.pubkey = pubkey
        this.signers = signers
    }

    toObject() {
        return {
            pubkey: this.pubkey,
            master: this.keypair.secret(),
            signers: this.signers,
            setup: this.accountData
        }
    }

    async __exec(operations, source) {
        //while we have transactions to execute
        while (operations.length > 0) {
            let operationsBatch = null
            if (operations.length > 100) //100 is max operations per transaction
                operationsBatch = operations.splice(0, 100)
            else
                operationsBatch = operations.splice(0, operations.length)

            await this.__buildAndSubmitTransaction(operationsBatch, source)
        }
    }

    async __loadAccountRecord(source) {
        return await server.accounts()
            .accountId(source)
            .call()
    }

    async __getSourceAccount(source) {
        return new Account(source, (await this.__loadAccountRecord(source)).sequence)
    }

    /**
     * Signs specified transaction
     * @param {Transaction} transaction Transaction to sign
     */
    async __signTransaction(transaction) {

        const allSources = transaction.operations.filter((value, index, self) => self.indexOf(value) === index)
            .map(o => o.source)

        if (allSources.indexOf(this.root.publicKey()) !== -1)
            transaction.sign(this.root)
        if (allSources.indexOf(this.keypair.publicKey()) !== -1)
            transaction.sign(this.keypair)
    }

    /**
     * Signs and submits specified transaction to network
     * @param {Transaction} transaction Transaction to sign
     */
    async __signAndSubmitTransaction(transaction) {
        await this.__signTransaction(transaction)
        return await server.submitTransaction(transaction)
    }

    /**
     * Builds transaction
     * @param {Operation[]} operations Array of operations to execute
     */
    async __buildTransaction(operations, source) {
        const account = await this.__getSourceAccount(source || this.keypair.publicKey())
        const fee = await server.fetchBaseFee()
        const transactionBuilder = new TransactionBuilder(account, {
            fee
        })

        for (let operation of operations) {
            transactionBuilder.addOperation(operation)
        }
        const transaction = transactionBuilder.setTimeout(100).build()
        return transaction
    }

    /**
     * Builds transaction, signs and submits it
     * @param {Operation[]} operations Array of operations to execute
     */
    async __buildAndSubmitTransaction(operations, source) {
        const transaction = await this.__buildTransaction(operations, source)
        return await this.__signAndSubmitTransaction(transaction)
    }
}


/**
 * @param {AccountData[]} accountsData
 */
async function buildTestAccounts(accountsData) {

    if (accountsData.length > 50)
        throw new Error('Account data count exceeded 50')

    const root = await createRootAccount()
    const rootPublicKey = root.publicKey()

    const assets = buildAssets(rootPublicKey, Math.max(...accountsData.map(ad => ad.assetsCount || 0)))

    const accounts = []
    for (let i = 0; i < accountsData.length; i++) {
        const singleAccountBuilder = new SingleAccountBuilder(root, assets, accountsData[i])
        await singleAccountBuilder.buildAccount()
        accounts.push(singleAccountBuilder.toObject())
    }

    return {
        rootAccount: root,
        accounts: accounts
    }
}

/*buildTestAccounts([{
    assetsCount: 2,
    createOffers: true,
    dataEntriesCount: 2,
    multisig: {
        highThreshold: 2,
        medThreshold: 2,
        lowThreshold: 1,
        masterWeight: 2,
        signers: [1, 1]
    }
}])
    .then(res => console.log(JSON.stringify(res, null, '  ')))*/

export {buildTestAccounts}