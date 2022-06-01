import {Account, Transaction, Operation, TransactionBuilder, Keypair, Memo, Asset, Server} from 'stellar-sdk'
import {adjustPrecision} from '@stellar-expert/formatter'
import appSettings from '../../app-settings'

/**
 * @callback DemolisherStatusChange
 * @param {String} status - Current status.
 * @param {String} balance - Current account balance.
 * @param {Boolean} finished - If true, the merge is finished.
 * @param {Error} [error] - Error if any.
 */

const XLM = Asset.native()

function retrieveAsset({asset_code, asset_issuer}) {
    if (!asset_issuer) return XLM
    return new Asset(asset_code, asset_issuer)
}

class DemolisherTxBuilder {
    /**
     * Creates the demolisher instance.
     * @param {Object} settings - Demolisher settings. , horizon, networkPassphrase, mediator, demolisherEndpoint, baseFee
     * @param {String} settings.source - The public key of the account to be merged.
     * @param {String[]} settings.signers - All account signers' secret keys.
     * @param {DemolisherStatusChange} settings.onStatusChange - Callback to use for status updates.
     * @param {String} settings.mediator - The public key of the mediator account.
     * @param {String} settings.endpoint - URL of the demolisher server endpoint.
     * @param {String} [settings.horizon] - URL of the Horizon server.
     * @param {String} [settings.networkPassphrase] - Stellar network passphrase.
     * @param {Number} [settings.baseFee] - Network base fee to use.
     */
    constructor({source, signers, horizon, networkPassphrase, mediator, endpoint, baseFee = 100, onStatusChange = null}) {
        if (!source)
            throw new Error('Option "source" is required')
        if (!(signers instanceof Array) || signers.length < 1)
            throw new Error('Option "signers" is required.')
        //set source account public key
        this.sourcePublicKey = source
        //set source account signers
        this.signers = signers
        //mediator account
        this.mediator = mediator
        //set base fee to 0.001 XLM to ensure merge even in case of surge pricing
        this.baseFee = baseFee
        //source account wrapper
        this.sourceAccount = null
        //current operations
        this.operations = []
        //list of all issuers to ignore
        this.ignoredIssuers = []
        //demolisher server API endpoint
        this.endpoint = endpoint
        //init Horizon server wrapper
        this.server = new Server(horizon || 'https://horizon.stellar.org')
        //set status change callback
        this.onStatusChange = onStatusChange
        //init error counter
        this.errorCounter = 0
    }

    /**
     * XLM balance of the source account.
     * @return {string}
     */
    get balance() {
        if (!this.sourceAccount) return ''
        //find native currency and return the balance
        return this.sourceAccount.balances.find(b => b.asset_type === 'native').balance
    }

    /**
     * Fetch all data entries from the account, and executes remove data entry operations.
     */
    async dropDataEntries() {
        const {data_attr} = this.sourceAccount
        //generate remove data operations
        for (let name in data_attr)
            if (data_attr.hasOwnProperty(name)) {
                this.operations.push(Operation.manageData({name, value: null}))
            }
        return await this.exec({status: 'Dropping data entries'})
    }

    /**
     * Fetch all offers from the account, and executes remove offer operations.
     */
    async dropOffers() {
        //we can process max 100 ops at once so there is no need to fetch more
        const {records} = await this.server
            .offers()
            .forAccount( this.sourcePublicKey)
            .limit(100)
            .call()
        //generate drop offer operations
        for (let {buying, selling, price, id} of records) {
            this.operations.push(Operation.manageSellOffer({
                price: price,
                buying: retrieveAsset(buying),
                selling: retrieveAsset(selling),
                amount: '0',
                offerId: id
            }))
        }
        return await this.exec({status: 'Dropping open DEX offers'})
    }

    /**
     * Try to sell all assets.
     */
    async sellAssets() {
        //skip if we have already sold all assets
        if (this.eligibleAssetsSold) return false
        //prepare sell operations
        for (let {asset_code, asset_issuer, balance} of this.sourceAccount.balances)
            if (asset_issuer && balance > 0 && !this.ignoredIssuers.includes(asset_issuer)) {
                this.operations.push(Operation.manageSellOffer({
                    selling: new Asset(asset_code, asset_issuer),
                    buying: XLM,
                    price: 0.0000001,//sell at market price
                    amount: adjustPrecision(balance)
                }))
            }
        const res = await this.exec({status: 'Selling assets'})
        this.eligibleAssetsSold = true
        return res
    }

    /**
     * Move assets to anchors, and drop trust lines.
     */
    async dropTrustlines() {
        for (let {asset_code, asset_issuer, balance} of this.sourceAccount.balances) {
            //only non-native assets with positive balance
            if (asset_issuer) {
                if (balance > 0) {
                    //return remaining balance to the issuer account
                    this.operations.push(Operation.payment({
                        asset: new Asset(asset_code, asset_issuer),
                        destination: asset_issuer,
                        amount: adjustPrecision(balance)
                    }))
                }
                //remove the trustline
                this.operations.push(Operation.changeTrust({
                    asset: new Asset(asset_code, asset_issuer),
                    limit: '0'
                }))
            }
        }
        return await this.exec({status: 'Dropping all trustlines'})
    }

    /**
     * Merge account using intermediate helper account to reclaim all funds.
     * @param {String} destination - Destination account that will receive funds.
     * @param {String} [memo] - Transaction memo (required for exchanges and some anchors).
     */
    async mergeAccount(destination, memo) {
        const {mediator} = this
        //retrieve XLM balance
        //amount to send to the destination account
        const amount = this.balance - 2 * this.baseFee / 10000000
        //merge to the mediator account
        this.operations.push(Operation.accountMerge({
            destination: mediator
        }))
        //payment to the destination
        this.operations.push(Operation.payment({
            destination,
            asset: XLM,
            amount: adjustPrecision(amount),
            source: mediator
        }))
        //execute transaction
        return await this.exec({status: 'Deleting source account', memo, requiresApproval: true})
    }


    /**
     * Update source account from the network.
     * @return {Promise<Account>}
     */
    async fetchSourceAccount() {
        this.updateStatus('Retrieving source account information')
        this.sourceAccount = await this.server.accounts().accountId(this.sourcePublicKey).call()
        return this.sourceAccount
    }

    /**
     * Prepare and sign the transaction.
     * @param {Array} operations - Array of operations to execute.
     * @param {String} [memo] - Transaction memo.
     * @return {Promise<Transaction>}
     */
    async prepareTransaction(operations, memo = null) {
        //we assume that the sourceAccount has been already updated before the call
        const transactionBuilder = new TransactionBuilder(
            new Account(this.sourcePublicKey, this.sourceAccount.sequence),
            {
                fee: this.baseFee,
                memo: memo && Memo.text(memo),
                networkPassphrase: appSettings.networkPassphrase
            })
        //add operations from the batch
        for (let operation of operations) {
            transactionBuilder.addOperation(operation)
        }
        //build it
        const transaction = transactionBuilder.setTimeout(300).build()
        //sign using all available signers (we assume that signers were previously analyzed to prevent TX_BAD_AUTH_EXTRA)
        for (let signer of this.signers) {
            transaction.sign(Keypair.fromSecret(signer))
        }
        return transaction
    }

    /**
     * Build a transaction with the specified operations, sign, and send it to the network.
     * @param {String} status - Current status.
     * @param {String} [memo] - Transaction memo.
     * @param {Boolean} [requiresApproval] - If true, Demolisher will request transaction signature from the mediator server.
     * @return {Promise<Boolean>}
     */
    async exec({status, memo = null, requiresApproval = false}) {
        const {operations} = this
        //return false if there are no operations to process
        if (!operations.length) return false
        //update process status
        this.updateStatus(status)
        //prepare tx, max 100 operations per tx
        let transaction = await this.prepareTransaction(operations.slice(0, 100), memo)
        //request transaction approval if required
        if (requiresApproval) {
            transaction = await this.requestTransactionApproval(transaction)
        }
        //reset operations accumulator
        this.operations = []
        //submit transaction to the network
        try {
            await this.server.submitTransaction(transaction)
        } catch (e) {
            console.error(e)
            //try to process errors
            this.trackDeletedIssuers(e, transaction.operations)
            throw e
        }
        //everything is ok
        return true
    }

    /**
     * Post the transaction to demolisher server.
     * @param {Transaction} transaction - Transaction to approve.
     * @returns {Transaction} The signed transaction, if it's valid.
     */
    async requestTransactionApproval(transaction) {
        const response = await fetch(`${this.endpoint}/merge`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({transaction: transaction.toEnvelope().toXDR('base64')})
        })
        if (!response.ok)
            throw new Error('Failed to obtain merge transaction signature confirmation')
        const parsed = await response.json()
        return TransactionBuilder.fromXDR(parsed.transaction, appSettings.networkPassphrase)
    }

    /**
     * Track complex cases with deleted issuer accounts.
     * @param {Error} e - Error thrown by submitTransaction() method.
     * @param {Array} operations - Operations included into the transaction.
     */
    trackDeletedIssuers(e, operations) {
        //retrieve operation errors
        let opResult = e
        for (let segment of 'response.data.extras.result_codes.operations'.split('.')) {
            opResult = opResult[segment]
            if (!opResult) return
        }
        for (let i = 0; i < opResult.length; i++) {
            const resultCode = opResult[i]
            if (resultCode !== 'op_success') {
                if (resultCode === 'op_sell_no_issuer') {
                    //TODO: check the op_sell_no_issuer case
                    this.ignoredIssuers.push(operations[i])
                }
            }
        }
    }

    //utility function for status updates
    updateStatus(newStatus, finished = false, error = false) {
        if (typeof this.onStatusChange === 'function') {
            this.onStatusChange(newStatus, this.balance, finished, error)
        }
    }

    /**
     * Clean up everything and merge the account.
     * @param {String} destination - Destination account that will receive funds.
     * @param {String} [memo] - Transaction memo (required for exchanges and some anchors).
     */
    async merge(destination, memo = 'StellarExpert merge tool') {
        if (!destination) throw new Error('Argument "destination" is required.')

        //iterate through the steps over and over until the account is merged
        while (true) {
            try {
                await this.fetchSourceAccount()
                //check data attributes
                if (await this.dropDataEntries()) continue
                //drop active offers
                if (await this.dropOffers()) continue
                //sell assets
                if (await this.sellAssets()) continue
                //return unsold assets to the issuers and drop trustlines
                if (await this.dropTrustlines()) continue
                //anf finally merge account
                if (await this.mergeAccount(destination, memo)) {
                    this.updateStatus(`Congratulation! Account ${this.sourcePublicKey} has been merged successfully.`, true)
                    break
                }
            } catch (e) {
                console.error(e)
                //reset operations accumulator
                this.operations = []
                //allow only limited number of retries
                this.errorCounter++
                if (this.errorCounter >= 5) { //allow up to 5 failed attempts
                    this.updateStatus('Failed to merge the account', true, true)
                    break
                }
                //wait 5 seconds before the next retry
                await new Promise(resolve => setTimeout(resolve, 5000))
            }
        }
    }
}

export default DemolisherTxBuilder