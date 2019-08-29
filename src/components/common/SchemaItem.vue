<!-- Copyright (c) 2019, Livio, Inc. -->
<template>

    <div class="rpc-container white-box left-border">
        <div class="form-group row">
            <h5>
                <i aria-hidden="true" class="pointer pull-right fa fa-times hover-color-red"
                   v-on:click="removeItem()"
                ></i>
            </h5>
        </div>


        <div class="form-group row">
            <label class="col-sm-2 col-form-label">Name</label>
            <div class="col-sm-10">
                <input v-model="item.name" :disabled="fieldsDisabled" class="form-control">
            </div>
        </div>


        <div class="form-group row">
            <label class="col-sm-2 col-form-label">Key</label>
            <div class="col-sm-10">
                <input v-model="item.key" :disabled="fieldsDisabled" class="form-control">
            </div>
        </div>


        <div class="form-group row">
            <label class="col-sm-2 col-form-label">Type</label>
            <div class="col-sm-10">
                <input v-model="item.type" :disabled="fieldsDisabled" class="form-control">
            </div>
        </div>

        <div class="form-group row">
            <b-form-checkbox
                    class="color-primary"
                    v-model="item.array"
                    v-bind:disabled="fieldsDisabled">
                Is Array
            </b-form-checkbox>
        </div>


        <div class="form-group row" v-if="item.array">
            <label class="col-sm-2 col-form-label">Minlength</label>
            <div class="col-sm-2">
                <pattern-input class="form-control text-truncate"
                               :regExp="integerInputZeroOrPositive.regExp"
                               :disabled="fieldsDisabled"
                               v-model.number="item.minlength"></pattern-input>
            </div>
        </div>


        <div class="form-group row" v-if="item.array">
            <label class="col-sm-2 col-form-label">Maxlength</label>
            <div class="col-sm-2">
                <pattern-input class="form-control text-truncate"
                               :regExp="integerInputZeroOrPositive.regExp"
                               :disabled="fieldsDisabled"
                               v-model.number="item.maxlength"></pattern-input>
            </div>
        </div>


        <div class="form-group row">
            <label class="col-sm-2 col-form-label">Since</label>
            <div class="col-sm-10">
                <input v-model="item.since" :disabled="fieldsDisabled" class="form-control">
            </div>
        </div>


        <div class="form-group row">
            <label class="col-sm-2 col-form-label">Until</label>
            <div class="col-sm-10">
                <input v-model="item.until" :disabled="fieldsDisabled" class="form-control">
            </div>
        </div>

        <div class="form-group row">
            <b-form-checkbox
                    class="color-primary"
                    v-model="item.removed"
                    v-bind:disabled="fieldsDisabled">
                Removed
            </b-form-checkbox>
        </div>

        <div class="form-group row">
            <b-form-checkbox
                    class="color-primary"
                    v-model="item.deprecated"
                    v-bind:disabled="fieldsDisabled">
                Deprecated
            </b-form-checkbox>
        </div>


        <div class="form-group row">
            <label class="col-sm-2 col-form-label">Minvalue</label>
            <div class="col-sm-2">
                <pattern-input class="form-control text-truncate"
                               :regExp="integerInputIncludingNegative.regExp"
                               :disabled="fieldsDisabled"
                               v-model.number="item.minvalue"></pattern-input>
            </div>
        </div>

        <div class="form-group row">
            <label class="col-sm-2 col-form-label">Maxvalue</label>
            <div class="col-sm-2">
                <pattern-input class="form-control text-truncate"
                               :regExp="integerInputIncludingNegative.regExp"
                               :disabled="fieldsDisabled"
                               v-model.number="item.maxvalue"></pattern-input>
            </div>
        </div>

        <div v-for="(param, paramIndex) in item.params"
        >

            <schema-item
                    v-bind:item="param"
                    :fieldsDisabled="fieldsDisabled"
                    :index="paramIndex"
                    :items="item.params"
            ></schema-item>
        </div>


        <div id="add" class="another-rpc pointer"
             v-if="item.name && item.type === 'Struct'"
             v-on:click="addParam()"
        >
            Add Param To Struct {{ item.name }}
            <i class="fa fa-plus middle-middle"></i>
        </div>


    </div>
</template>

<script>
    export default {
        props: ['item', 'index', 'items', 'environment', 'fieldsDisabled'],
        data() {
            return {
                'integerInputIncludingNegative': {
                    'regExp': /[^-0-9]/g,
                    'replacement': ''
                },
                'integerInputZeroOrPositive': {
                    'regExp': /^[\D]*|\D*/g, // Match any character that doesn't belong to the positive integer
                    'replacement': ''
                }
            };
        },
        methods: {
            'addParam': function() {
                this.item.params.push(
                    {
                        name: '',
                        key: '',
                        type: '',
                        array: false,
                        since: '',
                        until: '',
                        removed: false,
                        deprecated: false,
                        minvalue: '',
                        maxvalue: '',
                        minsize: '',
                        maxsize: '',
                        minlength: '',
                        maxlength: '',
                        params: []
                    }
                );
            },
            'removeItem': function() {
                this.$delete(this.items, this.index);
            }
        }
    };
</script>
