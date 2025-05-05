import React, {useState} from 'react'
import {Button, useDirectoryTags, usePageMetadata} from '@stellar-expert/ui-framework'
import {navigation} from '@stellar-expert/navigation'
import {useGithubOAuth} from '../../business-logic/oauth/oauth-hooks'
import {isDirectoryAdmin} from './is-directory-admin'
import {apiCall} from '../../models/api'
import appSettings from '../../app-settings'

function isDomainValid(domain) {
    return /^\S+\.[a-z]{2,}$/.test(domain)
}

export default function DirectoryBlockDomainView() {
    const directoryTags = useDirectoryTags(),
        [domain, setDomain] = useState(''),
        [reason, setReason] = useState(''),
        [batchMode, setBatchMode] = useState(false),
        [inProgress, setInProgress] = useState(false),
        [error, setError] = useState(null),
        [githubUser, githubApiProvider] = useGithubOAuth(),
        isAdmin = isDirectoryAdmin(githubUser)


    async function saveEntry() {
        if (!domain?.length)
            return
        const domains = batchMode
            ? domain.split('\n')
                .map(v => v.trim())
                .filter((a, i, self) => a && self.indexOf(a) === i) //get only unique values
            : [domain]

        if (domains.some(d => !isDomainValid(d))) {
            setError('Invalid domain name: ' + domains.find(d => !isDomainValid(d)))
            return
        }

        const blockReason = (reason || '').trim()
        if (!blockReason.length) {
            setError('Blocking reason is required')
            return
        }

        if (!githubUser) {
            githubApiProvider.login()
            return
        }

        try {
            setInProgress(true)
            for (let domain of domains) {
                const data = {domain, reason: blockReason, accessToken: githubApiProvider.authToken}
                await apiCall('directory/block-domain', data, {method: 'POST', includeNetwork: false})
            }
        } catch (e) {
            console.error(e)
            setError(e.message || 'Unhandled error')
        }
        setInProgress(false)
        navigation.navigate('/directory/blocked-domains')
    }

    usePageMetadata({
        title: `Flag domain in StellarExpert Directory`,
        description: `Report a domain spotted in illicit or fraudulent activity related to Stellar Network.`
    })

    return <>
        <div className="desktop-only text-small" style={{float: 'right', paddingTop: '1em'}}>
            <a href="/directory/blocked-domains">Back to BlockList</a>
        </div>
        <h2>Directory – add domain to blocklist</h2>
        <div className="segment blank">
            <p className="dimmed text-small">Request form for blocking malicious domains.</p>
            <div className="space">
                {isAdmin && <div style={{float: 'right'}}><label className="nowrap text-small">
                    <input type="checkbox" onChange={e => setBatchMode(e.target.checked)} checked={batchMode}/> batch mode
                </label>
                </div>}
                <label>Domain address</label>
                <p className="dimmed text-small">
                    A fully-qualified domain name to block. All subdomains will be blocked as well.
                </p>
                {batchMode ?
                    <textarea value={domain} onChange={e => setError(null) || setDomain(e.target.value)}
                              placeholder="Copy-paste domains separated with a newline here (max 100 per batch)"/> :
                    <input type="text" maxLength={70} placeholder="Domain name, e.g. example.com" value={domain}
                           disabled={inProgress} onChange={e => setError(null) || setDomain(e.target.value)}/>}

            </div>
            <div className="space">
                <label>
                    Blocking reason
                </label>
                <p className="dimmed text-small">
                    Why this domain should be blocked. Please write in English, otherwise Directory moderators may have
                    difficulties verifying your request.
                </p>
                <textarea maxLength={700} value={reason} disabled={inProgress}
                          onChange={e => setError(null) || setReason(e.target.value)} style={{height: '6.5em'}}/>
            </div>
            {error && <div className="alert space">Error: {error}</div>}
            {inProgress && <div><span className="loader micro"/></div>}
            <div className="space row">
                <div className="column column-25 text-center">
                    <Button block onClick={saveEntry} disabled={inProgress}>
                        {isAdmin ? 'Save' : 'Submit request'}
                    </Button>
                </div>
                <div className="column column-25">
                    <Button href="/directory/blocked-domains" block outline disabled={inProgress}>Cancel</Button>
                </div>
            </div>
        </div>
    </>
}