import CsvGenerator from './csv-generator'

function getElementText(parent) {
    const all = []
    if (parent.attributes && parent.attributes['aria-label']) return parent.attributes['aria-label'].value
    if (!parent.childNodes.length) return parent.textContent
    for (let child of parent.childNodes) {
        all.push(getElementText(child))
    }
    return all.join('').trim()
}

function extractTextFromCells(cells) {
    return Array.from(cells)
        .filter(el => el.className.indexOf('export-ignore') < 0)
        .map(el => getElementText(el).replace(/\s{2,}/g, ' '))
}

/**
 * Export data in CSV format from the grid data.
 * @param {Element} grid - Grid HTML element to export data from.
 */
function exportGridData(grid) {
    //examine all fields and extract headers
    const headers = extractTextFromCells(grid.getElementsByTagName('th'))
    if (!headers) throw new Error('The data contains no headers.')
    const prefix = grid.getAttribute('data-export-prefix') || 'data'
    const generator = new CsvGenerator()
    //export header row
    generator.writeHeader(headers)
    const rows = Array.from(grid.getElementsByTagName('tbody')[0]
        .getElementsByTagName('tr'))
    //export records
    for (let row of rows) {
        const cells = extractTextFromCells(row.getElementsByTagName('td'))
        generator.writeRow(cells)
    }
    //initiate download
    const blob = new Blob([generator.contents], {type: 'text/csv'}),
        filename = `${prefix}-export-stellar-expert-${new Date().toISOString().replace(/\.\d*Z/, '').replace(/:/g, '-')}.csv`
    if (window.navigator.msSaveOrOpenBlob) {
        window.navigator.msSaveBlob(blob, filename)
    } else {
        const elem = window.document.createElement('a')
        elem.href = window.URL.createObjectURL(blob)
        elem.target = '_blank'
        elem.download = filename
        document.body.appendChild(elem)
        elem.click()
        document.body.removeChild(elem)
    }
}

export {exportGridData}