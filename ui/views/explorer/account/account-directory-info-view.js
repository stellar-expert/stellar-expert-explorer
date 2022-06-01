import React from 'react'
import {useDirectory} from '@stellar-expert/ui-framework'
import DirectoryTagsLineView from '../../directory/directory-tags-line-view'

export default function AccountDirectoryInfoView({address}) {
    const directoryInfo = useDirectory(address)
    if (!directoryInfo) return null
    const {domain, tags} = directoryInfo
    if (tags.includes('malicious')) return <div>
        <i className="icon icon-warning color-warning"/> Warning: reported for illicit or fraudulent activity.
        Do not send funds to this address and do not trust any person affiliated with it.
    </div>
    return <div className="text-small" style={{margin: '-0.8em 0'}}>
        <DirectoryTagsLineView tags={tags}/>{' '}
        {!!domain && <a href={'https://' + domain} target="_blank" rel="noreferrer">https://{domain}</a>}
    </div>
}