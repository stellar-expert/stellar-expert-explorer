import {Button} from '@stellar-expert/ui-framework'
import cn from 'classnames'
import {formatPath} from '../api-docs-menu-view'

export default function ApiPaginationView({apiPathList = [], docName, method, id}) {
    const index = apiPathList.findIndex(path => formatPath(path.data[method].operationId) === id)
    const next = apiPathList[index + 1]
    const prev = apiPathList[index - 1]

    if (!next && !prev)
        return null

    return <div className="path-pagination row row-no-padding double-space">
        {prev && <div className="column column-50">
            <Button href={`/api-docs/${docName}/${method}/${formatPath(prev?.data[method].operationId)}`}>
                <span>Prev: {prev?.data[method].summary}</span>
            </Button>
        </div>}
        {next && <div className={cn('column column-50', {'column-offset-50': !prev})}>
            <Button href={`/api-docs/${docName}/${method}/${formatPath(next?.data[method].operationId)}`} >
                <span>Next: {next?.data[method].summary}</span>
            </Button>
        </div>}
    </div>
}