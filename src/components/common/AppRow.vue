<template>
    <tr>
        <td class="icon">
            <img v-if="item.icon_url" v-bind:src="item.icon_url" class="rounded" style="width: 40px; height: 40px;" />
            <img v-else class="rounded" style="width: 40px; height: 40px;" src="data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22200%22%20height%3D%22200%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20200%20200%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_15e9f9b8d79%20text%20%7B%20fill%3Argba(255%2C255%2C255%2C.75)%3Bfont-weight%3Anormal%3Bfont-family%3AHelvetica%2C%20monospace%3Bfont-size%3A10pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_15e9f9b8d79%22%3E%3Crect%20width%3D%22200%22%20height%3D%22200%22%20fill%3D%22%23777%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%2274.4296875%22%20y%3D%22104.5%22%3E200x200%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E" data-holder-rendered="true" />
        </td>
        <td class="title">{{ item.name }}</td>
        <td>{{ item.updated_ts }}</td>
        <td>{{ item.platform }}</td>
        <td v-if="item.is_blacklisted">
            BLACKLISTED
        </td>
        <td v-else>
            {{ item.approval_status }}
        </td>
        <td class="actions">
            <div class="app-action pull-right">
                <template v-if="item.approval_status === 'PENDING' || item.approval_status === 'STAGING'">
                    <router-link v-bind:to="'/applications/' + item.id" class="btn btn-dark btn-sm">Review</router-link>
                </template>
                <template v-else>
                    <router-link v-if="actions_visible" v-bind:to="'/applications/' + item.id" class="btn btn-dark btn-sm">Review</router-link>
                    <span v-else class="fa fa-fw fa-1-5x fa-circle" v-bind:class="classStatusDot"></span>
                    <a v-on:click="toggleActions" class="fa fa-fw fa-1-5x" v-bind:class="actionIcon"></a>
                </template>
            </div>
        </td>
    </tr>
</template>

<script>
    export default {
        props: ['item'],
        data () {
            return {
                "actions_visible": false
            }
        },
        methods: {
            "toggleActions": function(){
                this.actions_visible = !this.actions_visible;
            }
        },
        computed: {
            classStatusDot: function(){
                return {
                    "color-red": this.item.approval_status == "LIMITED",
                    "color-green": this.item.approval_status == "ACCEPTED",
                    "color-black": this.item.is_blacklisted
                }
            },
            actionIcon: function(){
                return {
                    "fa-ellipsis-v": !this.actions_visible,
                    "fa-times": this.actions_visible,
                    "align-middle": this.actions_visible
                }
            }
        }
    }
</script>