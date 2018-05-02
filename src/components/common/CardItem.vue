<template>
    <router-link v-bind:to="link" v-bind:class="{ 'opacity-30': item.is_deleted }">
        <div class="card-contents">
            <div class="card-header">
                <div class="card-title">
                    <h5>
                        {{ item.title }}
                    </h5>
                </div>
                <div class="card-pencil">
                    <i v-if="environment != 'PRODUCTION'" class="fa fa-pencil display-hover" style="float: right;" aria-hidden="true"></i>
                </div>
            </div>
            <div class="card-description">
                <p class="card-description-text" ref="descriptionText">{{ item.description }}</p>
            </div>
            <div class="card-default">
                <div v-if="item.is_default">
                    DEFAULT
                </div>
            </div>
            <div class="card-footer">
                <div class="card-count">
                    {{ item.count || '0' }} {{ item.count == 1 ? count_label_singular : count_label_plural }}
                </div>
                <div
                    v-if="item.status != 'PRODUCTION' || item.is_deleted"
                    class="card-status color-green">
                    MODIFIED {{ item.is_deleted ? "(DELETED)" : "" }}
                </div>
            </div>
        </div>
    </router-link>
</template>

<script>
    export default {
        props: ['item','environment', 'link', 'count_label_singular', 'count_label_plural'],
        data () {
            return {};
        },
    }
</script>
