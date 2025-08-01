import React, {useCallback, useRef} from 'react'
import PropTypes from 'prop-types'
import {Button, ButtonGroup} from '@stellar-expert/ui-framework'
import {exportGridData} from '../../util/grid-data-exporter'
import './grid-data-actions.scss'

function locateParentGrid(container) {
    return (container || document).getElementsByClassName('exportable')[0] ||
        (container || document).getElementsByTagName('table')[0]
}

export default function GridDataActions({model, allowExport = true}) {
    const container = useRef()
    const navigate = useCallback(function (page) {
        model.load(page)
            .then(() => {
                if (!container.current)
                    return null
                const grid = locateParentGrid(container.current.parentElement)
                grid.parentElement.scrollIntoView({behavior: 'smooth'})
            })
    }, [container.current])
    const exportData = useCallback(function () {
        exportGridData(locateParentGrid(container.current.parentElement))
    }, [container.current])

    return <div className="grid-actions text-center space relative" ref={container}>
        <ButtonGroup>
            <Button disabled={model.loading || !model.canLoadPrevPage} onClick={() => navigate(-1)}>Prev Page</Button>
            <Button disabled={model.loading || !model.canLoadNextPage} onClick={() => navigate(1)}>Next Page</Button>
        </ButtonGroup>
        {allowExport && !model.loading && model.data.length > 0 &&
            <a href="#" title="Export data" className="export-data icon icon-download-circle" onClick={exportData}/>}
    </div>
}

GridDataActions.propTypes = {
    model: PropTypes.shape({
        data: PropTypes.array.isRequired,
        canLoadNextPage: PropTypes.bool,
        canLoadPrevPage: PropTypes.bool,
        loading: PropTypes.bool,
        load: PropTypes.func
    }).isRequired,
    allowExport: PropTypes.bool
}