import React, {useState} from 'react'
import {StrKey} from '@stellar/stellar-base'
import {AccountAddress, Button, useDirectoryTags, useDependantState, useTheme} from '@stellar-expert/ui-framework'
import {navigation} from '@stellar-expert/navigation'
import {isDirectoryAdmin} from './is-directory-admin'
import {useGithubOAuth} from '../../business-logic/oauth/oauth-hooks'
import {apiCall} from '../../models/api'
import DirectoryDropdownTagSelector from './directory-dropdown-tag-selector'
import DirectoryChangesHistoryView from './directory-changes-history-view'

const statuses = ['pending', 'authentication', 'inprogress', 'success']

function emptyEntry(address = null) {
    return {
        address: address || '',
        domain: '',
        name: '',
        tags: [],
        notes: '',
        version: 0
    }
}

function cloneNoneEmpty(from, keys) {
    const res = {}
    for (let key of keys) {
        const val = from[key]
        if (!!val) {
            res[key] = val
        }
    }
    return res
}

async function postRequest(data) {
    await apiCall('directory', data, {method: 'POST', includeNetwork: false})
}

export default function DirectoryEntryPropsView({existingEntry, requestedAddress, onChange}) {
    const directoryTags = useDirectoryTags(),
        [theme] = useTheme(),
        [entry, setEntry] = useDependantState(existingEntry || emptyEntry(requestedAddress), []),
        [batch, setBatch] = useState(''),
        [batchMode, setBatchMode] = useState(false),
        [status, setStatus] = useState('pending'),
        [error, setError] = useState(null),
        [githubUser, githubApiProvider] = useGithubOAuth(),
        isAdmin = isDirectoryAdmin(githubUser),
        inProgress = status === 'inprogress'

    function reset() {
        setEntry(emptyEntry())
        setBatch('')
        setBatchMode(false)
        setStatus('pending')
        setError(null)
        if (existingEntry) {
            navigation.navigate('/directory/add')
        }
    }

    function setAddress(value) {
        if (existingEntry) return
        value = value.trim()
        setEntry(entry => ({...entry, address: value}))
        setError(null)
    }

    function setHomeDomain(value) {
        value = value.trim()
        setEntry(entry => ({...entry, domain: value}))
        setError(null)
    }

    function setNotes(value) {
        setEntry(entry => ({...entry, notes: value}))
        setError(null)
    }

    function setName(value) {
        setEntry(entry => ({...entry, name: value}))
        setError(null)
    }

    function setTags(value) {
        setEntry(entry => ({...entry, tags: [...value]}))
        setError(null)
    }

    function validate() {
        if (batchMode) {
            const addresses = batch.split('\n').map(a => a.trim()).filter(a => !!a)
            if (!addresses.length) return 'No addresses provided'
            for (let a of addresses) {
                if (!StrKey.isValidEd25519PublicKey(a)) return 'Invalid address ' + a
            }
        } else {
            if (!StrKey.isValidEd25519PublicKey(entry.address)) return 'Invalid account address'
        }
        if (entry.domain) {
            if ((!/\w+\.\w+/.test(entry.domain) || /[:/?]/.test(entry.domain))) return 'Invalid domain'
        } else {
            delete entry.domain
        }
        if (!entry.name || entry.name.trim().length < 4) return 'Invalid display name'
        if (entry.tags.length < 1) return 'No tags selected'
    }

    async function saveEntry() {
        const validationResult = validate()
        if (validationResult) {
            setError(validationResult)
            setStatus('pending')
            return
        }

        setStatus('authentication')
        if (!githubUser) {
            githubApiProvider.login()
            return
        }

        try {
            let data = {...entry, accessToken: githubApiProvider.authToken}
            for (let [key, value] of Object.entries(data)) {
                if (value === null || value === '') {
                    delete data[key]
                }
            }
            if (isAdmin) {
                if (existingEntry) {
                    if (typeof data.version !== 'number')
                        throw new Error('Invalid data version fetched from the server.')
                    data.version++
                }
                setStatus('inprogress')
                if (batchMode) {
                    if (existingEntry)
                        throw new Error()
                    const addresses = batch.split('\n')
                        .map(a => a.trim()) //trim spaces
                        .filter((a, i, self) => a && self.indexOf(a) === i) //get only unique values
                    for (let address of addresses) {
                        await postRequest({...data, address})
                    }
                } else {
                    await postRequest(data)
                }
            } else {
                await apiCall('directory', data, {method: 'POST', includeNetwork: false})
            }
            reset()
            setStatus('success')
        } catch (e) {
            console.error(e)
            setStatus('pending')
            setError(e.message || 'Unhandled error')
        }
    }

    async function deleteEntry() {
        if (!isAdmin) return
        if (!(await confirm('Do you really want to remove this directory entry?'))) return
        const {address, notes, version} = entry
        setStatus('authentication')
        try {
            const data = {address, notes, version, accessToken: githubApiProvider.authToken}
            if (typeof data.version !== 'number') throw new Error('Invalid data version fetched from the server.')
            data.version++

            setStatus('inprogress')
            await apiCall('directory/' + address, data, {method: 'DELETE', includeNetwork: false})
            setError(null)
            if (!existingEntry) {
                navigation.navigate('/directory')
            }
            setStatus('success')
        } catch (e) {
            console.error(e)
            setStatus('pending')
            setError(e.message || 'Unhandled error')
        }
    }

    return <>
        <div className="space">
            {isAdmin && !existingEntry && <div style={{float: 'right'}}><label className="nowrap text-small">
                <input type="checkbox" onChange={e => setBatchMode(e.target.checked)} checked={batchMode}/> batch mode
            </label>
            </div>}
            <label>
                Account address
            </label>
            <p className="dimmed text-small">
                An address of the Stellar account that exists on the ledger or a public key of any Stellar keypair.
            </p>
            {batchMode ? <textarea value={batch} onChange={e => setBatch(e.target.value)}
                                   placeholder="Copy-paste addresses separated with a newline here (max 100 per batch)"/> :
                existingEntry ? <AccountAddress account={entry.address} name={false} icon={false} chars="all"/> :
                    <input type="text" maxLength={60} placeholder="G..." value={entry.address} autoFocus
                           disabled={inProgress} onChange={e => setAddress(e.target.value)}/>}

        </div>
        <div className="space">
            <label>
                Display name
            </label>
            <p className="dimmed text-small">
                This value will be displayed in the interface as an account title on websites that utilize Directory
                API.
            </p>
            <input type="text" maxLength={50} placeholder="Company or product name" value={entry.name}
                   disabled={inProgress} onChange={e => setName(e.target.value)}/>
        </div>
        <div className="space">
            <label>
                Tags
            </label>
            <p className="dimmed text-small micro-space">
                Choose one or more categories. Please do not select conflicting tags, like "issuer" + "inflation pool".
            </p>
            <DirectoryDropdownTagSelector available={directoryTags} selected={entry.tags}
                                          disabled={inProgress} onChange={newTags => setTags(newTags)}/>
        </div>
        <div className="space">
            <label>
                Home domain (optional)
            </label>
            <p className="dimmed text-small">
                Home domain of the related public entity. This field can be omitted for malicious accounts or personal
                keys.
            </p>
            <input type="text" maxLength={60} placeholder="some.domain.com" value={entry.domain}
                   disabled={inProgress} onChange={e => setHomeDomain(e.target.value)}/>
        </div>
        <div className="space">
            <label>
                Additional information
            </label>
            <p className="dimmed text-small">
                Additional notes for this entry, if any. Please write in English, otherwise Directory moderators may have
                difficulties verifying your request.
            </p>
            <textarea maxLength={700} value={entry.notes} disabled={inProgress}
                      onChange={e => setNotes(e.target.value)} style={{height: '6.5em'}}/>
        </div>
        {error && <div className="alert space">Error: {error}</div>}
        {status === 'success' && <div className="space">
            {isAdmin ? <>✓ Changes saved</> : <>✓ Request sent</>}
        </div>}
        {inProgress && <div><span className="loader micro"/></div>}
        <div className="space row">
            <div className="column column-25 text-center">
                <Button block onClick={saveEntry} disabled={inProgress}>
                    {isAdmin ? 'Save' : 'Submit request'}
                </Button>
            </div>
            {!!existingEntry && isAdmin &&
                <div className="column column-25">
                    <Button block outline onClick={deleteEntry} disabled={inProgress}>
                        <i className="icon icon-warning"/> Delete entry
                    </Button>
                </div>}
            <div className="column column-25">
                <Button href="/directory" block outline disabled={inProgress}>Cancel</Button>
            </div>
        </div>
        {!!existingEntry && <>
            <hr className="double-space"/>
            <DirectoryChangesHistoryView {...existingEntry}/>
        </>}
    </>
}