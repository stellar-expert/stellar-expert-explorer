import React from 'react'
import {useParams} from 'react-router'
import {StrKey} from '@stellar/stellar-base'
import {BlockSelect, AccountAddress, InfoTooltip as Info, useStellarNetwork} from '@stellar-expert/ui-framework'
import {useDirectory, parseMuxedAccount, usePageMetadata} from '@stellar-expert/ui-framework'
import Tracer from '../horizon-tracer/tracer-icon-view'
import ErrorNotificationBlock from '../../components/error-notification-block'
import AccountQrCodeToggle from '../../components/account-qr-code-toggle'
import {useCompositeAccountInfo} from '../../../business-logic/api/account-api'
import {useGithubOAuth} from '../../../business-logic/oauth/oauth-hooks'
import {isDirectoryAdmin} from '../../directory/is-directory-admin'
import AccountInfoView from './account-info-view'
import AccountDirectoryInfoView from './account-directory-info-view'

function AccountDirectoryActionView({address}) {
    const directoryInfo = useDirectory(address)
    const [githubUser] = useGithubOAuth()
    if (!isDirectoryAdmin(githubUser))
        return null
    let link
    let title
    if (!directoryInfo) {
        title = 'Add Directory metadata'
        link = `/directory/add?address=${address}`
    } else {
        title = 'Modify Directory metadata'
        link = `/directory/${address}/edit`
    }
    return <a href={link} className="trigger icon icon-attach" target="_blank" title={title}/>
}

export default function AccountView() {
    let {id: address} = useParams()
    const network = useStellarNetwork()
    let originalAddress = address
    let isMuxed = address.indexOf('M') === 0 && StrKey.isValidMed25519PublicKey(address)
    let muxedId

    if (isMuxed) {
        const parsed = parseMuxedAccount(originalAddress)
        address = parsed.address
        muxedId = parsed.muxedId
    }

    if (!StrKey.isValidEd25519PublicKey(address)) {
        usePageMetadata({
            title: `Invalid account address: ${address}`,
            description: 'Invalid Stellar account address. Make sure that you copied it correctly.'
        })
        return <div className="account-view">
            <h2 className="word-break condensed">{originalAddress}</h2>
            <ErrorNotificationBlock>
                Invalid Stellar account address. Make sure that you copied it correctly.
            </ErrorNotificationBlock>
        </div>
    }
    const directoryInfo = useDirectory(address)
    const {loaded, data: accountInfo} = useCompositeAccountInfo(address, muxedId)

    if (accountInfo?.nonExistentAccount) {
        usePageMetadata({
            title: `Account ${address} doesn't exist`,
            description: `Account ${address} doesn't exist on Stellar ${network}.`
        })
        return <div className="account-view">
            <h2 className="word-break condensed">{address}</h2>
            <ErrorNotificationBlock>
                Account does not exist on the network. Make sure that you copied account address correctly and there was at
                least one payment to this address.
            </ErrorNotificationBlock>
        </div>
    }

    usePageMetadata({
        title: `Account ${directoryInfo ? directoryInfo.name + ' ' : ''}${address}${directoryInfo ? ` ${directoryInfo.domain || ''} [${directoryInfo.tags.join()}]` : ''}`,
        description: `Explore properties, balance, active offers, and full operations history for account ${address} ${directoryInfo ? `${directoryInfo.name} ${directoryInfo.domain || ''} [${directoryInfo.tags.join()}]` : ' '}on Stellar ${network}.`
    })

    if (!loaded)
        return <div className="loader"/>

    if (accountInfo?.error) {
        return <ErrorNotificationBlock>
            Failed to fetch account info.
        </ErrorNotificationBlock>
    }

    return <div className="account-view">
        <h2 className="word-break relative condensed">
            <span className="dimmed">Account{accountInfo.deleted && <>&nbsp;(deleted)</>}&nbsp;</span>
            <AccountAddress account={address} className="plain" link={false} chars="all"
                            prefix={<AccountQrCodeToggle account={originalAddress}/>}/>
            <AccountDirectoryActionView address={address}/>
            <Tracer endpoint={`accounts/${address}`}/>
        </h2>
        {isMuxed && <div className="text-small" style={{marginTop: '-1em'}}>
            <span className="dimmed">Redirected from subaccount </span>
            <BlockSelect>{originalAddress}</BlockSelect>
            <Info link="https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0023.md">
                <p>
                    Multiplexed address represents a standard ed25519 Stellar account address paired with a 64-bit ID.
                </p>
                <p>
                    A common pattern in the Stellar ecosystem is for services to share a single Stellar account ID
                    across many users, relying on the memo ID to disambiguate incoming payments.
                </p>
                <p>
                    Multiplexed accounts provide a straightforward option to use virtual accounts instead of creating
                    many user accounts and help to solve the widespread problem caused by users who forget to attach memo IDs
                    when depositing to custodial accounts.
                </p>
            </Info>
        </div>}
        <AccountDirectoryInfoView address={address}/>
        <AccountInfoView account={accountInfo}/>
    </div>
}