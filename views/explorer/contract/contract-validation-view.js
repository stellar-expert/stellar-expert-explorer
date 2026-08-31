import React from 'react'
import {CodeBlock, usePageMetadata} from '@stellar-expert/ui-framework'

export default function ContractValidationInfoView() {
    usePageMetadata({
        title: `Contract code validation`,
        description: `Discover how to utilize GitHub Actions workflow to organize compilation and release process of Stellar smart contracts for Soroban WASM runtime with automatic validation.`
    })
    return <>
        <h2 className="condensed">
            Contract Code Validation
        </h2>
        <div className="segment blank">
            <div className="row">
                <div className="column column-50">
                    <h3>Automatic code validation</h3>
                    <p>
                        Unlike some other smart contracts platforms, Stellar doesn't store the source code of contracts in the blockchain.
                        So it's quite challenging for users to make sure that a contract they are going to invoke is not malicious
                        and behaves as advertised. To solve this problem we provide for developers an
                        automated <a href="https://github.com/stellar-expert/soroban-build-workflow">source code matching toolkit</a> based
                        on GitHub Actions workflow which provides the ability to establish a trust chain from a smart contract deployed
                        on Stellar Network to a specific commit in GitHub repository containing source code of this contract.
                        It streamlines the compilation and release process of smart contracts for Soroban WASM runtime.
                    </p>
                    <p>
                        When triggered, this workflow:
                    </p>
                    <ul className="list">
                        <li>Compiles a smart contract (or multiple contracts) in the repository</li>
                        <li>Creates an optimized WebAssembly file ready to be deployed to Soroban</li>
                        <li>Publishes GitHub release with attached build artifacts</li>
                        <li>Includes SHA256 hashes of complied WASM files into actions output for further verification</li>
                        <li>Sends binary hash, repository name, and commit to StellarExpert</li>
                    </ul>
                    <p>
                        Upon successful validation, anyone can see the associated Github repository link at StellarExpert and check the
                        original contract code. Specifically, a particular point-in-time snapshot of the source code used to build
                        the contract.
                    </p>
                </div>
                <div className="column column-50">
                    <h3>Setup (for developers)</h3>
                    <ul className="list">
                        <li>Create <code>.github/workflows/release.yml</code> workflow file in your repository</li>
                        <li>Copy-paste basic workflow configuration displayed below</li>
                        <li>Set <code>relative_path</code> or <code>make_target</code> parameters if needed</li>
                        <li>Save the workflow configuration file</li>
                        <li>Push new git tag to the repository to trigger the action</li>
                        <li>Download compiled contract binary from the "Releases" section</li>
                        <li>Deploy the contract on Stellar Network</li>
                        <li>StellarExpert immediately displays the repository link on the contract page</li>
                    </ul>
                    <CodeBlock>{exampleSingle}</CodeBlock>
                    <div className="text-small">
                        The workflow expects the following inputs:
                        <ul className="list">
                            <li>
                                <code>release_name</code> (required) - release name template (should include a release version variable)
                            </li>
                            <li>
                                <code>package</code> (optional) - package name to build, builds contract in working directory by default
                            </li>
                            <li>
                                <code>relative_path</code> (optional) - relative path to the contract source directory, defaults to the
                                repository root directory
                            </li>
                            <li>
                                <code>make_target</code> (optional) - make target to invoke, empty by default (useful for contracts
                                with dependencies that must be built before the main contract)
                            </li>
                        </ul>
                    </div>
                    <p className="text-small">
                        For more examples (building multiple contracts, alternative trigger conditions, custom workflow permissions), please
                        refer to the <a href="https://github.com/stellar-expert/soroban-build-workflow" target="_blank">workflow
                        documentation</a>.
                    </p>

                </div>

            </div>
        </div>
    </>
}

const exampleSingle =
    `name: Build and Release  # name it whatever you like
on:
  push:
    tags:
      - 'v*'  # triggered whenever a new tag (prefixed with "v") is pushed to the repository
jobs:
  release-contract-a:
    uses: stellar-expert/soroban-build-workflow/.github/workflows/release.yml@main
    with:
      release_name: $\{{ github.ref_name }}          # use git tag as unique release name
      release_description: 'Contract release'       # some boring placeholder text to attach
      relative_path: '["src/my-awesome-contract"]'  # relative path to your really awesome contract
      package: 'my-awesome-contract'                # package name to build
      make_target: 'build-dependencies'             # make target to invoke
    secrets:  # the authentication token will be automatically created by GitHub
      release_token: $\{{ secrets.GITHUB_TOKEN }}    # don't modify this line
`