import express from 'express';
import { radixUniverse, RadixUniverse, RadixIdentity, RRI, RadixIdentityManager, RadixKeyStore, RadixTransactionBuilder, RadixAccount } from 'radixdlt';
import models, { connectDb } from './models'
import fs from 'fs-extra';
import cors from 'cors';
import bodyParser from 'body-parser';

const app: express.Application = express()
const port: number = Number(process.env.PORT) || 3001
app.use(cors())
app.use(bodyParser.json())

const identityManager = new RadixIdentityManager()
const keyStorePsw = 'ServerPassword'
const KeyStorePath = 'server-keystore.json'

let serverIdentity: RadixIdentity

radixUniverse.bootstrap(RadixUniverse.BETANET_EMULATOR)

connectDb().then(() => {
  loadIdentity().then(() => {
    subscribeForPurchases()
    app.listen(port, (err: Error) => {
      if (err) {
        console.error('Error starting server ', err);          
      } else {
        console.log('NODE_ENV = ', process.env.NODE_ENV)
      }
    })
  }).catch((err: Error) => {
    console.log('Error loading/creating identity ', err)
  })
}).catch((err: Error) => {
  console.log('Error connecting to database ', err);
})

app.get('/bootlegs', async (req, res) => {
  models.Bootleg.find({}, '-contentUrl', (err, bootlegs) => {
    if (err) {
      res.status(400).send(err)
      return
    }
    res.send(bootlegs)
  })
})

app.post('/save-bootleg', async (req, res) => {

  const tokenUri = req.body.uri
  const title = req.body.title
  const artist = req.body.artist
  const price = req.body.price
  const description = req.body.description
  const contentUrl = req.body.contentUrl
  const bootlegger = req.body.bootlegger

  try {
    const bootleg = new models.Bootleg({
      tokenUri,
      title,
      artist,
      price,
      description,
      contentUrl,
      bootlegger
    })
    await bootleg.save()
    res.send(tokenUri)
    console.log('Saved to db');
  } catch (e) {
    console.log(e);
    res.status(400).send(e.message)
  }
})

app.get('/request-address', (req, res) => {
  const serverAddress = serverIdentity.address
  res.send({ address: serverAddress.toString() })
})

app.post('/send-recipients', (req, res) => {
  
})

async function loadIdentity() {

  /* Can use this only on client side
  const artistKeyStore = localStorage.getItem('artist')
  const bootleggerKeyStore = localStorage.getItem('bootlegger')
  */
  if (fs.existsSync(KeyStorePath)) {
    const serverKeystore = await fs.readJSON(KeyStorePath)
    const serverAddress = await RadixKeyStore.decryptKey(serverKeystore, keyStorePsw)
    serverIdentity = identityManager.addSimpleIdentity(serverAddress)
    await serverIdentity.account.openNodeConnection()

    console.log('Server identity loaded');
  } else {
    generateIdentity().catch(error => {
      console.error('Error generating identities ', error)
    })
  }
}

async function generateIdentity() {
  // artist
  serverIdentity = identityManager.generateSimpleIdentity()
  await serverIdentity.account.openNodeConnection()
  const serverKeystore = await RadixKeyStore.encryptKey(serverIdentity.address, keyStorePsw)
  await fs.writeJSON(KeyStorePath, serverKeystore)
  console.log('Artist identity created')
}

function subscribeForPurchases() {
  const bltToken = 

  serverIdentity.account.transferSystem.getTokenUnitsBalanceUpdates().subscribe(balance => {

  })
}