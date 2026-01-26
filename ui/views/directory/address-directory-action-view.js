import React from 'react'
import {useDirectory} from '@stellar-expert/ui-framework'
import {useGithubOAuth} from '../../business-logic/oauth/oauth-hooks'
import {isDirectoryAdmin} from './is-directory-admin'

export default function AddressDirectoryActionView({address}) {
    const directoryInfo = useDirectory(address)
    const [githubUser] = useGithubOAuth()
    if (!isDirectoryAdmin(githubUser))
        return null
    let link
    let title
    if (!directoryInfo) {
        title = 'Add Directory metadata'
        link = `/directory/add?address=${address}`
    } else {
        title = 'Modify Directory metadata'
        link = `/directory/${address}/edit`
    }
    return <a href={link} className="trigger icon icon-attach" target="_blank" title={title}/>
}