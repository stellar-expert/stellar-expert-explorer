import CsvGenerator from '../util/csv-generator'
import {Server} from 'stellar-sdk'

function formatDate(date) {
    return date.replace('T', ' ').replace('.000', '').replace('Z', ' +0000')
}

function formatAsset(op, prefix = '') {
    const asset_code = op[prefix + 'asset_code'],
        asset_issuer = op[prefix + 'asset_issuer']
    if (asset_code) return asset_code + '-' + asset_issuer
}

function formatPrice(price) {
    return price.toFixed(7).replace(/0{1,6}$/, '')
}

/*
SPENDING
==========
Date (date and time as YYYY-MM-DD HH:mm:ss Z)
Action (SPEND, DONATION or GIFT)
Account (account or wallet name, e.g. Coinbase or Blockchain)
Source (optional, source or wallet name, e.g. Coinbase or Blockchain)
Memo (optional, name of recipient or item purchased)
Symbol (BTC, LTC, ETH, etc)
Volume (number of coins spent)
Total (Fair price or cost in Currency or your home currency, or blank for market value
Currency (optional, specify alternative to your default currency, such as USD, GBP or EUR)
TxHash
Sender
Recipient

INCOME
==========
Date (date and time as YYYY-MM-DD HH:mm:ss Z)
Action (INCOME, GIFT or MINING)
Account (account or wallet name, e.g. Coinbase or Blockchain)
Source (optional, source or wallet name, e.g. Coinbase or Blockchain)
Memo (optional, name of sender or item sold)
Symbol (BTC, ETH, LTC, etc)
Volume (number of coins received)
Total (Fair price or value in Currency or your home currency, or blank for market value
Currency (optional, specify alternative to your default currency, such as USD, GBP or EUR)
TxHash
Sender
Recipient

TRADE
==========
Date (date and time as YYYY-MM-DD HH:mm:ss Z)
Account (override the exchange or wallet name, e.g. Coinbase)
Action (BUY, SELL or FEE)
Symbol (BTC, LTC, DASH, etc)
Volume (number of coins traded - ignore if FEE)
Currency (specify currency such as USD, GBP, EUR or coins, BTC or LTC)
Price (price per coin in Currency or blank for lookup - ignore if FEE)
Fee (any additional costs of the trade)
FeeCurrency (currency of fee if different than Currency)
*/

const inflationPools = [
    'GA3FUYFOPWZ25YXTCA73RK2UGONHCO27OHQRSGV3VCE67UEPEFEDCOPA',
    'GB56YLTH5SDOYTUGPWY5MXJ7VQTY7BEM2YVJZTN5O555VA6DJYCTY2MP',
    'GCCD6AJOYZCUAQLX32ZJF2MKFFAUJ53PVCFQI3RHWKL3V47QYE2BNAUT',
    'GDCHDRSDOBRMSUDKRE2C4U4KDLNEATJPIHHR2ORFL5BSD56G4DQXL4VW'
]

class TaxInfoExporter {
    constructor(publicKey, year) {
        this.publicKey = publicKey
        this.year = year
        this.horizon = new Server('https://horizon.stellar.org/')
        this.trades = []
        this.income = []
        this.spending = []
        this.exportFees = true
    }

    matchYear(ts) {
        const date = new Date(ts),
            year = date.getUTCFullYear()
        return this.year - year
    }

    buildFile(name, data, header) {
        if (!data.length) {
            return {
                name: `No data in "${name}" category for ${this.year} year.`
            }
        }
        const generator = new CsvGenerator()
        generator.writeHeader(header)
        for (let record of data) {
            generator.writeRow(record)
        }
        return {
            name: `${name}-${this.year}-${this.publicKey}.csv`,
            contents: generator.contents
        }
    }

    async loadHorizonData(handler, extractDatePredicate, processCallback) {
        while (true) {
            const data = await handler
            if (!data.records || !data.records.length) return //no more data
            for (let record of data.records) {
                //check year match
                const match = this.matchYear(extractDatePredicate(record))
                if (match < 0) return //break
                //we reached target year
                if (match === 0) {
                    await processCallback(record)
                }
            }
            //wait 3 seconds before the next call to prevent endpoint abuse
            await new Promise(resolve => setTimeout(resolve, 3000))
            handler = data.next()
        }
    }

    async loadFees() {
        const handler = this.horizon.transactions().forAccount(this.publicKey).order('asc').limit(200).call()
        await this.loadHorizonData(handler, tx => tx.created_at, tx => {
            if (tx.fee_account !== this.publicKey) return
            this.spending.push([
                formatDate(tx.created_at),  //Date
                this.publicKey,             //Account
                'StellarNetwork',           //Source
                'SPEND',                    //Action
                'network fees',             //Memo
                'XLM',                      //Symbol
                tx.fee_charged / 10000000,  //Volume
                tx.hash,                    //TxHash
                tx.fee_account,             //Sender
                null])                      //Recipient
        })
    }

    async loadPayments() {
        const handler = this.horizon.payments().forAccount(this.publicKey).order('asc').limit(200).call()
        await this.loadHorizonData(handler, p => p.created_at, async payment => {
            const ts = formatDate(payment.created_at),
                sender = payment.from || payment.funder || payment.source_account,
                destination = payment.to || payment.into || payment.destination || payment.account,
                txHash = payment.transaction_hash
            if (sender === destination) return
            if (sender === this.publicKey) {
                let spentAmount = payment.starting_balance || payment.amount || payment.source_amount,
                    symbol = formatAsset(payment) || formatAsset(payment, 'source_') || 'XLM'
                if (payment.type_i === 8) {
                    const effect = await this.horizon.effects().forOperation(payment.id).order('asc').call()
                    spentAmount = effect.records.find(e => e.type === 'account_debited').amount
                }
                this.spending.push([
                    ts,               //Date
                    this.publicKey,   //Account
                    'StellarNetwork', //Source
                    'SPEND',          //Action
                    destination,      //Memo
                    symbol,           //Symbol
                    spentAmount,      //Volume
                    txHash,           //TxHash
                    sender,           //Sender
                    destination])     //Recipient
            } else {
                const action = inflationPools.includes(sender) ? 'MINING' : 'INCOME',
                    receivedAmount = payment.starting_balance || payment.amount,
                    symbol = formatAsset(payment) || 'XLM'

                this.income.push([
                    ts,               //Date
                    this.publicKey,   //Account
                    'StellarNetwork', //Source
                    action,           //Action
                    sender,           //Memo
                    symbol,           //Symbol
                    receivedAmount,   //Volume
                    txHash,           //TxHash
                    sender,           //Sender
                    destination])     //Recipient
            }
        })
    }

    async loadTrades() {
        const handler = this.horizon.trades().forAccount(this.publicKey).order('asc').limit(200).call()
        await this.loadHorizonData(handler, p => p.ledger_close_time, trade => {
            const ts = formatDate(trade.ledger_close_time),
                base = formatAsset(trade, 'base_') || 'XLM',
                counter = formatAsset(trade, 'counter_') || 'XLM',
                price = (trade.price.n / trade.price.d)
            //if (trade.base_is_seller){}
            this.trades.push([
                ts,               //Date
                this.publicKey,   //Account
                'StellarNetwork', //Source
                (trade.base_account === this.publicKey) ? 'BUY' : 'SELL',            //Action
                counter,           //Symbol
                trade.counter_amount,           //Volume
                base,         //Currency
                formatPrice(1 / price)             //Price
            ])
        })
    }

    async export() {
        try {
            if (this.exportFees) {
                await this.loadFees()
            }
            await this.loadPayments()
            await this.loadTrades()
            this.spending.sort((a, b) => {
                if (a[0] < b[0]) return -1
                if (a[0] > b[0]) return 1
                return 0
            })

            const incomeData = this.buildFile('income', this.income, ['Date', 'Account', 'Source', 'Action', 'Memo', 'Symbol', 'Volume', 'TxHash', 'Sender', 'Recipient']),
                spendingData = this.buildFile('spending', this.spending, ['Date', 'Account', 'Source', 'Action', 'Memo', 'Symbol', 'Volume', 'TxHash', 'Sender', 'Recipient']),
                tradesData = this.buildFile('trades', this.trades, ['Date', 'Account', 'Source', 'Action', 'Symbol', 'Volume', 'Currency', 'Price'])
            return [incomeData, spendingData, tradesData]

        } catch (e) {
            return Promise.reject(e)
        }
    }
}

export default TaxInfoExporter