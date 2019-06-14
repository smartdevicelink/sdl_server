<script>


    import { PolarArea } from 'vue-chartjs'

    //chart sizing
    //https://github.com/apertureless/vue-chartjs/issues/17
    export default {
        extends: PolarArea,
        props: ['chart'],
        mounted () {
            let options = this.chart.options;
            // options.maintainAspectRatio = false;
            this.renderChart(this.chart.data, options)
        }
    }
</script>