<script>


    import { Pie } from 'vue-chartjs'
    // import 'chartjs-plugin-labels';
    //chart sizing
    //https://github.com/apertureless/vue-chartjs/issues/17

    //https://emn178.github.io/chartjs-plugin-labels/samples/demo/
    export default {
        extends: Pie,
        props: ['chart'],
        mounted () {
            let options = this.chart.options;



            // options.labels = {
            //     render: 'label'
            // }

            options.pieceLabel = null;
            // options.maintainAspectRatio = false;
            console.log(`pie chart options`,options,options.pieceLabel,options.labels);


            options.response = false;
            options.maintainAspectRatio = false;

            this.renderChart(this.chart.data, options)
        }
    }
</script>