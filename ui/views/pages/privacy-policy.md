# Privacy Policy

*Last updated: 6 April 2026*

## 1. INFORMATION ABOUT US

Welcome to StellarExpert ("StellarExpert", "Platform"). StellarExpert is administered and maintained by Verdalinhado
Unipessoal LDA ("Company", "we," "our" or "us").

By accessing or using our Platform and associated content, features, software, and APIs in the Platform (collectively,
the "Service"), you hereby irrevocably agree to be bound by this Privacy Policy and
[Terms of Service](/info/tos).

## 2. PRIVACY POLICY

Privacy, transparency, and security are of the utmost importance at StellarExpert. We recognize the significance of
protecting your information. Our approach to data collection follows the principle of data minimization: we collect only
what is strictly necessary for each tier of the Service, and nothing more.

### 2.1. DATA COLLECTION

**Public (unauthenticated) access.** The unauthenticated, public tier of the Service does not require account
creation and does not collect, store, or access any personal data. We do not use cookies or tracking technologies for
public-tier users. No registration, log-in, or identification is required to browse the Platform or access rate-limited
public API endpoints.

**Authenticated API Access.** If you choose to register for authenticated API access, we collect and process a limited
set of data as described in Section 2.2 below. This data is collected solely for the purposes of providing, securing,
and billing the Service.

**General.** StellarExpert does not process blockchain secret keys, passphrases, or wallet recovery codes in any way.
We do not use cookies, browser fingerprinting, or client-side tracking technologies.

### 2.2. API ACCOUNT AND ACCESS DATA

When you register for authenticated API access, the following data is collected and processed:

| Data category               | What we store                                                                | Purpose                                                          | Legal basis                                   |
|-----------------------------|------------------------------------------------------------------------------|------------------------------------------------------------------|-----------------------------------------------|
| Email address               | Stored in our systems                                                        | Account identification, service communications and notifications | Performance of contract                       |
| Authentication data         | Managed by Auth0 (see §2.4); we use only an opaque user identifier           | Secure login, API Key issuance                                   | Performance of contract                       |
| API Key                     | Verification hash only; raw key is displayed once at creation and not stored | Request authentication                                           | Performance of contract                       |
| Aggregated usage statistics | Request counters, distribution, error rates; without personal identifiers    | Billing verification, service improvement, capacity planning     | Performance of contract / Legitimate interest |

**Rate limiting and IP addresses.** The IP address itself is never written to persistent storage, logged, or retained in
any form. API request rate limiting is implemented using a Count-Min Sketch probabilistic algorithm that contains no IP
addresses, no hashes of IP addresses, and no data from which an IP address or any other personal identifier could be
recovered or inferred. The counter rate limiting matrix is reset at the start of each rate-limiting window. As a result,
this mechanism does not constitute processing of personal user data.

### 2.3. PAYMENT DATA

Paid API subscriptions are processed by **Paddle.com Market Limited** ("Paddle"), which acts as the Merchant of Record
for all transactions. Paddle collects and processes payment information (including name, billing address, payment card
details, and VAT identification numbers) directly. The Company does not receive, access, or store payment card numbers,
bank account details, or other sensitive financial information.

Paddle may share with us a limited set of transaction data (subscription status, plan tier, transaction identifiers,
country of billing) for the purposes of account provisioning and reconciliation. For details on how Paddle handles
personal data, please refer to the [Paddle Privacy Policy](https://www.paddle.com/legal/privacy).

### 2.4. THIRD-PARTY PROCESSORS AND SERVICES

The Service relies on the following third-party providers, each of which may process limited data on our behalf or as
independent controllers:

| Provider                      | Services used                                   | Data processed                                                                                                  | Role                                                          | Privacy policy                                                            |
|-------------------------------|-------------------------------------------------|-----------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------|---------------------------------------------------------------------------|
| **Cloudflare, Inc.**          | Pages, DNS, WAF, HTTP Traffic Analytics         | IP addresses, request metadata, TLS connection data — processed transiently for security and traffic management | Data processor / independent controller for WAF and analytics | [cloudflare.com/privacypolicy](https://www.cloudflare.com/privacypolicy/) |
| **Auth0 (Okta, Inc.)**        | Identity and authentication for API accounts    | Email address, authentication credentials, login metadata (IP, device type, timestamps)                         | Data processor                                                | [auth0.com/privacy](https://auth0.com/privacy)                            |
| **Paddle.com Market Limited** | Subscription billing, invoicing, tax compliance | Name, email, billing address, payment card details, VAT ID, transaction history                                 | Independent controller (Merchant of Record)                   | [paddle.com/legal/privacy](https://www.paddle.com/legal/privacy)          |

Where a third party acts as a data processor on our behalf, appropriate Data Processing Agreements (DPAs) are in place.
We do not use any third-party analytics, advertising, or tracking services beyond those listed above.

### 2.5. DATA RETENTION

We retain personal data only for as long as necessary for the purposes described in this Policy:

| Data category                                | Retention period                                     |
|----------------------------------------------|------------------------------------------------------|
| Account data (email, user ID)                | Duration of the account plus 12 months post-deletion |
| Aggregated usage statistics (per API Key)    | Duration of the account plus 12 months post-deletion |
| Billing and invoice records (held by Paddle) | As required by applicable tax and accounting law     |

API rate-limiting counters are not included in this schedule as they do not contain personal data.

After the applicable retention period, all aforementioned data is deleted or irreversibly anonymized.

### 2.6. YOUR RIGHTS

**Public-tier users.** If you use the Service only through the unauthenticated public tier, we do not hold any personal
data about you, and no action is required.

**Registered API users.** If you have registered for an API account, you have the following rights under
applicable regulations:

- **Access** — You may request confirmation of whether we process your personal data and, if so, obtain a copy of it.
- **Rectification** — You may request correction of inaccurate personal data.
- **Erasure** — You may request deletion of your personal data where it is no longer necessary for the purposes for
  which it was collected, or where you withdraw consent. Note that we may retain billing records as required by fiscal
  laws.
- **Restriction** — You may request restriction of processing in circumstances defined by local legislation.
- **Data portability** — You may request to receive your personal data in a structured, machine-readable format.
- **Objection** — You may object to processing based on legitimate interest at any time. We will cease processing unless
  we demonstrate compelling legitimate grounds.

To exercise any of these rights, please contact us at [legal@stellar.expert](mailto:legal@stellar.expert). We will
respond within 30 days.

You also have the right to lodge a complaint with the Portuguese data protection authority: **Comissão Nacional de
Proteção de Dados (CNPD)**, [www.cnpd.pt](https://www.cnpd.pt).

### 2.7. THIRD-PARTY LINKS

Our Platform may contain links to third-party websites. Your use of all links to third-party websites is at your own
risk. We do not monitor or have any control over, and make no claim or representation regarding third-party websites. To
the extent such links are provided by us, they are provided only as a convenience, and a link to a third-party website
does not imply our endorsement, adoption or sponsorship of, or affiliation with, such third-party websites. We are not
responsible for their privacy practices and encourage you to review their policies.

### 2.8. INTERNATIONAL DATA TRANSFERS

Some of the third-party processors listed in Section 2.4 are established in the United States (Cloudflare, Inc. and
Okta, Inc. / Auth0). Where personal data is transferred outside the European Economic Area, such transfers are
protected by appropriate safeguards, including the EU–US Data Privacy Framework (where the processor is certified),
Standard Contractual Clauses approved by the European Commission, or other legally recognized transfer mechanisms under
GDPR policy.

### 2.9. DATA CONTROLLER

The data controller for personal data processed through the Service is:

**Verdalinhado Unipessoal LDA**, registered in Portugal.  
Contact: [legal@stellar.expert](mailto:legal@stellar.expert)

For data protection inquiries specifically, you may contact us at the same address.

### 2.10. ACCEPTANCE

By using our Services, you are agreeing to our Privacy Policy. StellarExpert reserves the right to change or amend this
Policy at any time. If we make any material changes to this Policy, the revised policy will be posted here so that you
are always aware of our practices, what information we collect, how we use it and under what circumstances we disclose
it. Registered API users will be notified of material changes by email at least fifteen (15) days before such changes
take effect. Please check this page to see any updates or changes to this Privacy Policy.

### 2.11. BLOCKCHAIN DATA

Please take into consideration that funding and transaction information related to your use of third parties services
may be recorded on a public blockchain. Public blockchains are distributed ledgers, intended to immutably record
transactions across wide networks of computer systems. Many blockchains are open to forensic analysis which can
compromise anonymisation and lead to the unintentional revelation of private financial information, especially when
blockchain data is combined with other data.

Our Platform displays publicly available information retrieved from the public blockchain, but we are not able to erase,
modify, or alter Personal Data from such networks because blockchains are decentralised or third-party networks that are
not controlled or operated by StellarExpert or its affiliates.

## 3. QUESTIONS AND COMPLAINTS

In the event that you provide us with any feedback and comments, whether via email to our Company or any postings, we
thank you for taking the time to write to us, and your feedback and comments are appreciated.

Any questions about our Privacy Policy should be directed to [legal@stellar.expert](mailto:legal@stellar.expert).