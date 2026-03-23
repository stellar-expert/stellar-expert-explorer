import React, {useCallback, useEffect, useState} from 'react'
import {parseQuery} from '@stellar-expert/navigation'
import {
    withErrorBoundary,
    AccountAddress,
    useExplorerPaginatedApi,
    UtcTimestamp,
    ScVal,
    useAutoFocusRef
} from '@stellar-expert/ui-framework'
import GridDataActionsView from '../../components/grid-data-actions'
import '../tx/filters/tx-filter.scss'

export default withErrorBoundary(function ContractEventsView({contract}) {
    const [filter, setFilter] = useState({})
    const contractEvents = useExplorerPaginatedApi(
        {
            path: `contract/${contract}/events`,
            query: filter
        }, {
            autoReverseRecordsOrder: true,
            defaultSortOrder: 'desc',
            updateLocation: true,
            limit: 20,
            defaultQueryParams: {order: 'desc'}
        })

    return <div className="relative segment blank">
        <TopicFilterView filter={filter} updateFilter={setFilter}/>
        <table className="table exportable micro-space">
            <thead>
            <tr>
                <th>Topics</th>
                <th>Body</th>
                <th className="collapsing">Initiator</th>
                <th className="collapsing">Date</th>
            </tr>
            </thead>
            <tbody className="condensed">
            {contractEvents.data.map(entry => <tr key={entry.paging_token}>
                <td data-header="Topics: " style={{verticalAlign: 'top', minWidth: '15em'}}>
                    <ScVal value={entry.topicsXdr} indent/>
                </td>
                <td data-header="Body: " style={{verticalAlign: 'top'}}>
                    <ScVal value={entry.bodyXdr} indent/>
                </td>
                <td className="nowrap" data-header="Initiator: " style={{verticalAlign: 'top'}}>
                    <AccountAddress account={entry.initiator}/>
                </td>
                <td className="nowrap" data-header="Date: " style={{verticalAlign: 'top'}}>
                    <UtcTimestamp date={entry.ts}/>
                </td>
            </tr>)}
            </tbody>
        </table>
        {!contractEvents.loaded && <div className="loader"/>}
        {contractEvents.loaded && !contractEvents.data.length && <div className="dimmed text-center text-small">
            (No event entries)
        </div>}
        <GridDataActionsView model={contractEvents}/>
    </div>
})

function TopicFilterView({filter, updateFilter}) {
    const [topics, setTopics] = useState(filter?.topic || [])
    const [isEdit, setIsEdit] = useState(false)

    useEffect(() => {
        const params = parseQuery()
        setTopics(params.topic || [])
        updateFilter(prev => ({...prev, topic: params.topic}))
    }, [updateFilter])

    const toggleEdit = useCallback(() => setIsEdit(prev => !prev), [])

    const deleteTopic = useCallback(e => {
        const {name} = e.currentTarget.dataset
        setTopics(prev => {
            const topicList = prev.filter(t => t !== name)
            updateFilter(prev => ({...prev, topic: topicList}))
            return topicList
        })
    }, [updateFilter])

    const addTopic = useCallback(val => {
        if (!val) {
            return setIsEdit(false)
        }
        setTopics(topics => {
            topics.push(val.trim())
            updateFilter(prev => ({...prev, topic: topics}))
            return topics
        })
        setIsEdit(false)
    }, [updateFilter])

    return <div>
        <span className="icon-filter"/>&nbsp;Filter by topic&emsp;
        {topics.map(topic => <span className="op-filter-condition condensed">
            &nbsp;{topic}&nbsp;
            <a href="#" className="icon-delete-circle" data-name={topic} onClick={deleteTopic}/>
        </span>)}&nbsp;
        {!isEdit && <a href="#" onClick={toggleEdit}><i className="icon-add-circle"/> Add topic</a>}
        {isEdit && <TopicFilterForm onChange={addTopic}/>}
    </div>
}

function TopicFilterForm({onChange}) {
    const [value, setValue] = useState('')

    const changeValue = useCallback(e => setValue(e.target.value), [])
    const saveValue = useCallback(() => onChange(value), [value])
    const closeForm = useCallback(() => onChange(null), [])

    const onKeyDown = useCallback(function (e) {
        if (e.key === 'Enter') {
            saveValue()
        }
        if (e.key === 'Escape') {
            closeForm()
        }
    }, [saveValue, closeForm])

    return <div className="micro-space">
        <div className="op-filter-condition condensed" style={{display: 'initial'}}>&nbsp;
            <input type="text" value={value} onChange={changeValue} onKeyDown={onKeyDown}
                   ref={useAutoFocusRef} style={{width: '100%', maxWidth: '20em'}}/>
            <a href="#" className="icon-ok" onClick={saveValue}/>
            <a href="#" className="icon-delete-circle" onClick={closeForm}/>
        </div>
    </div>
}