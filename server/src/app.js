const express = require('express')
const app = express()
const port = 3000

const radixdlt = require('radixdlt')
const db = require('./models/index')
const fs = require('fs-extra')

const model = db.Bootleg
const connect = db.connectDb

const radixUniverse = radixdlt.radixUniverse

radixUniverse.bootstrap(radixdlt.RadixUniverse.LOCALHOST_SINGLENODE)

const identityManager = new radixdlt.RadixIdentityManager()
let serverIdentity

// generate server identity and store it to a file
const RadixKeyStore = radixdlt.RadixKeyStore
const password = "SuperSecretPassword"
const keystorePath = 'keystore.json'

/** Store and recover account */
async function loadIdentity() {
    if (fs.existsSync(keystorePath)) {
        // load account
        const contents = await fs.readJSON(keystorePath)
        const address = await RadixKeyStore.decryptKey(contents, password)
        const serverIdentity = identityManager.addSimpleIdentity(address)
        await serverIdentity.account.openNodeConnection()

        console.log('Loaded identity')
        return serverIdentity
    } else {
        const serverIdentity = identityManager.generateSimpleIdentity()
        await serverIdentity.account.openNodeConnection()
        const contents = await RadixKeyStore.encryptKey(serverIdentity.address, password)
        await fs.writeJSON(keystorePath, contents)

        console.log('Generated new identity')
        return serverIdentity
    }
}

/** Handle buying a bootleg */
function subscribeForPurchases() {
    console.log('Subscribed for purchases')
}

/** REQUESTS HANDLING */

// main page
app.get('/', (req, res) => { 
    res.send('Server address is ', serverAccount.getAddress()) 
})

// send bootleg
app.post('/send-bootleg', (req, res) => {

    // bootleg information
    const symbol = req.body.symbol
    const title = req.body.title
    const artist = req.body.artist // artist address
    const descritpion = req.body.descritpion
    const contentUrl = req.body.contentUrl

    // bootlegger address
    const bootlegger = req.body.sender

    // token information
    const amount = 100
    const granularity = 1
    const iconUrl = '';

    const uri = new radixdlt.RRI(serverIdentity.address, symbol)

    new radixdlt.RadixTransactionBuilder().createTokenSingleIssuance(
        serverAccount,
        title,
        symbol,
        descritpion,
        granularity,
        amount,
        iconUrl
    ).signAndSubmit(serverIdentity)
    .subscribe({
        next: status => { console.log(status) },
        complete: async () => {
            const bootleg = new model({
                tokenUri: uri.toString(),
                title,
                artist,
                descritpion,
                contentUrl,
                bootlegger
            })
            await bootleg.save()
            console.log('Bootleg added to database')

            // get bootlegger account from address
            const bootleggerAccount = radixdlt.RadixAccount.fromAddress(bootlegger)

            /** Transfer tokens to the bootlegger */
            radixdlt.RadixTransactionBuilder.createTransferAtom(
                serverAccount, bootleggerAccount, tokenUri, amount
            ).signAndSubmit(serverIdentity)
            .subscribe({
                complete: () => {
                    console.log('Tokens sent to bootlegger')
                    res.send(uri)
                }
            })
        },
        error: err => {
            console.log(err, 'Error during token creation')
        }
    })
})

connect()
.then(() => {
    return loadIdentity()
}).then(_identity => {
    serverIdentity = _identity
    subscribeForPurchases()
})
