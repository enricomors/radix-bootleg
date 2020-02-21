<template>
    <div v-if="!loaded">
        Loading...
    </div>
    <div v-else-if="error">
        {{ error }}
    </div>
    <div v-else class="home">
        <h1>{{ bootleg.title }}</h1>

        <video 
            v-if="bootleg.contentUrl.includes('.mp4')"
            :src="bootleg.contentUrl" controls autoplay loop>
        </video>
        <div v-else class="videoWrapper">
            <iframe
                width="560" 
                height="315"  
                :src="bootleg.contentUrl" 
                frameborder="0"
                allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen>
            </iframe>
        </div>
    </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { mapState } from 'vuex'
import { RadixTransactionBuilder, RadixIdentity, RadixAccount } from "radixdlt";

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
    computed: {
        identity(): RadixIdentity {
            return this.$store.state.identity;
        },
    },
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
                    const challenge = response.data
                    console.log('Challenge: ', challenge)
                    const data = {challenge}

                    console.log(data)

                    const atom = RadixTransactionBuilder.createPayloadAtom(
                        this.identity.account,
                        [this.identity.account],
                        'radix-bootleg',
                        challenge,
                        false,
                    ).buildAtom()
                    this.identity.signAtom(atom).then((signedAtom) => {
                        axios.post('http://localhost:3001/bootleg', {
                            bootlegTokenUri: this.$route.params.id,
                            atom: atom.toJSON(),
                        }).then((response) => {
                            this.loaded = true
                            this.bootleg = response.data
                        }).catch(error => {
                            console.log(response)
                            this.loaded = true
                            this.error = error
                        })
                    })
                })
            }
        }
    }
});
</script>

<style>
.videoWrapper {
	position: relative;
	padding-bottom: 56.25%; /* 16:9 */
	padding-top: 25px;
	height: 0;
}
.videoWrapper iframe {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
}
</style>