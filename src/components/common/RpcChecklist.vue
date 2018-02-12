<template>
    <div class="w-50">
        <div class="form-group">
            <label class="col-form-label">{{ header }}</label>
            <b-form-checkbox-group
                stacked
                class="color-bg-gray color-primary"
                v-model="selected"
                v-bind:disabled="fieldsDisabled"
                :options="options"
                v-on:change="checkboxUpdated">
            </b-form-checkbox-group>
        </div>
    </div>
</template>

<script>
    import { eventBus } from '../../main.js';
    export default {
        props: ['type','rpcIndex','options','header','status','fieldsDisabled'],
        data () {
            return {
                selected: [] // Must be an array reference!
            };
        },
        methods: {
            checkboxUpdated: function(){
                for(var option_index in this.options){
                    // determine if each option is checked
                    var is_checked = false;
                    for(var index in this.selected){
                        if(this.selected[index] == option_index){
                            is_checked = true;
                            break;
                        }
                    }
                    eventBus.$emit("rpcCheckboxChecked", this.rpcIndex, option_index, this.type, is_checked);
                }
            }
        },
        created: function(){
            for(var index in this.options){
                if(this.options[index].selected){
                    this.selected.push(index);
                }
            }
        }
    }
</script>