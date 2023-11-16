import React from 'react'
import {Tabs, useExplorerApi, withErrorBoundary} from '@stellar-expert/ui-framework'
import TomlTransferServerView from './toml-transfer-server-view'
import TomlPaymentServerView from './toml-payment-server-view'
import TomlInteropView from './toml-interop-view'
import TomlSection from './toml-section-view'
import TomlWarningsView from './toml-warnings-view'
import TomlRawContentView from './toml-raw-content-view'

export default withErrorBoundary(function TomlInfoView({homeDomain, account, assetMeta, className, showInteropInfo = true}) {
    const {loaded: tomlInfoLoaded, data: tomlInfo} = useExplorerApi('domain-meta?domain=' + encodeURIComponent(homeDomain))
    if (!homeDomain || !tomlInfoLoaded || !tomlInfo)
        return null
    if (assetMeta && assetMeta.domain !== homeDomain)
        return null
    const {meta, tomlCid, warnings, interop} = tomlInfo
    if (!assetMeta) {
        //check whether this account is mentioned anywhere in the TOML
        if (meta?.SIGNING_KEY !== account //either signing key
            && !meta?.ACCOUNTS?.includes(account) //or owned accounts list
            && !meta?.CURRENCIES?.some(c => c.issuer === account)) //or asset issuer account
            return null //do not show TOML info as this account may just use a federation address,and not an official account
    }

    const tabs = []
    if (meta?.DOCUMENTATION) {
        tabs.push({
            name: 'organization',
            title: 'Organization',
            render: () => <TomlSection data={meta.DOCUMENTATION}/>
        })
    }
    if (assetMeta) {
        tabs.push({
            name: 'currency',
            title: 'Currency',
            render: () => <TomlSection data={assetMeta.toml_info}/>
        })
    }
    if (meta?.PRINCIPALS) {
        tabs.push({
            name: 'principals',
            title: 'Principals',
            render: () => <TomlSection data={meta?.PRINCIPALS}/>
        })
    }
    if (TomlInteropView.hasInteropServices(tomlInfo)) {
        tabs.push({
            name: 'interop',
            title: 'Interoperability',
            render: () => <TomlInteropView data={tomlInfo}/>
        })
    }
    const interopMeta = assetMeta?.toml_info || (meta.CURRENCIES || [])[0]
    if (showInteropInfo && interop && interopMeta) {
        const {code: assetCode, issuer: assetIssuer} = interopMeta
        if (interop.sep6) {
            tabs.push({
                name: 'transferServer',
                title: 'SEP6',
                render: () => <TomlTransferServerView {...{
                    tomlInfo,
                    standard: 'sep6',
                    homeDomain,
                    assetCode,
                    assetIssuer
                }}/>
            })
        }
        if (interop.sep24) {
            tabs.push({
                name: 'interactiveTransferServer',
                title: 'SEP24',
                render: () => <TomlTransferServerView {...{
                    tomlInfo,
                    standard: 'sep24',
                    homeDomain,
                    assetCode,
                    assetIssuer
                }}/>
            })
        }
        if (interop.sep31) {
            tabs.push({
                name: 'paymentServer',
                title: 'SEP31',
                render: () => <TomlPaymentServerView {...{
                    tomlInfo,
                    homeDomain,
                    assetCode,
                    assetIssuer
                }}/>
            })
        }
    }
    if (tomlCid) {
        tabs.push({
            name: 'code',
            title: 'TOML code',
            render: () => <TomlRawContentView cid={tomlCid}/>
        })
    }
    if (warnings) {
        tabs.push({
            name: 'warnings',
            title: <><i className="icon icon-warning text-small"/>Warnings</>,
            render: () => <TomlWarningsView warnings={warnings} domain={homeDomain}/>
        })
    }
    if (!tabs.length)
        return null

    return <div id="toml-props">
        <Tabs right tabs={tabs} className={className}/>
    </div>
})