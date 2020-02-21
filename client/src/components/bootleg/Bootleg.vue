<template>
  <div v-if="!loaded">
      Loading...
  </div>
  <div v-else-if="error">
      {{ error }}
  </div>
  <div v-else class="home">

  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { mapState } from 'vuex'
import {  } from "radixdlt";

import axios from 'axios'

export default Vue.extend({
    data() {
        return {
            loaded: false,
            error: '',
            bootleg: null,
        }
    },
    name: 'bootleg',
    computed: mapState(['identity']),
    created() {

    },
    watch: {
        identity(newValue, oldValue) {
            this.loadBootleg()
        }
    },
    mounted() {
        this.loadBootleg()
    },
    methods: {
        loadBootleg() {
            if (this.identity) {
                axios.get('http://localhost:3001/request-access').then((response) => {
                    
                })
            }
        }
    }
});
</script>

<style>

</style>