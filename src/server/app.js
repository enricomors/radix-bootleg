const express = require('express')
const app = express()
const port = 3000
const radixdlt = require('radixdlt')

const radixUniverse = radixdlt.radixUniverse
const ALPHANET = radixdlt.RadixUniverse.ALPHANET
const RadixIdentityManager = radixdlt.RadixIdentityManager

radixUniverse.bootstrap(ALPHANET)

const identityManager = new RadixIdentityManager()

this.myIdentity = identityManager.generateSimpleIdentity()

const myAccount = this.myIdentity.account
myAccount.openNodeConnection()
console.log('My address: ', myAccount.getAddress())

app.get('/', (req, res) => res.send(`My address is ${myAccount.getAddress()}`))

app.get('/balance', (req, res) => res.send(myAccount.transferSystem.balance))

app.get('/transfers', (req, res) => res.send(myAccount.transferSystem.transactions))


app.listen(port, () => console.log(`Example app listening on port ${port}!`))