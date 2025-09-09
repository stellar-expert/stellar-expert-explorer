import React from 'react'
import openApiData from '../openapi.json'
import parseDocumentationText from '../parsers/parse-documentation-text'
import ApiDocsView from '../api-docs-view'

export default function ApiDocsIntroPage() {

    return <ApiDocsView>
        <div className="row">
            <div className="column column-60">
                <div className="segment blank">
                    {parseDocumentationText(openApiData.info.description)}
                </div>
            </div>
        </div>
    </ApiDocsView>
}