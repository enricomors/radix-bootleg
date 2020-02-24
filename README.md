# Radix Bootleg
Questo progetto è realizzato per la tesi di laurea triennale presso l'Alma Mater Studiorum - Università di Bologna. Si tratta di una applicazione che prende ispirazione dal progetto [Bootleg](https://consensys.net/web3studio/bootleg) di Web3Studio, che utilizza [Vue.js](vuejs.org) e la libreria JavaScript di [Radix](https://www.radixdlt.com/).

## Il progetto Bootleg

Bootleg consente ai musicisti registrati di ottenere una rendita dalle registrazioni audio/video dei loro concerti dal vivo (chiamate, appunto, [Bootleg](https://en.wikipedia.org/wiki/Bootleg_recording)) realizzate dagli utenti detti `bootlegger`, che vengono caricate sulla piattaforma e acquistate da altri utenti. Il `bootleg` viene rappresentato da un Token non fungibile, chiamato Sharded Royalty Non-Fungible Token (SRNFT), un estensione di [ERC721](http://erc721.org/). Il Token SRNFT mantiene una lista degli account che hanno acquistato il bootleg chiamati `franchisor`. Nel momento in cui il bootleg viene acquistato, il pagamento viene diviso tra l'artista, il bootlegger e i franchisor.

## L'applicazione
L'applicazione è divisa in una parte front-end realizzato con [Vue.js](vuejs.org) e in una parte back-end realizzata in Typescript. Il codice è diviso nelle cartelle [server](server) e [client](client).

Ulteriori informazioni sono disponibili nella [Wiki del progetto](https://github.com/enricomors/radix-bootleg/wiki).

## Branch
* master - Contiene il codice dell'applicazione che utilizza come [Universe](https://docs.radixdlt.com/radixdlt-js/guides/get-started#universe) il `BETANET_EMULATOR`
* localhost_singlenode - Contiene una versione alternativa dell'applicazione che utilizza l'Universe `LOCALHOST_SINGLENODE`. In questo caso, è necessario avere sulla propria macchina un istanza in esecuzione del [Betanet emulator](https://docs.radixdlt.com/kb/develop/betanet-emulator), creato attraverso un container docker. L'immagine docker da avviare è contenuta nel file `betanet-emulator.yml`.

Ho deciso di creare una seconda versione dell'applicazione che utilizza il `LOCALHOST_SINGLENODE` come Universe per via di alcuni problemi riscontrati usando `BETANET_EMULATOR` nella connessione alla rete Radix. Tuttavia, a volte ho riscontrato anche problemi nell'esecuzione del container docker per il betanet emulator, per cui ho deciso per il momento di mantenere entrambe le versioni. Ho creato due branch separati per queste due versioni in quando ho notato che alcune operazioni (come ad esempio controllare il saldo di un account) cambiano da un Universe all'altro.