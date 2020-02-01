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

this.serverIdentity = identityManager.generateSimpleIdentity()

const serverAccount = this.serverIdentity.account
serverAccount.openNodeConnection()
console.log('My address: ', serverAccount.getAddress())

/** REQUESTS HANDLING */

// main page
app.get('/', (req, res) => { res.send('Server address is ', serverAccount.getAddress()) })

// send bootleg
app.post('/send-bootleg', (req, res) => {

    const symbol = req.body.symbol
    const title = req.body.title
    const artist = req.body.artist
    const descritpion = req.body.descritpion
    const contentUrl = req.body.contentUrl

    const amount = 100
    const granularity = 1
    const iconUrl = '';

    const uri = new radixdlt.RRI(this.serverIdentity.address, symbol)

    new radixdlt.RadixTransactionBuilder().createTokenSingleIssuance(
        serverAccount,
        title,
        symbol,
        descritpion,
        granularity,
        amount,
        iconUrl
    ).signAndSubmit(this.serverIdentity)
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
            console.log('bootleg added to database')

            // è necessario avere un riferimento all'account che ha inviato il bootleg

            /*
            radixdlt.RadixTransactionBuilder.createTransferAtom(
                serverAccount, bootleggerAccount, tokenUri, amount
            )*/
            res.send(uri)
        },
        error: error => {
            console.log(error)
        }
    })
})

connect().then(() => {
    app.listen(port, () => console.log(`Example app listening on port ${port}!`))
})
