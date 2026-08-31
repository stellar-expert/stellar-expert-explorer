import React from 'react'

export default function DirectoryCreateIncidentView() {

    return <>
        <h2>Complaint form - phishing/scam/theft</h2>
        <div className="segment blank">
            <div>
                <p className="dimmed text-small">
                    Use this form to report illicit or fraudulent activity on Stellar Network
                </p>
                <div className="space">
                    <label>Complaint type</label>
                    <input type="text" maxLength={120} placeholder="https://..."/>
                    <div className="dimmed text-small">
                        Attach one or more screenshots to prove the malicious
                    </div>
                </div>

                <div className="space">
                    <label>
                        Malicious Stellar account address you want to report (optional)
                    </label>
                    <input type="text" maxLength={60} placeholder="G..."/>
                    <div className="dimmed text-small">
                        Provide an attacker address here if you know it. This can be a an account where your stolen funds
                        were transferred or an address from a phishing email/site/link.
                    </div>
                </div>
                <div className="space">
                    <label>
                        Link to the phishing site or
                    </label>
                    <input type="text" maxLength={120} placeholder="https://..."/>
                    <div className="dimmed text-small">
                        Attach one or more screenshots to prove the malicious
                    </div>
                </div>
                <div className="space">
                    <label>
                        Detailed information
                    </label>
                    <textarea cols="30" rows="10" maxLength={1000}/>
                    <div className="dimmed text-small">
                        Please provide additional details and relevant information about the incident
                    </div>
                </div>
            </div>
        </div>
    </>
}