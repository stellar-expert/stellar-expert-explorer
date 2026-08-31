import React from 'react'
import TomlValue from './toml-value-view'

export default function TomlSectionContent({data}) {
    if (data instanceof Array) return <>
        {data.map((v, i) => <TomlSectionContent key={i} data={v}/>)}
    </>

    return <>
        {Object.entries(data).map(([key, value]) => {
            if (!value) return null
            if (value instanceof Array) {
                return <React.Fragment key={key}>
                    {value.map((v, j) => <TomlSectionContent key={`${key}.${j}`} data={v}/>)}
                </React.Fragment>
            }

            return <React.Fragment key={key}>
                <dt>{formatTomlKey(key)}:</dt>
                <dd>
                    <TomlValue name={key.toLowerCase()} value={value}/>
                    {/*<Info link="https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0001.md">
                        {description}
                    </Info>*/}</dd>
            </React.Fragment>
        }).filter(v => !!v)}
    </>
}

function isUpperCase(value) {
    return value.toUpperCase() === value
}

function capitalize(value) {
    return value.substring(0, 1).toUpperCase() + value.substring(1).toLowerCase()
}

function formatTomlKey(key) {
    for (let i = 1; i < key.length; i++) {
        if (key[i - 1] !== ' ' && isUpperCase(key[i - 1]) !== isUpperCase(key[i])) {
            key = key.substring(0, i) + ' ' + key.substring(i)
            i += 2
        }
    }
    return capitalize(key).replace(/_/g, ' ')
}