const radixdlt = require('radixdlt')

const radixUniverse = radixdlt.radixUniverse

radixUniverse.bootstrap(radixdlt.RadixUniverse.LOCALHOST_SINGLENODE)

const identityManager = new radixdlt.RadixIdentityManager()

const clientIdentity = identityManager.generateSimpleIdentity()
const clientAccount = clientIdentity.account
clientAccount.openNodeConnection()
console.log('My address: ', clientAccount.getAddress())

