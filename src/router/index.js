import Vue from 'vue'
import Router from 'vue-router'
import Login from '@/components/Login'
import LoginBasic from '@/components/LoginBasic'
import Register from '@/components/Register'
import Forgot from '@/components/Forgot'
import Applications from '@/components/Applications'
import ApplicationDetails from '@/components/ApplicationDetails'
import FunctionalGroups from '@/components/FunctionalGroups'
import FunctionalGroupDetails from '@/components/FunctionalGroupDetails'
import ConsumerMessages from '@/components/ConsumerMessages'
import ConsumerMessageDetails from '@/components/ConsumerMessageDetails'
import ModuleConfig from '@/components/ModuleConfig'
import PolicyTable from '@/components/PolicyTable'
import User from '@/components/User'
import Invite from '@/components/Invite'
import NotFound from '@/components/NotFound'

var authType = AUTH_TYPE; // defined via webpack build

Vue.use(Router)

const router = new Router({
    mode: 'history',
    routes: [
        {
            path: '/',
            redirect: '/applications',
            meta: {
                auth: true,
                title: 'Policy Server - Applications'
            }
        },
        {
            path: '/login/basic',
            name: 'Login',
            component: LoginBasic,
            meta: {
                auth: false,
                title: 'Policy Server - Login'
            },
            props: (route) => ({
                "password": route.query.password,
                "redirect": route.query.redirect
            })
        },/*
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
                "password": route.query.password,
                "redirect": route.query.redirect
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
        },*/
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
                "id": route.query.id || null,
                "environment": route.query.environment || "PRODUCTION"
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
            path: '/consumermessages/',
            name: 'ConsumerMessages',
            component: ConsumerMessages,
            meta: {
                auth: true,
                title: 'Policy Server - Consumer Friendly Messages'
            }
        },
        {
            path: '/consumermessages/manage',
            name: 'ConsumerMessageDetails',
            component: ConsumerMessageDetails,
            meta: {
                auth: true,
                title: 'Policy Server - Manage Consumer Friendly Message'
            },
            props: (route) => ({
                "id": route.query.id || null,
                "environment": route.query.environment || "PRODUCTION"
            })
        },
        {
            path: '/moduleconfig/',
            name: 'ModuleConfig',
            component: ModuleConfig,
            meta: {
                auth: true,
                title: 'Policy Server - Module Config'
            }
        },/*
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
        },*/
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
    if(to.matched.some(record => record.meta.auth) && !router.app.$session.exists()){
        if(authType == "basic"){
            // must log in
            next({
                "path": "/login/basic",
                "query": {
                    "redirect": to.fullPath
                }
            });
        }else{
            next();
        }
    }else{
        next();
    }
});

export default router;
