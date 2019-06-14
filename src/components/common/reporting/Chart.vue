<template>


    <div v-if="chart.type === 'line-chart'">
        <line-chart

                v-bind:chart="chart"
                v-bind:height="height"
                v-bind:width="width"
        />

    </div>
    <div v-else-if="chart.type === 'bar-chart'">
        <bar-chart
                v-bind:chart="chart"
                v-bind:height="height"
                v-bind:width="width"
        />
    </div>
    <div v-else-if="chart.type === 'pie-chart'">
        <pie-chart
                v-bind:chart="chart"
                    v-bind:height="height"
                   v-bind:width="width"
        />

    </div>
    <div v-else-if="chart.type === 'donut-chart'">
        <donut-chart
                v-bind:chart="chart"
                v-bind:height="height"
                v-bind:width="width"
                />

    </div>
    <div v-else-if="chart.type === 'polar-chart'">
        <polar-chart v-bind:chart="chart"/>

    </div>
    <div v-else>
        {{chart.type}} not supported
    </div>

</template>

<script>

    let plugins_default_text = {
        labels: {
// render 'label', 'value', 'percentage', 'image' or custom function, default is 'percentage'
//                     render: 'value',

            render: 'percentage',

            // render: 'percentage',
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


    //https://coolors.co/app

    // let colors = Chart.helpers.color;
    //https://coolors.co/export/pdf/aeb4a9-e0c1b3-d89a9e-c37d92-846267
    let chartColors = {
        green: '#41B883',
        orange: '#E46651',
        blue: '#00D8FF',
        red: '#DD1B16'
        // green: '#aeb4a9',
        // red: '#c37d92',
        // orange: '#e0c1b3',
        // brown: '#846267'
    };

    chartColors = {
        0: chartColors.green,
        1: chartColors.red,
        2: chartColors.blue,
        3: chartColors.orange,
    };

    let defaultOptions = {
        stackedTimeSeries:
            {
                scales: {
                    xAxes: [{
                        stacked: true,
                        type: "time",
                        time: {
                            unit: 'day',
                            round: 'day',
                            displayFormats: {
                                day: 'MMM D'
                            }
                        }
                    }],
                    yAxes: [{
                        stacked: true,
                        ticks: {
                            beginAtZero: true
                        }
                    }]
                }
            }
    };

    let exampleDataSets = {
        simpleTimeSeries1: {
            // stacked: true,
            label: "Simple 1",
            data: [{
                x: '2017-03-01', //can also use date. need to be cautious of timezones
                y: 1
            }, {
                x: '2017-03-02',
                y: 2
            }, {
                x: '2017-03-03',
                y: 3
            }, {
                x: '2017-03-04',
                y: 4
            }],
            backgroundColor: chartColors[1]
        },
        simpleTimeSeries2: {
            label: "Simple 2",
            data: [{
                x: '2017-03-01',
                y: 1
            }, {
                x: '2017-03-02',
                y: 2
            }, {
                x: '2017-03-03',
                y: 3
            }, {
                // x: '2017-03-04',
                x: '2017-03-04',
                y: 4
            }],
            backgroundColor: chartColors[2]
        },
        simpleTimeSeries3: {
            label: "Simple 3",
            data: [{
                x: '2017-03-01',
                y: 1
            }, {
                x: '2017-03-02',
                y: 2
            }, {
                x: '2017-03-03',
                y: 3
            }, {
                x: '2017-03-04',
                y: 4
            }],
            backgroundColor: chartColors[3]
        }
    };

    //https://codepen.io/kasiditp/pen/jwBqBZ
    //pie chart label
    //npm install chartjs-plugin-labels
    let obj =
        {
            getBasicDonutChartFromJson(json) {
                let chart = obj.getBasicPieChartFromJson(json);
                chart.type = 'donut-chart';
                return chart;
            },
            getBasicPolarChartFromJson(json) {
                let chart = obj.getBasicPieChartFromJson(json);
                chart.type = 'polar-chart';
                return chart;
            },
            getBasicPieChartFromJson(json) {
                let data = [];
                let labels = [];
                let backgroundColor = [];

                for (let key in json) {
                    labels.push(key);
                    backgroundColor.push(chartColors[data.length]);
                    data.push(json[key]);
                }

                let plugins = {
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


                let chart = {
                    type: 'pie-chart',
                    options: {
                        plugins,
                        responsive: false,
                        maintainAspectRatio: false
                        // responsive:true,
                        // maintainAspectRatio: false,
                        // maintainAspectRatio: false, //allow resizing
                        // pieceLabel: {
                        //     mode: 'percentage',
                        //     precision: 1
                        // },
                        // tooltips: {
                        //     // enabled: false
                        // },
                    },
                    data: {
                        datasets: [
                            {
                                data,
                                backgroundColor
                            }
                        ],
                        labels
                    },
                };

                return chart


            },
            props: ['chart',
            'height',
                'width'
            ],
            created() {
                let plugins_no_label = {
                    labels: {
                        render: () => ''
                    }
                };


                if (!this.chart.options.plugins) {
                    this.chart.options.plugins = plugins_no_label;
                }

                console.log(`plugins`, this.chart.options);
            },
            mounted() {
            },
            defaultOptions,
            chartColors,
            exampleCharts: {
                stackedTimeSeries: {
                    type: 'bar-chart',
                    options: defaultOptions.stackedTimeSeries,
                    data: {
                        datasets: [
                            exampleDataSets.simpleTimeSeries1,
                            exampleDataSets.simpleTimeSeries2,
                            exampleDataSets.simpleTimeSeries3,
                        ]
                    },

                },

            }
        };

    export default obj;
</script>
