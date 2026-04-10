import React, {useCallback, useState} from 'react'
import openApiData from './openapi/api.json'
import ApiDocsLayout from './api-docs-layout'
import ApiDocsMenuView from './api-docs-menu-view'
import apiComponentRefParser from './api-component-ref-parser'
import './api-docs.scss'

export const componentReference = apiComponentRefParser({...openApiData.components.schemas, ...openApiData.components.parameters})
export const apiPathList = separatePaths(openApiData.paths || {})

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
    console.log(componentReference)
    const title = <h2 style={{margin: '0.2em', width: '20em'}}>
        &nbsp;/&nbsp;API Docs <span className="dimmed text-small">({openApiData.info.version})</span></h2>
    const [menuVisible, setMenuVisible] = useState(false)
    const toggleMenu = useCallback(() => setMenuVisible(prev => !prev), [])

    return <ApiDocsLayout title={title} toggleMenu={toggleMenu}>
        <div className="row">
            <div className="column column-20">
                <h2 className="desktop-only">&nbsp;&nbsp;API Docs</h2>
                <ApiDocsMenuView pathList={apiPathList} menuVisible={menuVisible} toggleMenu={toggleMenu}/>
            </div>
            <div className="column column-80">
                {children}
            </div>
        </div>
    </ApiDocsLayout>
}