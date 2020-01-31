const express = require('express')
const app = express()
const port = 3000
const radixdlt = require('radixdlt')
const db = require('./models/index')

const model = db.Bootleg
const connect = db.connectDb

const radixUniverse = radixdlt.radixUniverse
const LOCALHOST_SINGLENODE = radixdlt.RadixUniverse.LOCALHOST_SINGLENODE
const RadixIdentityManager = radixdlt.RadixIdentityManager

radixUniverse.bootstrap(LOCALHOST_SINGLENODE)

const identityManager = new RadixIdentityManager()

this.serverIdentity = identityManager.generateSimpleIdentity()

const serverAccount = this.serverIdentity.account
serverAccount.openNodeConnection()
console.log('My address: ', serverAccount.getAddress())

/** REQUESTS HANDLING */

// main page
app.get('/', (req, res) => { res.send('Server address is ', serverAccount.getAddress()) })

// send bootleg
app.post('/send-bootleg', (req, res) => {
    
})

connect().then(() => {
    app.listen(port, () => console.log(`Example app listening on port ${port}!`))
})
