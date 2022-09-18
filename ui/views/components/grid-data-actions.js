import React, {useState} from 'react'
import PropTypes from 'prop-types'
import {Button, ButtonGroup} from '@stellar-expert/ui-framework'
import {exportGridData} from '../../util/grid-data-exporter'
import DropdownButton from './dropdown-button'

function locateParentGrid() {
    //TODO: use element ref from parent component instead
    return document.getElementsByClassName('exportable')[0]
}

export default function GridDataActions({model, allowExport = true, allowJump = false}) {
    const [jumpPages, setJumpPages] = useState(10)

    function updatePagesInput(e) {
        let pages = parseInt(e.target.value.replace(/D+/gi, ''), 10) || 0
        if (pages < 1) {
            pages = 1
        }
        if (pages > 100) {
            pages = 100
        }
        setJumpPages(pages)
    }

    function navigate(page) {
        model.load(page)
            .then(() => {
                const grid = locateParentGrid()
                grid.parentElement.scrollIntoView({behavior: 'smooth'})
            })
    }

    return <div className="text-center space">
        <ButtonGroup>
            <Button disabled={model.loading || !model.canLoadPrevPage} onClick={() => navigate(-1)}>Prev Page</Button>
            {!!allowJump &&
                <DropdownButton disabled={model.loading || !model.canLoadPrevPage && !model.canLoadNextPage} noToggle
                                title="..." style={{minWidth: '1em'}}>{[
                    {
                        content: <div style={{padding: '1.2em 0', width: '15em', textAlign: 'center'}}>
                            Jump <input type="number" min="1" max="1000" style={{width: '6em'}}
                                        onChange={e => updatePagesInput(e)}
                                        maxLength="4" value={jumpPages}/> pages
                            <ButtonGroup className="actions">
                                <Button disabled={model.loading}
                                        onClick={() => navigate(-1 * jumpPages)}>Backward
                                </Button>
                                <Button disabled={model.loading}
                                        onClick={() => navigate(jumpPages)}>Forward
                                </Button>
                            </ButtonGroup>
                        </div>
                    }
                ]}</DropdownButton>}
            <Button disabled={model.loading || !model.canLoadNextPage}
                    onClick={() => navigate(1)}>Next Page</Button>
        </ButtonGroup>
        {allowExport && model.data.length > 0 &&
            <Button disabled={model.loading} onClick={() => exportGridData(locateParentGrid())}>Export Data</Button>}
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
    allowJump: PropTypes.bool,
    allowExport: PropTypes.bool
}