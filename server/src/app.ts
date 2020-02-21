import express from 'express';
import { radixUniverse, 
  RadixUniverse, 
  RadixIdentity, 
  RRI, 
  RadixIdentityManager,
  RadixKeyStore, 
  RadixTransactionBuilder, 
  RadixAccount, 
  RadixTokenDefinition,
  radixTokenManager,
  RadixSerializer,
  RadixAtom,
  RadixMessageParticle} from 'radixdlt';
import models, { connectDb } from './models'
import fs from 'fs-extra';
import cors from 'cors';
import bodyParser from 'body-parser';
import uuidv4 from 'uuid'

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
  loadIdentity().then(async () => {
    nativeTokenManage()

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

app.post('/get-tokens', (req, res) => {
  const address = req.body.address
  const senderAccount = RadixAccount.fromAddress(address)

  const symbol = 'BTLG'
  const nativeTokenRef = `/${serverIdentity.address.getAddress()}/${symbol}`

  console.log('Native token reference: ' + nativeTokenRef);
  
  RadixTransactionBuilder
    .createMintAtom(serverIdentity.account, nativeTokenRef, 10)
    .addTransfer(serverIdentity.account, senderAccount, nativeTokenRef, 10)
    .signAndSubmit(serverIdentity)
    .subscribe({
      next: status => console.log(status),
      complete: () => { 
        console.log('Native tokens sent to franchisor')
        res.send('There is your initial amount of native tokens! RRI: ' + nativeTokenRef) 
      },
      error: error => {
        console.log('Error sending native tokens to franchisor' + error)
        res.status(400).send('Sorry, there was an error in sendin your native tokens')
      }
    })

})

app.post('/create-bootleg', (req, res) => {
  const symbol = req.body.symbol
  const title = req.body.title
  const artist = req.body.artist
  const price = req.body.price
  const description = req.body.description
  const granularity = req.body.granularity
  const amount = req.body.amount
  const contentUrl = req.body.contentUrl
  const iconUrl = req.body.iconUrl
  const bootlegger = req.body.bootlegger

  const tokenUri = new RRI(serverIdentity.address, symbol).toString()

  new RadixTransactionBuilder().createTokenMultiIssuance(
    serverIdentity.account,
    title,
    symbol,
    description,
    granularity,
    amount,
    iconUrl,
  ).signAndSubmit(serverIdentity).subscribe({
    next: status => console.log(status),
    complete: async () => {
      // create db entry
      const bootleg = new models.Bootleg({
        tokenUri,
        title,
        artist,
        price,
        description,
        contentUrl,
        bootlegger,
      })
      // save to db
      await bootleg.save()
      res.send(tokenUri)
      console.log('Saved to db')
    },
    error: (e) => {
      console.log('Error in token creation: ' + e)
      res.status(400).send(e)
    }
  })
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
    .then(async () => {
      await sendToken(tokenUri, newFranchisor)
      await updateFranchisors(tokenUri, newFranchisor)
      res.status(200).send({ message: 'Payment completed'})
    })
    .catch(error => {
      console.error(error)
      res.status(400).send({ message: error.message})
    })
})

app.get('/request-access', async (req, res) => {
  const id = uuidv4()
  const request = new models.AccessRequest({
    id,
    consumed: false,
  })

  await request.save()
  res.send(id)
})

app.post('/bootleg', async (req, res) => {
  try {
    console.log('Requesting access to bootleg')
    const serializedAtom = req.body.atom

    const bootlegTokenUri = req.body.bootlegTokenUri

    const atom = RadixSerializer.fromJSON(serializedAtom) as RadixAtom
    const particle = atom.getFirstParticleOfType(RadixMessageParticle)
    const from = particle.from
    const challenge = particle.getData()
    console.log('challenge: ' + challenge)
    
    // check signature
    if (!from.verify(atom.getHash(), atom.signatures[from.getUID().toString()])) {
      res.status(400).send('Signature verification failed')
      throw new Error('Signature verification failed')
    }

    console.log('Signature ok')

    // check challenge
    const document = await models.AccessRequest.findOne({id: challenge }).exec()
    if (!document || document.get('consumed')) {
      res.status(400).send('Invalid challenge')
      throw new Error('Invalid challenge')
    }

    console.log('Challenge ok')
    
    document.set('consumed', true)
    await document.save()
      
    // check ownership
    const account = await getAccount(from.toString())
    console.log('Got synced account')
    const balance = account.transferSystem.balance
    console.log(balance)
    
    if (!(bootlegTokenUri in balance) || balance[bootlegTokenUri].ltn(1)) {
      res.status(400).send(`Don't own the bootleg`)
      throw new Error(`Don't own the bootleg`)
    }
    
    console.log('Bootleg owned')

    const bootleg = await models.Bootleg.findOne({
      tokenUri: bootlegTokenUri
    }).exec()

    if (!bootleg) {
      res.status(400).send(`Bootleg don't exist`)
      throw new Error(`Bootleg don't exist`) 
    }

    console.log('Bootleg found in database')
    res.send(bootleg)

  } catch (error) {
    console.error('Unexpected error: ', error)
    res.status(400).send('Unexpected error' + error)
  }
})

async function getAccount(address: string) {
  let account: RadixAccount
  account = RadixAccount.fromAddress(address)
  await account.openNodeConnection()

  await account.isSynced()
    .filter(val => {
      console.log('synced', val)
      return val
    })
    .take(1)
    .toPromise()

  return account
}

async function sendPayment(franchisors: [string], newFranchisor: string, artist: string, bootlegger: string, price: number) {
  
  franchisors.push(bootlegger)
  franchisors.push(artist)

  const dividedPrice = (price/franchisors.length).toString()
  console.log(dividedPrice);
  
  for (let i = 0; i < franchisors.length; i++) {
    const franchisor = franchisors[i]
    
    const franchisorAccount = RadixAccount.fromAddress(franchisor)
    const tokenUri = `/${serverIdentity.address.getAddress()}/BTLG`

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

async function updateFranchisors(_tokenUri: string, newFranchisor: string) {
  await models.Bootleg.updateOne(
    { tokenUri: _tokenUri },
    { $push: { franchisors: newFranchisor }}
  )
  // console.log(franchisors)
  console.log('Updated franchisors list on database');
}

async function sendToken(tokenUri: string, recipient: string) {
  const recipientAccount = RadixAccount.fromAddress(recipient)

  RadixTransactionBuilder.createMintAtom(serverIdentity.account, tokenUri, 1)
    .addTransfer(serverIdentity.account, recipientAccount, tokenUri, 1)
    .signAndSubmit(serverIdentity)
    .subscribe({
      next: status => console.log(status),
      complete: () => { console.log('Tokens sent to franchisor') },
      error: error => console.log('Error sending token to franchisor' + error)
    })
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

async function nativeTokenManage() {
  let td: RadixTokenDefinition = await searchTokenDefinition()

  if (td) {
    console.log('Found native token definition')
  } else {
    console.log('Start creating token definition')
    await createTokenDefinition()
  }
}

async function searchTokenDefinition(): Promise<RadixTokenDefinition> {
  const symbol = 'BTLG'
  return serverIdentity.account.tokenDefinitionSystem.getTokenDefinition(symbol)
}

async function createTokenDefinition() {
  const symbol = 'BTLG'
  const name = 'Bootleg native coin'
  const description = 'Native coin for bootleg application'
  const granularity = 0.000000000000000001
  const amount = 10
  const iconUrl = 'http://a.b.com/icon.png'

  new RadixTransactionBuilder().createTokenMultiIssuance(
    serverIdentity.account,
    name,
    symbol,
    description,
    granularity,
    amount,
    iconUrl,
  ).signAndSubmit(serverIdentity)
  .subscribe({
    next: status => console.log(status),
    complete: () => { console.log('Token defintion has been created') },
    error: error => {
      console.log('Error creating native token definition: ' + error)
      const td: RadixTokenDefinition = serverIdentity.account.tokenDefinitionSystem.getTokenDefinition(symbol)
      
      if (td) {
        console.log('Native token definition is already present')
      }
    }
  })
}

function getTokenRRI(td: RadixTokenDefinition) {
  return '/' + td.address + '/' + td.symbol;
}