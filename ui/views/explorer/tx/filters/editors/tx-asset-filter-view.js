import React from 'react'
import {AssetLink, AssetSelector} from '@stellar-expert/ui-framework'

export function AssetEditor({value, setValue}) {
    if (!setValue)
        return <AssetLink asset={value} link={false}/>
    return <AssetSelector value={value} onChange={setValue} title={value ? undefined : 'Choose asset'} expanded/>
}