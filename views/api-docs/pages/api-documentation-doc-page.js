import React from 'react'
import {useParams} from '@stellar-expert/ui-framework'
import NotFoundView from '../../pages/not-found-page-view'
import ErrorNotificationBlock from '../../components/error-notification-block'
import ApiDocsView from '../api-docs-view'
import ApiPathView from '../api-path-view'
import {useApiSpec} from '../api-docs-hooks'

export default function ApiDocumentationDocPage() {
    const {doc} = useParams()
    const {spec, loaded, error} = useApiSpec(doc)

    return <ApiDocsView>
        {!loaded ?
            <div className="loader"/> :
            error ?
                <ErrorNotificationBlock>{error}</ErrorNotificationBlock> :
                !spec ?
                    <NotFoundView/> :
                    <DocContentView spec={spec}/>}
    </ApiDocsView>
}

function DocContentView({spec}) {
    return <>
        <h2>{spec.title}</h2>
        {groupByTag(spec).map(({tag, operations}) => <div key={tag}>
            {/*show the tag heading only for sections that mix several tags*/}
            {spec.tags.length > 1 && <h3 className="space">{tag}</h3>}
            {operations.map(operation => <ApiPathView key={operation.operationId} operation={operation}/>)}
        </div>)}
    </>
}

function groupByTag({operations}) {
    const groups = []
    for (const operation of operations) {
        let group = groups.find(g => g.tag === operation.tag)
        if (!group) {
            group = {tag: operation.tag, operations: []}
            groups.push(group)
        }
        group.operations.push(operation)
    }
    return groups
}
