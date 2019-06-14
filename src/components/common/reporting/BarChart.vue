<script>
    // CommitChart.js
    import { Bar } from 'vue-chartjs'

    export default {
        extends: Bar,
        props: ['chart',
        'width',
        'height'],
        mounted () {

            console.log(`barchart`,this.width,this.height,this.chart.data);

            // let options = this.options;
            // let data = this.data;


            //https://vue-chartjs.org/api/#props
            // this.chart.options.height = '100px';
            // this.chart.options.width = '100px';

            let options = this.chart.options;

            options.response = false;
            options.maintainAspectRatio = false;

            return this.renderChart(this.chart.data,options);
            // return this.renderChart(this.chart.data, {
                // responsive: false,
                // maintainAspectRatio: false
            // });

        }
    }
</script>