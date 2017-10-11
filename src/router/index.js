import Vue from 'vue'
import Router from 'vue-router'
import Login from '@/components/Login'
import Register from '@/components/Register'
import Forgot from '@/components/Forgot'
import Applications from '@/components/Applications'
import ApplicationDetails from '@/components/ApplicationDetails'
import FunctionalGroups from '@/components/FunctionalGroups'
import FunctionalGroupDetails from '@/components/FunctionalGroupDetails'
import PolicyTable from '@/components/PolicyTable'
import User from '@/components/User'
import Invite from '@/components/Invite'

Vue.use(Router)

export default new Router({
    mode: 'history',
    routes: [
        {
            path: '/',
            redirect: '/login'
        },
        {
            path: '/login',
            name: 'Login',
            component: Login,
            props: (route) => ({
                "email": route.query.email,
                "password": route.query.password
            })
        },
        {
            path: '/register',
            name: 'Register',
            component: Register,
            props: (route) => ({
                "email": route.query.email,
                "password": route.query.password
            })
        },
        {
            path: '/forgot/',
            name: 'Forgot',
            component: Forgot
        },
        {
            path: '/applications/',
            name: 'Applications',
            component: Applications
        },
        {
            path: '/applications/:id',
            name: 'ApplicationDetails',
            component: ApplicationDetails
        },
        {
            path: '/functionalgroups/',
            name: 'FunctionalGroups',
            component: FunctionalGroups
        },
        {
            path: '/functionalgroups/:id',
            name: 'FunctionalGroupDetails',
            component: FunctionalGroupDetails
        },
        {
            path: '/policytable/',
            name: 'PolicyTable',
            component: PolicyTable
        },
        {
            path: '/user/',
            name: 'User',
            component: User
        },
        {
          path: '/invite/',
          name: 'Invite',
          component: Invite
        }
    ],
    scrollBehavior: function(to, from, savedPosition) {
      return { x: 0, y: 0 }
    }
})
