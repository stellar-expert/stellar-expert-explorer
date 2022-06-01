class CsvGenerator {
    constructor() {

    }

    /**
     * File contents.
     * @type {string}
     */
    contents = ''

    /**
     * Whether header has been written or not.
     * @type {boolean}
     */
    headerWritten = false

    /**
     * Max columns (defined by header).
     * @type {number}
     */
    columns = 0
    /**
     *
     * @param {Array<String>} columnHeaders - Header for each column.
     */
    writeHeader(columnHeaders) {
        if (this.headerWritten) throw new Error('Header has been written already.')
        this.headerWritten = true
        this.columns = columnHeaders.length || 0
        this.writeRow(columnHeaders)
    }

    writeRow(values) {
        if (!this.headerWritten) throw new Error('Header not found.')
        if (!(values instanceof Array)) throw new Error('Array of values expected.')
        let row = values
            .map(value => {
                //check if a value should be enclosed into double-quotes
                if (!/[\r\n,"]/.test(value)) return value
                return `"${value.replace(/"/g, '""')}"`
            })
            .join(',')
        this.contents += row + '\r\n'
    }
}

export default CsvGenerator