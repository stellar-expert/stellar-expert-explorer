import cn from 'classnames'
import {apiPathList} from '../api-docs-view'

export default function ApiPaginationView({tag, method, id, compact}) {
    const index = apiPathList[tag]?.findIndex(path => path.data[method].operationId === id)
    const next = apiPathList[tag][index + 1]
    const prev = apiPathList[tag][index - 1]

    if (!next && !prev)
        return null

    return <div className="path-pagination space">
        <hr className="flare"/>
        <div className=" row row-no-padding space">
            {prev && <div className="column column-50">
                <a href={`/api-docs/${tag}/${method}/${prev?.data[method].operationId}`}>
                    <span><i className="icon-angle-double-left"/> {prev?.data[method].summary}</span>
                </a>
            </div>}
            {next && <div className={cn('column column-50 desktop-right', {'column-offset-50': !prev})}>
                <a href={`/api-docs/${tag}/${method}/${next?.data[method].operationId}`}>
                    <span>{next?.data[method].summary} <i className="icon-angle-double-right"/></span>
                </a>
            </div>}
        </div>
    </div>
}