import React from 'react'
import {InfoTooltip as Info, formatExplorerLink, UtcTimestamp} from '@stellar-expert/ui-framework'

export default function ContractCodeValidationStatusView({validation}) {
    if (!validation)
        return null
    return <>
        <dt>Source code:</dt>
        {validation.status === 'verified' ?
            <dd>
                <VerifiedStatus validation={validation}/>
            </dd> :
            <dd>
                Unavailable
                <Info link={formatExplorerLink('contract', 'validation')}>
                    This contract has no automatic source code validation configured. Our source matching toolkit allows
                    developers to establish a trust chain from a smart contract deployed
                    on Stellar Network to a specific commit in GitHub repository containing source code of the contract.
                </Info>
            </dd>}
    </>
}

function VerifiedStatus({validation}) {
    const {commit, repository, ts} = validation
    const repoLink = `${repository}/tree/${commit}`
    const sourceRepo = parseSourceRepo(repository)
    return <>
        <a href={repoLink} target="_blank" rel="noreferrer"><i className="icon-github"/>{sourceRepo}</a>
        <Info link={formatExplorerLink('contract', 'validation')}>
            <div style={{textAlign: 'left'}}>
                Source code confirmed <UtcTimestamp date={ts}/><br/>
                <i className="icon-github"/>{sourceRepo}<br/>
                at git commit <span title={commit}>{commit.substring(0, 7)}</span>
            </div>
        </Info>
    </>
}

function parseSourceRepo(source) {
    const [_, owner, repo] = /github.com\/([^\/]+)\/([^\/]+)/.exec(source.toLowerCase())
    if (!owner || !repo)
        return 'repository'
    return owner + '/' + repo
}