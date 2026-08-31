import React from 'react'
import InfoLayout from './info-layout'
import {usePageMetadata} from '@stellar-expert/ui-framework'
import {resolvePath} from '../../business-logic/path'

export default function LostPaymentView() {
    usePageMetadata({
        title: `Lost payment on Stellar Network`,
        description: `Haven't received your money within two hours? Let's try to find your transaction.`
    })

    return <InfoLayout section="Lost payments" description="Can't see a payment in your wallet or exchange account?">
        <p>
            Transactions on Stellar Network are processed within a few seconds, but sometimes payments to custodial
            wallets (exchanges, token issuers) may take up to an hour or two.
        </p>
        <p>
            Haven't received your money within two hours? Let's check your transaction.
            If you get here by the link from the wallet/exchange – great, you have already landed on the page
            containing all transaction details.
        </p>
        <p>
            If not, you'll need to copy the address of the account that sent funds, paste it into the{' '}
            <a href={resolvePath('search/new')}>searchbox</a>, and press "Enter".
            Then navigate to the account details and find your missing payment in the operations list.
        </p>
        <p>
            Ok, so we found the transaction. First of all, check whether it came through.
            All processed transactions are marked as "Successful". If you see "Failed" status, it means that your
            transactions failed for some reason. Check thoroughly everything and try sending the payment again.
        </p>
        <p>
            Another common reason why the payment might not be deposited to your account, is an incorrect or missing
            transaction "memo" field. Custodial wallets and exchanges use it to identify the recipient account.
            In this case, deposit instructions always contain two parts of the information required to process the
            deposit: the destination address (like "GA5...NLH") and memo itself. You need to provide both, otherwise
            the receiver will be unable to process your deposit automatically.
        </p>
        <p>
            If you forgot to put the memo or somehow typed the incorrect value there, you'll need to contact the
            support team of the company that owns the destination wallet. It's impossible to revert
            the transaction, but they can process your deposit manually if you prove funds ownership.
            In order to make the process faster, provide the correct memo value and link to the transaction itself.
        </p>
        <p>
            Lastly, if you believe that the payment failed due to a technical problem, contact support team of your
            wallet/exchange. We can't help you in the funds recovery process. We do not have access to funds stored
            on user accounts.
        </p>
    </InfoLayout>
}