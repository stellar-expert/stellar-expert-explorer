import React from 'react'
import Info from '../../components/info-tooltip'
import {BlockSelect} from '@stellar-expert/ui-framework'

const valueLinkMap = {
    email: 'mailto:$v',
    keybase: 'https://keybase.io/$v',
    twitter: 'https://twitter.com/$v',
    github: 'https://github.com/$v',
    telegram: 'https://t.me/$v'
}

function TomlValue({field, value, rules = ''}) {
    let link
    for (let linkKey of Object.keys(valueLinkMap)) {
        if (field.indexOf(linkKey) >= 0) {
            link = valueLinkMap[linkKey].replace('$v', value)
            break
        }
    }
    if (!link && rules.split('|').includes('url')) {
        link = value
    }

    if (link) return <a href={link} target="_blank" rel="noreferrer noopener">{value}</a>
    return <BlockSelect wrap inline>{value.toString()}</BlockSelect>
}

function TomlSectionContents({data}) {
    if (data instanceof Array) return <>
        {data.map((v, i) => <TomlSectionContents key={i} data={v}/>)}
    </>
    const {fields} = data?.__schema || {}
    if (!fields) return <div className="dimmed">(invalid data format)</div>
    return <>
        {fields.map((fieldDescriptor, i) => {
            const {field, label, description} = fieldDescriptor,
                value = data[field]
            if (!value) return null
            if (value instanceof Array) {
                return <React.Fragment key={field}>
                    {value.map((v, j) => <TomlSectionContents key={`${i}.${j}`} data={v}/>)}
                </React.Fragment>
            }

            return <React.Fragment key={field}>
                <dt>{label}:</dt>
                <dd>
                    <TomlValue {...fieldDescriptor} value={value}/>
                    <Info link="https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0001.md">
                        {description}
                    </Info></dd>
            </React.Fragment>
        }).filter(v => !!v)}
    </>
}

export default function TomlSection({data, header}) {
    if (!data) return null
    if (data instanceof Array) {
        if (!data.length) return null
    } else if (!data.__schema) return null

    return <div>
        <div className="dimmed text-tiny">
            Please note, the metadata is loaded from the account home domain and was
            not verified by StellarExpert team.
        </div>
        <dl className="micro-space">
            {header && <div>{header.toUpperCase()}</div>}
            <TomlSectionContents data={data}/>
        </dl>
    </div>

}