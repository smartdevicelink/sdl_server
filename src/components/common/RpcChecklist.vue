<template>
    <div class="w-50">
        <div class="form-group">
            <label class="col-form-label">{{ header }}</label>
            <b-form-checkbox-group
                stacked
                class="color-bg-gray color-primary"
                v-model="selected"
                :options="options">
            </b-form-checkbox-group>
        </div>
    </div>
</template>

<script>
    export default {
        props: ['options','header'],
        data () {
            return {
                selected: [] // Must be an array reference!
            };
        }
    }
</script>