import React from 'react'
import {CodeBlock, CopyToClipboard, Tabs} from '@stellar-expert/ui-framework'

export function SorobanConfigChangesView({configChanges, changesAnnotation, title, maxHeight = '30em'}) {
    const sorobanConfig = JSON.stringify(configChanges, null, '  ')
    const tabs = [
        {
            name: 'summary',
            title: 'Changes',
            isDefault: true,
            render: () => <CodeBlock lang="js" style={{maxHeight}}>{changesAnnotation.join('\n') || 'No changes'}</CodeBlock>
        },
        {
            name: 'code',
            title: 'JSON',
            render: () => <CodeBlock lang="json" style={{maxHeight}}>{sorobanConfig}</CodeBlock>
        }
    ]
    return <div className="space">
        <h4>
            {title || 'Soroban runtime config changes'}
            <CopyToClipboard text={sorobanConfig} title="Copy configuration changes to the clipboard" className="text-small"/>
        </h4>
        <div className="desktop-only" style={{marginBottom: '-2.6em'}}/>
        <Tabs right tabs={tabs}/>
    </div>
}