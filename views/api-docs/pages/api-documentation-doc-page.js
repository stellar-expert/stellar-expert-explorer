import React from 'react'
import {useParams} from '@stellar-expert/ui-framework'
import NotFoundView from '../../pages/not-found-page-view'
import ErrorNotificationBlock from '../../components/error-notification-block'
import ApiDocsView from '../api-docs-view'
import ApiDocsText from '../api-docs-text'
import ApiEndpointView from '../api-endpoint-view'
import ApiBreadcrumbsView from '../api-breadcrumbs-view'
import {useApiSpec} from '../api-docs-hooks'
import {operationLink, sectionIcon} from '../api-docs-catalog'

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
    return <article className="segment api-section-page">
        <ApiBreadcrumbsView/>
        <h1 className="api-page-title"><i className={'icon ' + sectionIcon(spec.slug)}/> {spec.label}</h1>
        <div className="api-docs-text api-operation-description"><ApiDocsText text={spec.summary}/></div>
        {groupByTag(spec).map(({tag, operations}) => <section key={tag} className="api-section">
            {/*show the tag heading only for sections that mix several tags*/}
            <h2 className="api-section-title">{spec.tags.length > 1 ? tag : 'Endpoints'}</h2>
            {operations.map(operation => <a key={operation.operationId} href={operationLink(spec, operation)}
                                            className="api-endpoint-card">
                <span className="api-endpoint-card-title">{operation.summary}</span>
                <ApiEndpointView method={operation.method} path={operation.path} compact/>
            </a>)}
        </section>)}
    </article>
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
