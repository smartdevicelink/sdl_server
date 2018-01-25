<template>
    <div class="w-50">
        <div class="form-group">
            <label class="col-form-label">{{ header }}</label>
            <b-form-select
                v-model="selected_hmi_level"
                :options="selected"
                :disabled="fieldsDisabled"
                v-on:input="selectionUpdated">
            </b-form-select>
        </div>
    </div>
</template>

<script>
    import { eventBus } from '../../main.js';
    export default {
        props: ['type','rpcIndex','options','header','status','fieldsDisabled'],
        data () {
            return {
                selected_hmi_level: this.options[0].text, //default to the first value in options
                selected: [] // Must be an array reference!
            };
        },
        computed: {
            selected_hmi_value: function () {
                //find the value of selected_hmi_level
                const optObj = this.options.find(opt => {
                    return opt.text === this.selected_hmi_level;
                });
                if (optObj) {
                    return optObj.value;
                }
                else {
                    return -Infinity;
                }
            }
        },
        methods: {
            selectionUpdated: function(){
                //transform the selected_hmi_level data into exactly which HMI levels are allowable
                //use the option_index to determine which HMI levels have which level of permission
                for (let i = 0; i < this.options.length; i++) {
                    // determine if each option is checked
                    // check it if the selected hmi value is equal to or higher than this option's value
                    const opt = this.options[i];
                    const is_checked = opt.value <= this.selected_hmi_value;
                    eventBus.$emit("rpcCheckboxChecked", this.rpcIndex, i, this.type, is_checked);
                }
            }
        },
        created: function(){
            //transform the options into selected to be used as a form select
            //the item with the higher value is the item with the higher permission
            for (let i = 0; i < this.options.length; i++) {
                if (this.options[i].value > this.selected_hmi_value && this.options[i].selected) {
                    this.selected_hmi_level = this.options[i].text;
                }
            }
            this.selected = this.options.map(function (opt) {
                return {
                    value: opt.text,
                    text: opt.text
                }
            });
            this.selectionUpdated(); //force selection update due to default values when adding a new RPC
        }
    }
</script>