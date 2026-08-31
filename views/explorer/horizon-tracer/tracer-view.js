import React from 'react'
import PropTypes from 'prop-types'
import {Button, ButtonGroup, CodeBlock, useDependantState} from '@stellar-expert/ui-framework'
import appSettings from '../../../app-settings'

const commonLinkRefs = {
    transactions: 'Transactions',
    transaction: 'Transaction',
    operations: 'Operations',
    operation: 'Operation',
    effects: 'Effects',
    account: 'Account',
    ledger: 'Ledger',
    trades: 'Trades',
    offers: 'Offers',
    data: 'Data'
}

function extractActions(json) {
    const links = json['_links'],
        res = []
    if (links) {
        const common = /.*\/\/.+?\//.exec(links.self.href)[0]

        const addSingleAction = (link, title) => {
            if (link) {
                res.push({
                    title: title,
                    endpoint: link.href.substring(common.length).replace(/{.*?}/, '')
                })
            }
        }

        Object.keys(commonLinkRefs).forEach(refKey => addSingleAction(links[refKey], commonLinkRefs[refKey]))

        if (links.next && links.next.href !== links.self.href) {
            addSingleAction(links.next, 'Next page')
        }
        if (links.prev && links.prev.href !== links.self.href) {
            addSingleAction(links.prev, 'Prev page')
        }
    }
    return res
}

function getFullEndpointPath(endpoint) {
    if (!endpoint) return 'unknown'
    let res = appSettings.horizonUrl
    if (res.substr(-1) !== '/') {
        res += '/'
    }
    if (endpoint[0] === '/') {
        endpoint = endpoint.substr(1)
    }
    res += endpoint
    return res
}

export default function TracerView({endpoint}) {
    const [{currentEndpoint, content, actions, hideLinks}, updateState] = useDependantState(() => {
        load(endpoint)
        return {
            currentEndpoint: endpoint,
            content: null,
            actions: null,
            hideLinks: true
        }
    }, [endpoint])

    function setHideLinks(hide) {
        updateState(prev => ({
            currentEndpoint: prev.currentEndpoint,
            content: prev.content,
            actions: prev.actions,
            hideLinks: hide
        }))
    }


    function load(apiEndpoint) {
        fetch(getFullEndpointPath(apiEndpoint))
            .then(resp => {
                if (!resp.ok) throw new Error('Failed to load')
                return resp.json()
            })
            .catch(err => {
                console.error(err)
                return {error: `Failed to load ${currentEndpoint}`}
            })
            .then(json => {
                const actions = extractActions(json)
                updateState({
                    currentEndpoint: apiEndpoint,
                    content: json,
                    actions,
                    hideLinks
                })
            })
    }

    const contentToRender = content && hideLinks ? {...content, _links: undefined} : content,
        href = getFullEndpointPath(currentEndpoint),
        formattedContent = JSON.stringify(contentToRender, null, '  ')
    return <div>
        <a href={href} target="_blank"><code className="word-break">{href}</code></a>
        {!content ? <div className="loader"/> : <div>
            <CodeBlock lang="json" style={{maxHeight: '50vh'}}>{formattedContent}</CodeBlock>
            <label className="text-small dimmed">
                <input type="checkbox" onChange={e => setHideLinks(e.target.checked)} checked={hideLinks}/>
                &nbsp;Do not show navigation links
            </label>
        </div>}
        {actions && <div className="space">
            <ButtonGroup>
                {actions.map(action => <Button small className="text-small" key={action.title} onClick={e => load(action.endpoint)}>
                    {action.title}
                </Button>)}
            </ButtonGroup>
        </div>}
    </div>
}

TracerView.propTypes = {
    endpoint: PropTypes.string.isRequired
}