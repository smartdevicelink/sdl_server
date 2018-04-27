<template>
    <router-link v-bind:to="link" v-bind:class="{ 'opacity-30': item.is_deleted }">
        <div>
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
                <div style="height: 100%">
                    <p class="card-description-text" ref="descriptionText">{{ item.description }}</p>
                </div>
            </div>
            <div class="card-default">
                <div v-if="item.is_default" class="color-green">
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
            return {
                "windowWidth": 0,
                "displayedDescription": [],
                "hiddenDescription": []
            };
        },
        methods: {
            "increaseDescription": function(displayed, hidden, first) {
                var textElement = this.$refs['descriptionText'];
                var parent = textElement.parentElement;
                var descriptionHeight = first ? 0 : textElement.clientHeight;
                var parentHeight = parent.clientHeight + (parent.clientHeight * 0.05);
                var text = displayed.join('');
                if (descriptionHeight > parentHeight) {
                    return;
                }

                while (descriptionHeight < parentHeight && hidden.length) {
                    var c = hidden.shift();
                    displayed.push(c);
                    text += c;
                    textElement.innerText = text;
                    descriptionHeight = textElement.clientHeight;
                }

                if (descriptionHeight > parentHeight) {
                    text = text.substring(0, text.length - 5).trim() + '...';
                    for (var i = 0; i < 5; i++) {
                        var c = displayed.pop();
                        hidden.unshift(c)
                    }
                }
                this.displayedDescription = displayed.slice();
                this.hiddenDescription = hidden.slice();
                textElement.innerText = text;
            },
            "decreaseDescription": function(displayed, hidden) {
                var textElement = this.$refs['descriptionText'];
                var parent = textElement.parentElement;
                var descriptionHeight = textElement.clientHeight;
                var parentHeight = parent.clientHeight + (parent.clientHeight * 0.05);
                var text = displayed.join('');
                if (descriptionHeight < parentHeight) {
                    return;
                }

                while (descriptionHeight > parentHeight) {
                    var c = displayed.pop();
                    hidden.unshift(c);
                    text = text.substring(0, text.length - 1);
                    textElement.innerText = text;
                    descriptionHeight = textElement.clientHeight;
                }

                this.displayedDescription = displayed.slice();
                this.hiddenDescription = hidden.slice();
                textElement.innerText = text.substring(0, text.length - 4).trim() + '...';
            },
            "handleResize": function(e) {
                if (this.item.description) {
                    var w = document.documentElement.clientWidth;
                    if (w < this.windowWidth) {
                        this.decreaseDescription(this.displayedDescription.slice(), this.hiddenDescription.slice());
                    } else if (w > this.windowWidth) {
                        this.increaseDescription(this.displayedDescription.slice(), this.hiddenDescription.slice(), false);
                    }
                    this.windowWidth = w;
                }
            }
        },
        mounted: function () {
            this.$nextTick(function () {
                window.addEventListener('resize', this.handleResize);
                this.windowWidth = document.documentElement.clientWidth;
                this.increaseDescription([], this.item.description ? this.item.description.split('') : [], true);
            });
        },
        beforeDestroy: function () {
            window.removeEventListener('resize', this.handleResize);
        }
    }
</script>
