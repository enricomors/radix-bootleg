<template>
  <section class="section">
    <h2 class="title">Manage Bootlegs</h2>
    <b-table
      :data="bootlegs"
      :paginated="bootlegs.size > pageSize"
      :per-page="pageSize"
      ref="table"
      hoverable
      detailed
      detail-key="description"
      show-detail-icongetTokenUnitsGranularity
    >
      <template slot-scope="props">
        <b-table-column width="30">
          <div v-if="props.row.iconUrl" class="image is-24x24"><img :src="props.row.iconUrl" alt="" /></div>
        </b-table-column>
        <b-table-column field="symbol" label="Symbol" width="150" sortable>
          {{ getSymbol(props.row.tokenUri) }}
        </b-table-column>
        <b-table-column field="title" label="Title" sortable>
          {{ props.row.title }}
        </b-table-column>
        <b-table-column field="price" label="Price" sortable>
          {{ props.row.price }}
        </b-table-column>
        <b-table-column label="Actions">
          <div class="buttons">
            <router-link 
              v-if="tokenBalance[props.row.tokenUri]"
              :to="{name: 'Bootleg', params: {id: props.row.tokenUri}}">
              <b-button
              type="is-info"
              class="has-padding-right-30 has-padding-left-30"
              icon-left="leaf">
                Watch
              </b-button>
            </router-link>
            <b-button
              v-else
              type="is-success"
              class="has-padding-right-30 has-padding-left-30"
              icon-left="fire"
              @click="confirmBootlegPurchase(props.row)">
              Buy
            </b-button>
          </div>
        </b-table-column>
      </template>

      <template slot="detail" slot-scope="props">
        <table class="table" aria-colspan="4">
          <tr>
            <td class="has-text-weight-bold">Token RRI</td>
            <td>{{ props.row.tokenUri }}</td>
          </tr>
          <tr>
            <td class="has-text-weight-bold">Artist address</td>
            <td>{{ props.row.artist }}</td>
          </tr>
          <tr>
            <td class="has-text-weight-bold">Description</td>
            <td>{{ props.row.description }}</td>
          </tr>
        </table>
      </template>

      <template slot="empty">
        <table-empty />
      </template>
    </b-table>
  </section>
</template>

<script lang="ts">
import Vue from 'vue';
import { RadixIdentity, 
  RadixTokenDefinition, 
  RadixTransactionBuilder, 
  RadixAccount, 
  RRI,
  RadixAddress, 
  radixUniverse, 
  RadixLogger} from 'radixdlt';
import { Subscription } from 'rxjs';
import Decimal from 'decimal.js';
import BN from 'bn.js'
import TokensManageActionModal from '@/components/tokens/TokensManageModal.vue';
import { NotificationType } from '@/constants';
import TableEmpty from '@/components/shared/TableEmpty.vue';

import axios from 'axios';
import bodyParser from 'body-parser';

export default Vue.extend({
  name: 'TokensManage',
  components: {
    'table-empty': TableEmpty,
  },
  data() {
    return {
      bootlegs: [],
      pageSize: 10,
      tokenBalance: {},
      tokenDefinitions: new Map<string, RadixTokenDefinition>(),
      tokenUpdatesSubscription: Subscription.EMPTY as Subscription,
      tokenRequestSubscription: Subscription.EMPTY as Subscription,
      tokenUpdatesTracker: 1,
    };
  },
  created() {
    if (this.identity) {
      this.loadTokenDefinitions();
      this.subscribeToUpdates();
      this.loadBootlegsFromDb();
      RadixLogger.setLevel('DEBUG')
    }
  },
  beforeDestroy() {
    this.tokenUpdatesSubscription.unsubscribe();
    this.tokenRequestSubscription.unsubscribe();
  },
  watch: {
    identity(newValue, oldValue) {
      this.loadTokenDefinitions();
      this.subscribeToUpdates();
      this.loadBootlegsFromDb();
    },
  },
  computed: {
    identity(): RadixIdentity {
      return this.$store.state.identity;
    },
    tokenDefinitionsData(): any {
      return this.tokenUpdatesTracker && Array.from(this.tokenDefinitions.values());
    },
  },
  methods: {
    loadTokenDefinitions() {
      this.tokenBalance = this.identity.account.transferSystem.tokenUnitsBalance

        //.values()
        //.map(td => this.tokenDefinitions.set(this.getTokenRRI(td), td));
    },
    subscribeToUpdates() {
      this.tokenUpdatesSubscription = this.identity.account.tokenDefinitionSystem
        .getAllTokenDefinitionObservable()
        .subscribe(td => {
          this.tokenDefinitions.set(this.getTokenRRI(td), td);
          this.tokenUpdatesTracker += 1;
        });
    },
    loadBootlegsFromDb() {
      axios.get('http://localhost:3001/bootlegs')
      .then((response) => {
        if (response.status === 400) {
          console.error('Error fetching bootlegs from db')
        } else {
          this.bootlegs = response.data
          console.log('Bootlegs successfully fetched from db')
        }
      })
    },
    async buy(bootleg: any) {
      const price: number = bootleg.price
      console.log('bootleg price ' + price.toString());
    
      const symbol = 'BTLG'

      const bootlegger = bootleg.bootlegger
      console.log('bootlegger ' + bootlegger);
      
      const artist = bootleg.artist
      console.log('artist ' + artist);
      
      const franchisors = bootleg.franchisors
      console.log('franchisors array ' + franchisors);

      const bootlegToken = bootleg.tokenUri
      
      // the user which is buyng the bootleg
      const newFranchisor: RadixAccount = this.identity.account

      axios.get('http://localhost:3001/request-address')
        .then((resp) => { 
          const serverAddress = resp.data.address
          console.log('Received server address' + resp.data.address)
          const nativeTokenRef = `/${serverAddress}/${symbol}`
          const serverAccount = RadixAccount.fromAddress(serverAddress)

          const funds = newFranchisor
            .transferSystem
            .tokenUnitsBalance[nativeTokenRef]
          console.log('Funds: ', funds)
          

          if (funds.toNumber() >= price) {
            // send payment to server
            // tokenURI for the native token must have the address of the server account, because its created by it
            RadixTransactionBuilder.createTransferAtom(
              this.identity.account,
              serverAccount,
              nativeTokenRef,
              price,
            ).signAndSubmit(this.identity).subscribe({
              next: status => this.showStatus(status),
              complete: () => { 
                this.sendRecipients(bootlegToken, artist, bootlegger, franchisors, price) 
              },
              error: error => this.showStatus(error, NotificationType.ERROR)
            })
          } else {
            throw new Error("Insufficent funds")
          }
      }).catch(err => console.error(err))
    },
    sendRecipients(tokenUri: string, artist: string, bootlegger: string, franchisors: [], price: number) {
      const newFranchisor = this.identity.address.toString()

      axios.post('http://localhost:3001/send-recipients', {
        tokenUri, artist, bootlegger, franchisors, newFranchisor, price
      }).then((res) => {
        if (res.status === 400) {
          console.error('Error purchasing bootleg', res.data.message);
        } else {
          console.log('Completed successfully')
        }
      })
    },
    openModal(tokenReference: string, action: string) {
      this.$buefy.modal.open({
        parent: this,
        component: TokensManageActionModal,
        hasModalCard: true,
        trapFocus: true,
        ariaModal: true,
        ariaRole: 'dialog',
        props: {
          tokenRRI: tokenReference,
          tokenAction: action,
        },
      });
    },
    getSymbol(uri: string) {
      return uri.split('/')[2];
    },
    getTokenRRI(td: RadixTokenDefinition) {
      return '/' + td.address + '/' + td.symbol;
    },
    showStatus(message: string, type?: string) {
      this.$parent.$emit('show-notification', message, type);
    },
    confirmBootlegPurchase(bootleg: any) {
      this.$buefy.dialog.confirm({
        title: 'Purchase bootleg',
        message: `Proceeding you will purchase this bootleg.
                  <br/><br/>
                  <b>Note: </b> Be sure to have enough funds in your wallet.`,
        cancelText: 'Cancel',
        confirmText: 'Proceed',
        type: 'is-primary',
        onConfirm: () => {
          this.buy(bootleg)
            .then(() => this.showStatus('Bootleg purchased', NotificationType.SUCCESS))
            .catch(error => {
              this.showStatus(error.message || error, NotificationType.ERROR)
              console.error('Error purchasing bootleg ' + error)
            })
        },
      })
    }
  },
});
</script>
