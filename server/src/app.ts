import express from 'express';
import { radixUniverse, 
  RadixUniverse, 
  RadixIdentity, 
  RRI, 
  RadixIdentityManager,
  RadixKeyStore, 
  RadixTransactionBuilder, 
  RadixAccount } from 'radixdlt';
import models, { connectDb } from './models'
import fs from 'fs-extra';
import cors from 'cors';
import bodyParser from 'body-parser';
import { stat } from 'fs';
import { error } from 'util';

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
  const tokenUri: string = req.body.tokenUri
  const artist: string = req.body.artist
  const bootlegger: string = req.body.bootlegger
  const franchisors: [string] = req.body.franchisors
  const newFranchisor: string = req.body.newFranchisor
  const bootlegPrice: number = req.body.price

  sendPayment(franchisors, newFranchisor, artist, bootlegger, bootlegPrice)
    .then(() => {
      updateFranchisors(tokenUri, franchisors, newFranchisor, bootlegger)
      res.status(200).send({ message: 'Payment completed'})
    })
    .catch(error => {
      console.error(error)
      res.status(400).send({ message: error.message})
    })
})

async function sendPayment(franchisors: [string], newFranchisor: string, artist: string, bootlegger: string, price: number) {
  
  franchisors.push(bootlegger)
  franchisors.push(artist)

  const dividedPrice = (price/franchisors.length).toString()
  console.log(dividedPrice);
  
  for (let i = 0; i < franchisors.length; i++) {
    const franchisor = franchisors[i]
    
    const franchisorAccount = RadixAccount.fromAddress(franchisor)
    const tokenUri = `/${newFranchisor}/BTL`

    await pay(franchisorAccount, tokenUri, dividedPrice)
  }
}

async function pay(franchisorAccount: RadixAccount, tokenUri: string, amount: string): Promise<string> {
  const serverAccount = serverIdentity.account
  const transaction = RadixTransactionBuilder
    .createTransferAtom(
      serverAccount,
      franchisorAccount,
      tokenUri,
      amount
    ).signAndSubmit(serverIdentity)

    return transaction.toPromise()
}

async function updateFranchisors(_tokenUri: string, franchisors: [string], newFranchisor: string, bootlegger: string) {
  await models.Bootleg.updateOne(
    { tokenUri: _tokenUri },
    { $push: { franchisors: newFranchisor }}
  )
  // console.log(franchisors)
  console.log('Updated franchisors list on database');
}

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
  console.log('Server identity created')
}