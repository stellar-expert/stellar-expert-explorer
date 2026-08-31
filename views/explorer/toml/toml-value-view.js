import React from 'react'
import {BlockSelect} from '@stellar-expert/ui-framework'

const valueLinkMap = {
    email: 'mailto:$v',
    keybase: 'https://keybase.io/$v',
    twitter: 'https://twitter.com/$v',
    github: 'https://github.com/$v',
    telegram: 'https://t.me/$v'
}

export default function TomlValue({name, value}) {
    let link
    for (const linkKey of Object.keys(valueLinkMap)) {
        if (name.includes(linkKey)) {
            link = valueLinkMap[linkKey].replace('$v', value)
            break
        }
    }
    if (!link && /https?:\/\//.test(value)) {
        link = value
    }

    if (link) return <a href={link} target="_blank" rel="noreferrer noopener">{value}</a>
    return <BlockSelect wrap inline>{value.toString()}</BlockSelect>
}