<template>
  <section class="section" v-if="identity">
    <h2 class="title">Create New Bootleg</h2>
    <div class="form">
      <b-field grouped>
        <b-field label="Symbol">
          <b-input v-model="symbol" placeholder="QWMBL" />
        </b-field>
        <b-field label="Title" expanded>
          <b-input v-model="title" placeholder="Queen - Live At Wembley (1986)" />
        </b-field>
      </b-field>

      <b-field label="Artist">
        <b-input v-model="artist" placeholder="Artist public address"/>
      </b-field>

      <b-field label="Description">
        <b-input v-model="description" placeholder="Concert at Wembley Stadium, on 12 July 1986, Queen's Magic Tour"></b-input>
      </b-field>

      <hr>

      <b-field grouped>
        <b-field label="Price">
          <b-input type="number" v-model="price" :use-html5-validation="false"></b-input>
        </b-field>
        <b-field label="Icon URL (optional)" expanded>
          <b-input v-model="iconUrl" placeholder="Insert an icon for the new token"></b-input>
        </b-field>
      </b-field>

      <b-field label="Content URL" expanded>
          <b-input v-model="contentUrl" placeholder="Insert the URL for the bootleg"></b-input>
        </b-field>

      <hr>

      <b-field>
        <div class="footer-row">
          <b-button @click="handleClear" type="is-secondary">Clear</b-button>
          <b-button
            @click="handleBootlegCreation"
            type="is-primary"
            :disabled="!(this.symbol && this.title && this.artist && this.description && this.price > 0)">
            Create Bootleg
          </b-button>
          <div class="glue"></div>
        </div>
      </b-field>

    </div>
  </section>
</template>

<script lang="ts">
import { RadixTransactionBuilder, RadixIdentity, RRI } from 'radixdlt';
import Vue from 'vue';
import { NotificationType } from '@/constants';
import { Decimal } from 'decimal.js';

import axios from 'axios';

const defaultIconURL = 'https://i.imgur.com/mP71VI7.png';

export default Vue.extend({
  name: 'TokensCreate',
  data() {
    return {
      symbol: '',
      title: '',
      artist: '',
      description: '',
      price: '1',
      granularity: '1',
      amount: '1',
      iconUrl: '',
      contentUrl: '',
      isAmountValid: true,
    };
  },
  computed: {
    identity(): RadixIdentity {
      return this.$store.state.identity;
    },
  },
  methods: {
    handleBootlegCreation() {
      this.isAmountValid = this.validateAmount();

      if (!this.isAmountValid) return;

      try {
        const transactionBuilder = new RadixTransactionBuilder();
        // send request to server
        this.sendDataToServer()
        // this.defineToken(transactionBuilder.createTokenSingleIssuance.bind(transactionBuilder));
      } catch (e) {
        this.showStatus(e.message, NotificationType.ERROR);
      }
    },
    handleClear() {
      this.symbol = '';
      this.title = '';
      this.artist = '';
      this.price = '1';
      this.description = '';
      this.granularity = '1';
      this.amount = '1';
      this.contentUrl = '';
      this.iconUrl = '';
    },
    showStatus(message: string, type?: string) {
      this.$parent.$emit('show-notification', message, type);
    },
    sendDataToServer() {
      const bootlegger = this.identity.address
      
      axios.post('http://localhost:3001/create-bootleg', {
        symbol: this.symbol,
        title: this.title,
        artist: this.artist,
        price: this.price,
        description: this.description,
        granularity: this.granularity,
        amount: this.amount,
        contentUrl: this.contentUrl,
        iconUrl: defaultIconURL,
        bootlegger: bootlegger.toString() 
      }).then(response => {
        this.showStatus('Bootleg created', NotificationType.SUCCESS)
        console.log('Token uri: ', response);
      }).catch(error => {
        console.error('Error saving bootleg to db', error)
        this.showStatus(error || error.message, NotificationType.ERROR)
      })
    },
    validateAmount(): boolean {
      return new Decimal(this.amount).mod(new Decimal(this.granularity)).isZero();
    },
  },
});
</script>

<style scoped>
label.radio {
  padding-top: 0;
}
</style>
