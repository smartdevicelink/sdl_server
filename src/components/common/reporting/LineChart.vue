
<script>
    import { Line } from 'vue-chartjs'

    export default {
        extends: Line,
        props: [
            'chart',
            // 'data',
            // 'options'
        ],
        mounted () {

            let options = this.chart.options;

            // options.pieceLabel = null;
            options.response = false;
            options.maintainAspectRatio = false;

            console.log(`line-chart options`,this.chart.data,options);
            this.renderChart(this.chart.data, options)
        }
    }
</script>
