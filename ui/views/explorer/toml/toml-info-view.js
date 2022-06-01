import React from 'react'
import PropTypes from 'prop-types'
import {Tabs, useTomlData, useTomlInteropInfo} from '@stellar-expert/ui-framework'
import TomlTransferServerView from './toml-transfer-server-view'
import TomlPaymentServerView from './toml-payment-server-view'
import TomlInteropView from './toml-interop-view'
import TomlSection from './toml-section-view'
import TomlCodeView from './toml-code-view'

export default function TomlInfoView({homeDomain, account, assetCode, className, showRawCode = false, showInteropInfo = true}) {
    const {loaded: tomlInfoLoaded, data: tomlInfo, rawToml} = useTomlData(homeDomain),
        {loaded: interopInfoLoaded, data: interopInfo} = useTomlInteropInfo(tomlInfo)

    if (!homeDomain || !tomlInfoLoaded || !tomlInfo) return null

    tomlInfo.interop = interopInfoLoaded ? interopInfo : {}
    let assetTomlData
    if (assetCode) {
        assetTomlData = tomlInfo.currencies && tomlInfo.currencies.find(c => c.code === assetCode && c.issuer === account)
    } else {
        //check whether this account is mentioned anywhere in the TOML
        if (tomlInfo.signing_key !== account //either signing key
            && (tomlInfo.accounts && !tomlInfo.accounts.includes(account)) //or owned accounts list
            && (tomlInfo.currencies && !tomlInfo.currencies.some(c => c.issuer === account)))
            return null //do not show TOML info as this account may just use a federation address,and not an official account
    }

    if (assetCode && !assetTomlData) return null  //toml does not contain this asset

    const tabs = []
    if (showRawCode){
        tabs.push({
            name: 'code',
            title: 'Code',
            render: () => <TomlCodeView data={rawToml}/>
        })
    }
    if (tomlInfo.documentation) {
        tabs.push({
            name: 'organization',
            title: 'Organization',
            render: () => <TomlSection data={tomlInfo.documentation}/>
        })
    }
    if (assetCode) {
        tabs.push({
            name: 'currency',
            title: 'Currency',
            render: () => <TomlSection data={assetTomlData}/>
        })
    }
    if (tomlInfo.principals) {
        tabs.push({
            name: 'principals',
            title: 'Principals',
            render: () => <TomlSection data={tomlInfo.principals}/>
        })
    }
    if (TomlInteropView.hasInteropServices(tomlInfo)) {
        tabs.push({
            name: 'interop',
            title: 'Interoperability',
            render: () => <TomlInteropView data={tomlInfo}/>
        })
    }
    if (showInteropInfo) {
        if (tomlInfo.interop.sep6) {
            tabs.push({
                name: 'transferServer',
                title: 'SEP6',
                render: () => <TomlTransferServerView {...{
                    tomlInfo,
                    standard: 'sep6',
                    homeDomain,
                    assetCode,
                    assetIssuer: account
                }} />
            })
        }
        if (tomlInfo.interop.sep24) {
            tabs.push({
                name: 'interactiveTransferServer',
                title: 'SEP24',
                render: () => <TomlTransferServerView {...{
                    tomlInfo,
                    standard: 'sep24',
                    homeDomain,
                    assetCode,
                    assetIssuer: account
                }} />
            })
        }
        if (tomlInfo.interop.sep31) {
            tabs.push({
                name: 'paymentServer',
                title: 'SEP31',
                render: () => <TomlPaymentServerView {...{tomlInfo, homeDomain, assetCode, assetIssuer: account}} />
            })
        }
    }
    if (!tabs.length) return null

    return <Tabs tabs={tabs} className={className}/>
}

TomlInfoView.propTypes = {
    homeDomain: PropTypes.string.isRequired,
    account: PropTypes.string.isRequired,
    assetCode: PropTypes.string
}