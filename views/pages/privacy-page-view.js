import React from 'react'
import {usePageMetadata} from '@stellar-expert/ui-framework'

export default function PrivacyPageView() {
    usePageMetadata({
        title: `StellarExpert Privacy Policy`,
        description: `Welcome to StellarExpert administered and maintained by Verdalinhado Unipessoal LDA.`
    })
    return <>
        <h2>Privacy Policy</h2>
        <div className="segment blank">
            <div className="dimmed text-right text-small">Last updated: 12 March 2025</div>
            <br/>
            <h3>1. INFORMATION ABOUT US</h3>
            <p>
                Welcome to StellarExpert ("StellarExpert", "Platform"). StellarExpert is administered and maintained by Verdalinhado
                Unipessoal LDA ("Company", "we," "our" or "us").
            </p>
            <p>
                By accessing or using our Platform and associated content, features, software and APIs in the Platform (collectively, the
                "Service"), you hereby irrevocably agree to be bound by this Privacy Policy and <a href="/info/tos">Terms of Service</a>.
            </p>
            <br/>
            <h3>2. PRIVACY POLICY</h3>
            <p>
                Privacy, transparency and security is of utmost importance at StellarExpert. We recognise the significance of protecting
                your information and as such we do not collect or have access to any private or sensitive data.
            </p>
            <h4>2.1. DATA COLLECTION, SECURITY AND DISCLOSURE</h4>
            <p>
                StellarExpert itself does not collect, store or access any personal data from its users. We do not use cookies, tracking
                technologies, or any form of data collection.
            </p>
            <p>
                As we do not collect any personal data, we do not process, analyze, or store user information. Our Service is designed to
                function without tracking or collecting user data.
            </p>
            <p>
                Our platform does not require account creation for the data access, and does not process blockchain secret keys,
                passphrases, or wallet recovery codes in any way.
            </p>
            <p>
                We do not share any personal or sensitive data with third parties.
            </p>
            <h4>2.2. BLOCKCHAIN DATA</h4>
            <p>
                Please take into consideration that funding and transaction information related to your use of third parties services may be
                recorded on a public blockchain. Public blockchains are distributed ledgers, intended to immutably record transactions
                across wide networks of computer systems. Many blockchains are open to forensic analysis which can compromise anonymisation
                and lead to the unintentional revelation of private financial information, especially when block chain data is combined with
                other data.
            </p>
            <p>
                Our Platform displays publicly available information retrieved from the public blockchain, but we are not able to erase,
                modify, or alter Personal Data from such networks because blockchains are decentralised or third-party networks that are not
                controlled or operated by StellarExpert or its affiliates.
            </p>
            <h4>2.3. THIRD-PARTIES DATA PROCESSING</h4>
            <p>
                Our infrastructure provider Cloudflare may collect certain types of non-personalized user data by tracking user IP
                addresses. We do not process this data in any way. Please refer to Cloudflare Terms of Use and Privacy Policy to know more
                about possible data collection.
            </p>
            <h4>2.4. YOUR RIGHTS AND CHOICES</h4>
            <p>
                As we do not collect any personal data, no action is required from users regarding data access, modification, or deletion.
            </p>
            <h4>2.5. THIRD-PARTY LINKS</h4>
            <p>
                Our Platform may contain links to third-party websites. Your use of all links to third-party websites is at your own risk.
                We do not monitor or have any control over, and make no claim or representation regarding third-party websites. To the
                extent such links are provided by us, they are provided only as a convenience, and a link to a third-party website does not
                imply our endorsement, adoption or sponsorship of, or affiliation with, such third-party websites. We are not responsible
                for their privacy practices and encourage you to review their policies.
            </p>
            <h4>2.6. ACCEPTANCE</h4>
            <p>
                By using our Services, you are agreeing to our Privacy Policy. StellarExpert reserves the right to change or amend this
                Policy at any time. If we make any material changes to this, the revised policy will be posted here so that you are always
                aware of our practices, what information we collect, how we use it and under what circumstances we disclose it. Please check
                this page to see any updates or changes to this Privacy Policy.
            </p>
            <br/>
            <h3>3. QUESTIONS AND COMPLAINTS</h3>
            <p>
                In the event that you provide us with any feedback and comments, whether via email to our Company or any postings, we thank
                you for taking the time to write to us, and your feedback and comments are appreciated.
            </p>
            <p>
                Any questions about our Privacy Policy should be directed to <a href="mailto:legal@stellar.expert">legal@stellar.expert</a>.
            </p>
        </div>
    </>
}