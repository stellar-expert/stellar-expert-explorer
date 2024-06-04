
import {drawIdenticon} from '@stellar-expert/ui-framework'
import {shortenString} from '@stellar-expert/formatter'

export function prepareMetadata(data = {}) {
    const {asset, account, infoAssets, ...otherData} = data
    const metadata = {
        ...otherData,
        template: 'text'
    }
    if (asset) {
        const {asset: code, domain, toml_info, descriptor} = asset || {}
        const issuer = toml_info?.issuer ? toml_info.issuer : descriptor?.issuer
        metadata.template = 'asset'
        metadata.value = {
            code: toml_info?.code || code,
            icon: toml_info?.image,
            domain: domain || shortenString(issuer || '', 12),
        }
        if (toml_info?.orgName && issuer) {
            metadata.description = `Asset issued by ${toml_info?.orgName || ''} ${shortenString(issuer || '', 12)}`
        }
    }
    if (infoAssets) {
        otherData.infoList.map(entry => {
            if (entry.type === 'asset') {
                const {asset: code, domain, toml_info, descriptor} = entry.value || {}
                const issuer = toml_info?.issuer ? toml_info.issuer : descriptor?.issuer
                entry.value = {
                    code: toml_info?.code || code,
                    icon: toml_info?.image,
                    domain: domain || shortenString(issuer || '', 12),
                }
            }
            return entry
        } )
    }
    if (account) {
        const tagsInline = account.info?.tags.map(tag => '#' + tag + ' ').join('')
        const site = account.info?.domain ? `https://${account.info.domain}` : ''
        const type = account.address.startsWith('C') ? 'Contract' : 'Account'
        metadata.description = type === 'Contract' ? otherData.description : `${type} ${tagsInline || ''} ${site}`
        metadata.template = 'account'
        metadata.value = {
            address: account.address,
            // displayName: account.info.name,
            icon: 'data:image/svg+xml;charset=utf-8,' + drawIdenticon(account.address)
        }
    }
    return metadata
}