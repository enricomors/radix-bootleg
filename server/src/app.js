const express = require('express')
const app = express()
const port = 3000
const radixdlt = require('radixdlt')
const db = require('./models/index')

const model = db.Bootleg
const connect = db.connectDb

const radixUniverse = radixdlt.radixUniverse

radixUniverse.bootstrap(radixdlt.RadixUniverse.LOCALHOST_SINGLENODE)

const identityManager = new radixdlt.RadixIdentityManager()

const serverIdentity = identityManager.generateSimpleIdentity()

const serverAccount = serverIdentity.account
serverAccount.openNodeConnection()
console.log('My address: ', serverAccount.getAddress())

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
    const artist = req.body.artist
    const descritpion = req.body.descritpion
    const contentUrl = req.body.contentUrl

    // sender address
    const sender = req.body.sender

    // token information
    const amount = 100
    const granularity = 1
    const iconUrl = req.body.iconUrl;

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
                contentUrl
            })
            await bootleg.save()
            console.log('Bootleg added to database')

            const bootleggerAccount = radixdlt.RadixAccount.fromAddress(sender)

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

connect().then(() => {
    app.listen(port, () => console.log(`Example app listening on port ${port}!`))
})
