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
import NotFound from '@/components/NotFound'

Vue.use(Router)

const router = new Router({
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
            component: Applications,
            meta: {
                auth: true
            }
        },
        {
            path: '/applications/:id',
            name: 'ApplicationDetails',
            component: ApplicationDetails,
            meta: {
                auth: true
            }
        },
        {
            path: '/functionalgroups/',
            name: 'FunctionalGroups',
            component: FunctionalGroups,
            meta: {
                auth: true
            }
        },
        {
            path: '/functionalgroups/:id',
            name: 'FunctionalGroupDetails',
            component: FunctionalGroupDetails,
            meta: {
                auth: true
            }
        },
        {
            path: '/policytable/',
            name: 'PolicyTable',
            component: PolicyTable,
            meta: {
                auth: true
            }
        },
        {
            path: '/user/',
            name: 'User',
            component: User,
            meta: {
                auth: true
            }
        },
        {
            path: '/invite/',
            name: 'Invite',
            component: Invite,
            meta: {
                auth: true
            }
        },
        {
          path: '*',
          name: '404',
          component: NotFound
        }
    ],
    scrollBehavior: function(to, from, savedPosition) {
      return { x: 0, y: 0 }
    }
});

router.beforeEach((to, from, next) => {
    if(to.matched.some(record => record.meta.auth) && !router.app.$session.exists()){
        // must log in
        next({
            "path": "/login",
            "query": {
                "redirect": to.fullPath
            }
        });
    }else{
        next();
    }
});

export default router;
