const {Transaction, Operation, Keypair, Networks} = require('@stellar/stellar-sdk'),
    errors = require('../errors'),
    {networks} = require('../../app.config')

function signTransaction(networkName, transactionEnvelope) {
    const {network, demolisherSecret} = networks[networkName],
        transaction = new Transaction(transactionEnvelope, Networks[network]),
        [merge, transfer] = transaction.operations,
        demolisherKeypair = Keypair.fromSecret(demolisherSecret),
        demolisherAccount = demolisherKeypair.publicKey()

    if (transaction.operations.length !== 2 ||
        merge.type !== Operation.accountMerge.name ||
        merge.source === demolisherAccount ||
        merge.destination !== demolisherAccount ||
        (transfer.type !== Operation.payment.name && transfer.type !== Operation.createAccount.name) ||
        transfer.source !== demolisherAccount ||
        transfer.destination === demolisherAccount ||
        transfer.amount < 1)
        throw errors.badRequest('Transaction is invalid')

    transaction.sign(demolisherKeypair)

    return {
        transaction: transaction.toEnvelope().toXDR('base64')
    }
}

module.exports = {signTransaction}