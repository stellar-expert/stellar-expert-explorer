import React from 'react'
import {StrKey} from 'stellar-sdk'
import {Button} from '@stellar-expert/ui-framework'
import Dropdown from '../components/dropdown'
import TaxInfoExporter from '../../business-logic/tax-info-exporter'
import {setPageMetadata} from '../../util/meta-tags-generator'

const yearOptions = []
for (let i = new Date().getFullYear(); i >= 2016; i--) {
    yearOptions.push({value: i, title: i.toString()})
}

class TaxDataExportView extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            year: new Date().getFullYear() - 1,
            pk: '',
            exportFees: false,
            isValid: false,
            inProgress: false,
            files: null,
            errors: null
        }
    }

    componentDidMount() {
        setPageMetadata({
            title: `Tax data export for Stellar network`,
            description: `Free payments and trades tax data export for Stellar network in BitcoinTax-compatible format.`
        })
    }

    setPublicKey(pk) {
        const v = pk.trim(),
            isValid = StrKey.isValidEd25519PublicKey(v)
        this.setState({pk: v, isValid})
    }

    setYear(year) {
        this.setState({year})
    }

    exportData() {
        const {pk, year, exportFees} = this.state
        const exporter = new TaxInfoExporter(pk, year)
        exporter.exportFees = exportFees
        this.setState({inProgress: true, files: null, errors: null})
        exporter.export()
            .then(files => {
                this.setState({
                    inProgress: false,
                    //convert raw strings to blobs
                    files: files.map(f => {
                        if (!f.contents) return {name: f.name}
                        const blob = new Blob([f.contents], {type: 'text/csv'})
                        return {
                            name: f.name,
                            size: Math.ceil(blob.size / 1024),
                            contents: window.URL.createObjectURL(blob)
                        }
                    })
                })
            })
            .catch(err => {
                this.setState({inProgress: false, errors: err.stack})
            })
    }

    renderSettings() {
        const {pk, year, exportFees, isValid, inProgress} = this.state
        return <>
            <div>
                <div style={{lineHeight: 3}}>
                    Select tax year:&nbsp;
                    <Dropdown disabled={inProgress} value={year} options={yearOptions}
                              onChange={year => this.setYear(year)}/>
                </div>
                <label>
                    Provide your account public key:<br/>
                    <input disabled={inProgress} type="text" onChange={e => this.setPublicKey(e.target.value)}
                           value={pk}
                           style={{width: '33em', fontFamily: 'monospace'}} autoFocus
                           placeholder="for example, GADL...0H5M"/>
                </label>
                <label>
                    <input onChange={e => this.setState({exportFees: e.target.checked})} type="checkbox"
                           checked={exportFees}/> Export transaction fees
                </label>
            </div>
            <div className="actions space">
                <Button onClick={e => this.exportData()} disabled={!isValid || inProgress}>Export data</Button>
            </div>
        </>
    }

    renderProgress() {
        if (this.state.inProgress) return <div className="text-center">
            <div className="loader"/>
            Exporting trades and payments. <br/>
            Please wait.
        </div>
    }

    renderFiles() {
        const {files} = this.state
        if (files) return <div className="space">
            {files.map(f => <div key={f.name}>
                {f.contents ? <a href={f.contents} download={f.name} target="_blank"
                                 style={{
                                     padding: '0.5em 1em',
                                     border: '1px solid',
                                     margin: '0.2em 0',
                                     display: 'inline-block'
                                 }}>
                    Download {f.name} ({f.size}KB)
                </a> : <span className="dimmed" style={{
                    padding: '0.5em 0',
                    margin: '0.2em 0',
                    display: 'inline-block'
                }}>{f.name}</span>}
            </div>)}
            <div className="space info-box text-small">
                <b>Note</b>: BitcoinTax or any other external software may incorrectly interpret transfers between your
                wallets or your Stellar account and exchange, which may result in a double counting. However, transfers
                between your own wallets is not a taxable event, so please double check the data once imported.
            </div>
        </div>
    }

    renderErrors() {
        const {errors} = this.state
        if (errors) return <div className="space">
            <pre style={{color: 'red'}}>{errors}</pre>
        </div>
    }

    render() {
        return <div className="container narrow">
            <div className="card">
                <h3>Tax Data Export</h3>
                <hr/>
                <ul className="list checked space">
                    <li>BitcoinTax-compatible data export format.</li>
                    <li>Separate export files for income, spending, and trades.</li>
                    <li>Inflation payouts classified as "mining" profits.</li>
                    <li>All dates are represented as UTC timestamps.</li>
                    <li>Optional transaction fees export.</li>
                    <li>Fully anonymous and free of charge.</li>
                </ul>
                <div className="dimmed">
                    The service is free and provided as-is, without warranties. The responsibility of checking the
                    accuracy
                    of tax reports lies on users.
                </div>
            </div>
            <div className="card space">
                <h3>Export</h3>
                <hr/>
                {this.renderSettings()}
                {this.renderProgress()}
                {this.renderFiles()}
                {this.renderErrors()}
            </div>
        </div>
    }
}

export default TaxDataExportView