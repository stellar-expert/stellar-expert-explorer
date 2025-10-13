import React from 'react'
import {ExternalLink, InfoTooltip as Info, useDirectory, useAssetMeta} from '@stellar-expert/ui-framework'
import TomlValidatorView from '../toml/toml-validator-view'

function AssetIcon({asset}) {
    if (!asset) return null
    const {image, orgLogo} = (asset.toml_info || {})
    const imgSrc = image || orgLogo
    if (!imgSrc) return null
    return <img src={imgSrc} style={{maxWidth: '24px', maxHeight: '24px', verticalAlign: 'text-bottom'}}/>
}

export default function AssetVerificationStatusView({asset}) {
    const {issuerInfo} = asset
    const meta = useAssetMeta(asset.descriptor)
    const directoryInfo = useDirectory(asset?.descriptor?.issuer)

    if (issuerInfo === undefined || !meta) return null

    if (meta.unsafe || directoryInfo && (directoryInfo.tags || []).includes('malicious')) return <>
        <i className="icon icon-warning color-warning"/>
        Warning: reported for illicit or fraudulent activity
    </>
    if (!issuerInfo) return <>(related asset metadata not found)
        <Info link="https://www.stellar.org/developers/guides/concepts/stellar-toml.html">Asset issuing account's home
            domain was not set or matching <code>stellar.toml</code> file was not found on the domain specified in the
            issuer account settings.</Info>
    </>
    const domain = issuerInfo?.home_domain && issuerInfo.home_domain.toLowerCase()
    return <>
        <AssetIcon asset={meta}/>
        {!!meta.toml_info && <> <ExternalLink href={`https://${domain}`}>{domain}</ExternalLink></>}
        <TomlValidatorView asset={asset?.descriptor} domain={domain}/>
    </>
}
