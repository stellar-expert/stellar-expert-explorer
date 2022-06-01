import React from 'react'
import {CodeBlock} from '@stellar-expert/ui-framework'

export default function TomlCodeView({data}){
    return <div>
        <CodeBlock lang="toml">{data}</CodeBlock>
    </div>
}