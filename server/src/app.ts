import express from 'express';
import { radixUniverse, RadixUniverse, RadixIdentity, RRI, RadixIdentityManager, RadixKeyStore, RadixTransactionBuilder } from 'radixdlt';
import models, { connectDb } from './models'
import fs from 'fs-extra';

const app: express.Application = express()
const port: number = Number(process.env.PORT) || 3001

const identityManager = new RadixIdentityManager()
const keyStorePsw = 'SuperSecretPassword'
const artistKeyStorePath = 'artist-keystore.json'
const bootleggerKeyStorePath = 'bootlegger-keystore.json'

let artistIdentity: RadixIdentity
let bootleggerIdentity: RadixIdentity

radixUniverse.bootstrap(RadixUniverse.BETANET_EMULATOR)

connectDb().then(() => {
  loadIdentities().then(() => {
    app.listen(port, (err: Error) => {
      if (err) {
        console.error('Error starting server ', err);          
      } else {
        console.log('NODE_ENV = ', process.env.NODE_ENV)
      }
    })
  }).catch((err: Error) => {
    console.log('Error loading/creating identities ', err)
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

  const uri = req.body.uri
  const title = req.body.title
  const artist = req.body.artist
  const description = req.body.description
  const contentUrl = req.body.contentUrl
  const bootlegger = req.body.bootlegger

  try {
    const bootleg = new models.Bootleg({
      tokenUri: uri.toString(),
      title,
      artist,
      description,
      contentUrl,
      bootlegger
    })
    await bootleg.save()
    res.send(uri)
    console.log('Saved to db');
  } catch (e) {
    console.log(e);
    res.status(400).send(e.message)
  }
})

async function loadIdentities() {

  /* Can use this only on client side
  const artistKeyStore = localStorage.getItem('artist')
  const bootleggerKeyStore = localStorage.getItem('bootlegger')
  */
  if (fs.existsSync(artistKeyStorePath) && fs.existsSync(bootleggerKeyStorePath)) {
    // artist
    const artistKeyStore = await fs.readJSON(artistKeyStorePath)
    const artistAddress = await RadixKeyStore.decryptKey(artistKeyStore, keyStorePsw)
    artistIdentity = identityManager.addSimpleIdentity(artistAddress)
    await artistIdentity.account.openNodeConnection()
    console.log('Artist identity loaded');

    // bootlegger
    const bootleggerKeyStore = await fs.readJSON(bootleggerKeyStorePath)
    const bootleggerAddress = await RadixKeyStore.decryptKey(bootleggerKeyStore, keyStorePsw)
    bootleggerIdentity = identityManager.addSimpleIdentity(bootleggerAddress)
    await bootleggerIdentity.account.openNodeConnection()
    console.log('Bootlegger identity loaded');

  } else {
    generateIdentites().catch(error => {
      console.error('Error generating identities ', error)
    })
  }
}

async function generateIdentites() {
  // artist
  artistIdentity = identityManager.generateSimpleIdentity()
  await artistIdentity.account.openNodeConnection()
  const artistKeyStore = await RadixKeyStore.encryptKey(artistIdentity.address, keyStorePsw)
  await fs.writeJSON(artistKeyStorePath, artistKeyStore)
  console.log('Artist identity created')

  // bootlegger
  bootleggerIdentity = identityManager.generateSimpleIdentity()
  await bootleggerIdentity.account.openNodeConnection()
  const bootleggerKeyStore = await RadixKeyStore.encryptKey(bootleggerIdentity.address, keyStorePsw)
  await fs.writeJSON(bootleggerKeyStorePath, bootleggerKeyStore)
  
  // localStorage.setItem('artist', JSON.stringify(bootleggerKeyStore))
  console.log('Bootlegger identity created')
}

async function mockBootlegCreation() {
  const symbol = 'PTV'
  const title = 'Pierce The Veil - Live at Reading Full (2015)'
  const description = 'The full 27 minute set'
  const contentUrl = 'https://www.youtube.com/watch?v=gHqYX_NWhOk&t=847s'

  const artist = artistIdentity.address.toString
  const bootlegger = bootleggerIdentity.address.toString

  const amount = 20
  const granularity = 1
  const iconUrl = 'https://i.pinimg.com/originals/3d/74/f7/3d74f7ad35752ccce93081980bc3ac55.jpg'

  const uri = new RRI(artistIdentity.address, symbol)

  new RadixTransactionBuilder().createTokenSingleIssuance(
    artistIdentity.account,
    title,
    symbol,
    description,
    granularity,
    amount,
    iconUrl
  ).signAndSubmit(artistIdentity)
  .subscribe({
    next: status => { console.log(status) },
    complete: async () => {
      // save bootleg to database
      const bootleg = new models.Bootleg({
        tokenUri: uri.toString(),
        title,
        artist,
        description,
        contentUrl,
        bootlegger
      })
      await bootleg.save()
      console.log('Bootleg added to database')
      
      // sends token to bootlegger
      RadixTransactionBuilder.createTransferAtom(
        artistIdentity.account,
        bootleggerIdentity.account,
        uri.toString(),
        amount
      ).signAndSubmit(artistIdentity)
      .subscribe({
        complete: () => {
          console.log('Tokens sent to bootlegger')
        },
        error: err => {
          console.error('Error sending tokens ', err);
        }
      })
    },
    error: err => {
      console.error('Error during token creation ', err);
    }
  })
}