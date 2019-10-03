<!-- Copyright (c) 2019, Livio, Inc. -->
<template>

    <div class="rpc-container white-box left-border">
        <h5>
            {{ item.name || '???' }}
            <!-- delete this item -->
            <i
                v-if="!fieldsDisabled && index !== undefined"
                class="pointer pull-right fa fa-times hover-color-red"
                aria-hidden="true"
                v-on:click="removeFromParent(index)">
            </i>
        </h5>

        <div v-for="(param, propName) in item">
            <!-- String type -->
            <template v-if="getPropType(propName) === 'String'">
                <div class="form-group row">
                    <label class="col-sm-2 col-form-label">{{ propsDisplay[propName].display }}</label>
                    <div class="col-sm-10">
                        <input v-model="item[propName]" :disabled="fieldsDisabled" class="form-control">
                    </div>
                </div>
            </template>

            <!-- Boolean type -->
            <template v-if="getPropType(propName) === 'Boolean'">
                <div class="form-group row">
                    <b-form-checkbox
                        class="color-primary"
                        v-model="item[propName]"
                        v-bind:disabled="fieldsDisabled">
                        {{ propsDisplay[propName].display }}
                    </b-form-checkbox>
                </div>
            </template>

            <!-- Natural + Zero Number type -->
            <template v-if="getPropType(propName) === 'ZeroNatural'">
                <div class="form-group row">
                    <label class="col-sm-2 col-form-label">{{ propsDisplay[propName].display }}</label>
                    <div class="col-sm-2">
                        <pattern-input class="form-control text-truncate"
                           :regExp="integerInputZeroOrPositive.regExp"
                           :disabled="fieldsDisabled"
                           v-model.number="item[propName]"></pattern-input>
                    </div>
                </div>

            </template>

            <!-- Integer type -->
            <template v-if="getPropType(propName) === 'Integer'">
                <div class="form-group row">
                    <label class="col-sm-2 col-form-label">{{ propsDisplay[propName].display }}</label>
                    <div class="col-sm-2">
                        <pattern-input class="form-control text-truncate"
                           :regExp="integerInputIncludingNegative.regExp"
                           :disabled="fieldsDisabled"
                           v-model.number="item[propName]"></pattern-input>
                    </div>
                </div>
            </template>

        </div>

        <div v-for="(param, paramIndex) in item.params">
            <schema-item
                v-bind:item="param"
                :fieldsDisabled="fieldsDisabled"
                :index="paramIndex"
                :items="item.params"
                :removeFromParent="removeItem"
            ></schema-item>
        </div>

        <template v-if="!fieldsDisabled && (item.name && item.type === 'Struct')">
            <!-- divider line -->
            <div class="rpc-container"></div>
            <div class="another-rpc pointer" v-on:click="addParam()">
                <i class="fa fa-plus middle-middle"></i>
            </div>
        </template>



    </div>
</template>

<script>
    export default {
        props: ['item', 'index', 'fieldsDisabled', 'removeFromParent'],
        data() {
            return {
                integerInputIncludingNegative: {
                    'regExp': /[^-0-9]/g,
                    'replacement': ''
                },
                integerInputZeroOrPositive: {
                    'regExp': /^[\D]*|\D*/g, // Match any character that doesn't belong to the positive integer
                    'replacement': ''
                },
                propsDisplay: {
                    name: { display: 'Name', type: 'String' },
                    type: { display: 'Type', type: 'String' },
                    key: { display: 'Key', type: 'String' },
                    mandatory: { display: 'Mandatory', type: 'Boolean' },
                    min_length: { display: 'Min Length', type: 'ZeroNatural' },
                    max_length: { display: 'Max Length', type: 'ZeroNatural' },
                    min_size: { display: 'Min Size', type: 'ZeroNatural' },
                    max_size: { display: 'Max Size', type: 'ZeroNatural' },
                    min_value: { display: 'Min Value', type: 'Integer' },
                    max_value: { display: 'Max Value', type: 'Integer' },
                    array: { display: 'Is Array', type: 'Boolean' },
                    params: { display: 'Parameters', type: 'Struct' },
                }
            };
        },
        methods: {
            removeItem: function (index) {
                this.item.params.splice(index, 1); //remove the specific element from the array
            },
            getPropType: function (prop) {
                if (!this.propsDisplay[prop]) {
                    return null; //prop not found in our list. ignore it
                }
                return this.propsDisplay[prop].type;
            },
            addParam: function() {
                const newItem = {};

                for (let prop in this.propsDisplay) {
                    //make a new object using propsDisplay and its default values
                    if (this.propsDisplay[prop].type === 'Struct') {
                        newItem[prop] = []; //make a new array object reference for structs
                    }
                    else {
                        newItem[prop] = ''; //just use empty string for all other cases
                    }
                }

                this.item.params.push(newItem);
            },
        },
    };
</script>
