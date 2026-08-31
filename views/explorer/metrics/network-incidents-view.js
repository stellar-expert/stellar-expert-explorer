import React, {useEffect, useState} from 'react'
import {ElapsedTime} from '@stellar-expert/ui-framework'

export default function NetworkIncidentsView() {
    const [incidents, setIncidents] = useState([])

    useEffect(() => {
        fetch('https://9sl3dhr1twv1.statuspage.io/api/v2/incidents.json')
            .then(res => res.json())
            .then(res => setIncidents(res.incidents))
    }, [])

    if (!incidents)
        return <div className="loader"/>

    return <div className="segment blank">
        <h3>Incidents</h3>
        <table className="table exportable space">
            <thead>
            <tr>
                <th>Description</th>
                <th className="text-right nowrap">Time Ago</th>
            </tr>
            </thead>
            <tbody className="condensed">
            {incidents.map(incident => <tr key={incident.id}>
                <td data-header="Description: ">
                    <a href={incident.shortlink} target="_blank">{incident.name}</a></td>
                <td data-header="Time Ago: " className="text-right nowrap">
                    (<ElapsedTime ts={new Date(incident.updated_at)} suffix=" ago"/>)</td>
            </tr>)}
            </tbody>
        </table>
    </div>
}