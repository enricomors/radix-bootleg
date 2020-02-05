const radixdlt = require('radixdlt')
const express = require('express')
const app = express()
const path = require('path')
const port = 8000

const radixUniverse = radixdlt.radixUniverse

radixUniverse.bootstrap(radixdlt.RadixUniverse.LOCALHOST_SINGLENODE)

const identityManager = new radixdlt.RadixIdentityManager()

const clientIdentity = identityManager.generateSimpleIdentity()
const clientAccount = clientIdentity.account
clientAccount.openNodeConnection()
console.log('My address: ', clientAccount.getAddress())

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/public/index.html'))
})

app.listen(port, () => {
    console.log(`Example client listening on port ${port}!`)
})

