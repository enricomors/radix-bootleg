import Vue from 'vue';
import Router from 'vue-router';
import Balance from '@/components/wallet/WalletBalance.vue';
import Transactions from '@/components/wallet/WalletTransactions.vue';
import Bootleg from '@/components/bootleg/Bootleg.vue'
import TokensCreate from '@/components/tokens/TokensCreate.vue';
import TokensManage from '@/components/tokens/TokensManage.vue';
import TokensLookup from '@/components/tokens/TokensLookup.vue';

Vue.use(Router);

export default new Router({
  linkExactActiveClass: 'is-active',
  routes: [
    {
      path: '/',
      redirect: '/about',
    },
    {
      path: '/tokens',
      name: 'Bootlegs',
      children: [
        {
          path: 'create',
          name: 'Create',
          component: TokensCreate,
        },
        {
          path: 'manage',
          name: 'Manage',
          component: TokensManage,
        },
        {
          path: 'lookup',
          name: 'Lookup',
          component: TokensLookup,
        },
      ],
      component: { render: c => c('router-view') },
    },
    {
      path: '/wallet',
      name: 'Wallet',
      children: [
        {
          path: 'balance',
          name: 'Balance',
          component: Balance,
        },
        {
          path: 'transactions',
          name: 'Transactions',
          component: Transactions,
        },
      ],
      component: { render: c => c('router-view') },
    },
    {
      path: '/about',
      name: 'About',
      // route level code-splitting
      // this generates a separate chunk (about.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import(/* webpackChunkName: "about" */ '@/components/about/About.vue'),
    },
    {
      path: '/bootleg/:id',
      name: 'Bootleg',
      component: Bootleg,
    },
  ],
});
