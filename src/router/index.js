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
            redirect: '/applications'
            //redirect: '/login'
        },
        {
            path: '/login',
            name: 'Login',
            component: Login,
            meta: {
                auth: false,
                title: 'Policy Server - Login'
            },
            props: (route) => ({
                "email": route.query.email,
                "password": route.query.password
            })
        },
        {
            path: '/register',
            name: 'Register',
            component: Register,
            meta: {
                auth: false,
                title: 'Policy Server - Register'
            },
            props: (route) => ({
                "email": route.query.email,
                "password": route.query.password
            })
        },
        {
            path: '/forgot/',
            name: 'Forgot',
            component: Forgot,
            meta: {
                auth: false,
                title: 'Policy Server - Password Reset'
            }
        },
        {
            path: '/applications/',
            name: 'Applications',
            component: Applications,
            meta: {
                auth: true,
                title: 'Policy Server - Applications'
            }
        },
        {
            path: '/applications/:id',
            name: 'ApplicationDetails',
            component: ApplicationDetails,
            meta: {
                auth: true,
                title: 'Policy Server - Application Details'
            }
        },
        {
            path: '/functionalgroups/',
            name: 'FunctionalGroups',
            component: FunctionalGroups,
            meta: {
                auth: true,
                title: 'Policy Server - Functional Groups'
            }
        },
        {
            path: '/functionalgroups/manage',
            name: 'FunctionalGroupDetails',
            component: FunctionalGroupDetails,
            meta: {
                auth: true,
                title: 'Policy Server - Manage Functional Group'
            },
            props: (route) => ({
                "environment": route.query.environment || "staging",
                "id": route.query.id || null
            })
        },
        {
            path: '/policytable/',
            name: 'PolicyTable',
            component: PolicyTable,
            meta: {
                auth: true,
                title: 'Policy Server - Policy Table Preview'
            }
        },
        {
            path: '/user/',
            name: 'User',
            component: User,
            meta: {
                auth: true,
                title: 'Policy Server - User Settings'
            }
        },
        {
            path: '/invite/',
            name: 'Invite',
            component: Invite,
            meta: {
                auth: true,
                title: 'Policy Server - Invite Users'
            }
        },
        {
            path: '*',
            name: '404',
            component: NotFound,
            meta: {
                auth: false,
                title: 'Policy Server - Page Not Found'
            }
        }
    ],
    scrollBehavior: function(to, from, savedPosition) {
      return { x: 0, y: 0 }
    }
});

router.beforeEach((to, from, next) => {
    document.title = to.meta.title || "Policy Server";
    if(false && to.matched.some(record => record.meta.auth) && !router.app.$session.exists()){
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
