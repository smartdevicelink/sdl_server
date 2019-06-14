<script>
    import { Doughnut } from 'vue-chartjs'

    export default {
        extends: Doughnut,
        props: ['chart'],
        mounted () {
            this.renderChart(this.chart.data, this.chart.options)
        }
    }
</script>