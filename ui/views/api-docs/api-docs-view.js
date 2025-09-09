import React, {useCallback, useState} from 'react'
import ApiDocsLayout from './api-docs-layout'
import ApiDocsMenuView from './api-docs-menu-view'
import parseComponentReferences from './parsers/parse-component-references'
import schema from './openapi.json'
import './api-docs.scss'

export const componentReferences = parseComponentReferences(schema, {...schema.components.schemas, ...schema.components.parameters})
export const apiPathList = separatePaths(schema.paths || {})

function separatePaths(paths) {
    const separatedPaths = {}
    Object.entries(paths).forEach(([path, methods]) => {
        Object.values(methods || {}).forEach(data => {
            if (!separatedPaths[data.tags[0]]) {
                separatedPaths[data.tags[0]] = []
            }
            separatedPaths[data.tags[0]].push({
                path,
                data: methods
            })
        })
    })
    return separatedPaths
}

export default function ApiDocsView({children}) {
    const title = <h1 style={{margin: '0 1rem'}}>
        {schema.info.title} <span className="dimmed text-small">({schema.info.version})</span></h1>
    const [menuVisible, setMenuVisible] = useState(false)
    const toggleMenu = useCallback(() => setMenuVisible(prev => !prev), [])

    return <ApiDocsLayout title={title} toggleMenu={toggleMenu}>
        <div className="row">
            <div className="column column-20">
                <div className="space"></div>
                <ApiDocsMenuView pathList={apiPathList} menuVisible={menuVisible} toggleMenu={toggleMenu}/>
            </div>
            <div className="column column-80">
                <div className="space"></div>
                {children}
            </div>
        </div>
    </ApiDocsLayout>
}