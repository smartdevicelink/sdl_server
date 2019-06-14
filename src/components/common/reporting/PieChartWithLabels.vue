<script>


    import {Pie} from 'vue-chartjs'

    //chart sizing
    //https://github.com/apertureless/vue-chartjs/issues/17
    //https://github.com/emn178/chartjs-plugin-labels/issues/47
    //https://github.com/chartjs/chartjs-plugin-datalabels/issues/10#

    // import ChartJsPluginDataLabels from 'chartjs-plugin-datalabels';
    //
    // var app = new Vue({
    //     el: '#app',
    //     data: {
    //         message: 'Hello Vue!'
    //     },
    //     components: {
    //         ChartJsPluginDataLabels,
    //     },
    // })
    /**
     * Example Pie Chart
     */
    export default {
        extends: Pie,
        props: ['chart'],
        mounted() {

            let plugins_no_label = {
                    labels: {
                        render: () => ''
                    }
                };

            //https://github.com/emn178/chartjs-plugin-labels
            let plugins_default_text = {
                labels: {
// render 'label', 'value', 'percentage', 'image' or custom function, default is 'percentage'
//                     render: 'value',

                    render: 'percentage',
                    // precision for percentage, default is 0
                    precision: 0,

                    // identifies whether or not labels of value 0 are displayed, default is false
                    showZero: true,

                    // font size, default is defaultFontSize
                    fontSize: 15,

                    // font color, can be color array for each data or function for dynamic color, default is defaultFontColor
                    fontColor: '#fff',

                    // font style, default is defaultFontStyle
                    fontStyle: 'bold',

                    // font family, default is defaultFontFamily
                    fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",

                    // draw text shadows under labels, default is false
                    textShadow: true,

                    // text shadow intensity, default is 6
                    // shadowBlur: 10,

                    // text shadow X offset, default is 3
                    // shadowOffsetX: -5,

                    // text shadow Y offset, default is 3
                    // shadowOffsetY: 5,

                    shadowBlur: 0,
                    shadowOffsetX: 0,
                    shadowOffsetY: 0,

                    // text shadow color, default is 'rgba(0,0,0,0.3)'
                    shadowColor: 'rgba(0,0,0,1)',

                    // draw label in arc, default is false
                    // bar chart ignores this
                    // arc: true,

                    // position to draw label, available value is 'default', 'border' and 'outside'
                    // bar chart ignores this
                    // default is 'default'
                    position: 'default',

                    // draw label even it's overlap, default is true
                    // bar chart ignores this
                    overlap: true,

                    // show the real calculated percentages from the values and don't apply the additional logic to fit the percentages to 100 in total, default is false
                    showActualPercentages: true,

                    // set images when `render` is 'image'
                    images: [
                        {
                            src: 'image.png',
                            width: 16,
                            height: 16
                        }
                    ],

                    // add padding when position is `outside`
                    // default is 2
                    outsidePadding: 4,

                    // add margin of text when position is `outside` or `border`
                    // default is 2
                    textMargin: 4

                }
            };


            // let options = this.chart.options;
            // options.maintainAspectRatio = false;
            this.renderChart(
                {
                    labels: ['VueJs1', 'EmberJs', 'ReactJs', 'AngularJs'],
                    datasets: [
                        {
                            backgroundColor: [
                                '#41B883',
                                '#E46651',
                                '#00D8FF',
                                '#DD1B16'
                            ],
                            data: [40, 20, 80, 10]
                        }
                    ]
                },
                {
                    plugins: plugins_default_text,
                    responsive: true,
                    maintainAspectRatio: false,

                    // pieceLabel: {
                    //     mode: 'percentage',
                    //     precision: 1
                    // }
                })
        }
    }
</script>