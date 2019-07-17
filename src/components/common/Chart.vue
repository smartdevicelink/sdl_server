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


    // #SDL Server
    // ##Statistics Recording & Visualizations - UI Colors

    let chartColors = {
        positive: `#76c26a`,
        negative: `#ff5e71`,
        neutral: `#b8c5cf`,
        // red: '#DD1B16'
        // green: '#aeb4a9',
        // red: '#c37d92',
        // orange: '#e0c1b3',
        // brown: '#846267'
    };
    // __Pos__
    //     `#76c26a`
    //
    // __Neg__
    //     `#ff5e71`
    //
    // __Null__
    //     `#b8c5cf`

    // ####Sequential Hierarchical Datasets
        let sequential_colors = [
        `#f68b47`,

        `#43a37b`,

        `#3e566a`,

        `#07151f`,

        `#b8c5cf`,

        `#50bbb8`,

        `#5c93ca`,

        `#ffc45c`,

        `#98c8e8`,

        `#c58dbf`,

        `#f0576b`,

        `#ffa2d3`,

        `#adadad`,

        `#245996`,

        `#a1c9ff`,

        `#ff978a`,

        `#8198aa`,

        `#aba6ff`,

        `#d3b38e`,

        `#007d92`,
            ];

    chartColors = Object.assign(chartColors,sequential_colors);

    let defaultLayout = {
        plot_bgcolor: '#F4F5F7',
        paper_bgcolor: "#F4F5F7",
        font: {
            family: 'LivioNorm, Helvetica, sans-serif',
            size: 18,
            // color: '#7f7f7f'
        },
    }

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

    let self;
    let obj = self =
        {
            getTimeSeriesStackedFromJson(json,options)
            {
                options = options || {};
                let defaultOptions = {
                    isLineChart: false,
                    title: '',
                    plot_bgcolor: defaultLayout.plot_bgcolor,
                    paper_bgcolor: defaultLayout.paper_bgcolor,
                };
                options = Object.assign({

                },defaultOptions,options);
                let {name,labelMapping} = options;

                let datasetsIndex = {};
                let datasets = [];

                let dates = [];
                /**
                 * json is indexed by date and then type. We want to split
                 * this into datasets by type
                 *
                 * assumes date is already sorted at this point.
                 *
                 */
                for (let date in json) {
                    dates.push(date);

                    let record = json[date];
                    for (let type in record) {
                        let label = type;
                        if (labelMapping && labelMapping[type]) {
                            label = labelMapping[type];
                        }

                        if (datasetsIndex[label] == undefined) {
                            datasetsIndex[label] = datasets.length;
                            datasets.push({
                                type: options.isLineChart ? 'scatter' : 'bar',
                                name: label,
                                marker: {
                                    color: chartColors[datasets.length],
                                },
                                x: [],
                                y: []
                            })
                        }
                        let dataset = datasets[datasetsIndex[label]];


                        dataset.x.push(date);
                        dataset.y.push(json[date][type]);
                    }
                }

                //get the 30 most recent days.
                let end_date = dates.pop();
                let start_date = dates[Math.max(0,dates.length - 30)];


                let chart = {
                    data: datasets,

                    layout: {

                        //font-family: LivioNorm, Helvetica, sans-serif;
                        font: defaultLayout.font,

                        plot_bgcolor: options.plot_bgcolor,
                        paper_bgcolor: options.paper_bgcolor,
                        barmode: 'stack',
                        title: options.title,

                        xaxis: {range: [start_date, end_date],
                            title: {
                                text: options.xTitle
                            }
                            // title: {
                            //     text: options.xTitle, //options.isPercent ? '%' : 'Total'
                            // },

                        },

                        yaxis: {
                            fixedrange: true,
                            title: {
                                text: options.yTitle
                            }
                        },
                        dragmode: 'pan'

                    },
                    options: {
                        displayModeBar: false,
                        // modeBarButtonsToRemove
                        yaxis: {
                            fixedrange: true
                        },
                        dragmode: 'pan',
                        responsive: true,
                        toImageButtonOptions: {
                            filename: options.title,
                                width: 800,
                                height: 600,
                                format: 'png'
                        }
                    }

                };


                return chart;





            },
            getRawTableFromJson(obj,options)
            {
                let {labelMapping} = options;
                let total = 0;
                for (let key in obj)
                {
                    let value = +obj[key];
                    total += value;
                }

                let rows = [];

                let row = [
                    'NAME',
                    'PERCENT',
                    'COUNT',
                ];

                rows.push(row);

                for (let key in obj)
                {
                    let value = +obj[key];
                    let percent = (((value / total) * 100)).toFixed(0) + '%';
                    let label = key;
                    if (labelMapping && labelMapping[key])
                    {
                        label = labelMapping[key];

                    }

                    let row = [
                        label,
                        percent,
                        value
                    ];
                    rows.push(row)
                }
                return rows;

            },
            getTableFromJson(obj,options)
            {
                let defaultOptions = {
                    isPercent: true,
                    plot_bgcolor: defaultLayout.plot_bgcolor,
                    paper_bgcolor: defaultLayout.paper_bgcolor,
                };
                options = options || {};

                options = Object.assign({

                },defaultOptions,options);

                let headers = options.headerValues || (function() {
                    if (options.isPercent)
                    {
                        return [
                            'NAME',
                            'PERCENT',
                            'COUNT',
                        ]
                    }
                    else {
                        return [
                            'NAME',
                            'COUNT',
                        ]
                    }

                })();

                let total = 0;

                let {labelMapping} = options;


                let percentValues = [];

                let itemNames = [];
                let rawTable = self.getRawTableFromJson(obj,options);



                let values = [];

                let keyCount = 0;

                for (let key in obj)
                {
                    keyCount++;
                    let value = +obj[key];
                    total += value;
                    values.push(value);

                    let label = key;
                    if (labelMapping && labelMapping[key])
                    {
                        label = labelMapping[key];

                    }
                    itemNames.push(label);
                }

                if (options.isPercent)
                {
                    for (let i in values)
                    {
                        let value = values[i];
                        let percent = (((value / total) * 100)).toFixed(0) + '%';
                        percentValues.push(percent);

                    }
                }


                //                            family: 'LivioNorm, Helvetica, sans-serif',

                let family = defaultLayout.font.family;
                //TODO style table

                //https://plot.ly/javascript/table/
                //https://community.plot.ly/t/cell-padding-in-plotly-table/21725
                //https://community.plot.ly/t/how-to-change-the-padding-of-a-graph/6784
                let data = [
                    {
                        rawTable,
                        type: 'table',
                        header: {
                            values: headers,
                            align: 'center',
                            line: {width: 1, color: 'black'},



                            font: {
                                family: family,
                                size: 10,
                                color: "#A9B3BD",
                            weight: "bold"}
                        },
                        //https://plot.ly/javascript/reference/#table-cells
                        cells: {
                            height: 100,
                            values: (function() {
                                if (options.isPercent)
                                {
                                    return [
                                        itemNames,
                                        percentValues,
                                        values,
                                    ]
                                }
                                else {
                                    return [
                                        itemNames,
                                        values,
                                    ]
                                }
                            })() ,
                            align: "center",
                            line: {color: "black", width: 1},
                            // fill: {color: [sequential_colors[1],'white']},
                            // fill: {color: ['#25FEFD', 'white']},
                            font: {
                                family: family,
                                size: 11,
                                // color: "#A9B3BD",
                                // weight: "bold"
                            }
                        }


                    }
                ];

                return {
                    rawTable,
                    data,
                    layout: {
                        font: defaultLayout.font,

                        title: options.title,
                        plot_bgcolor: options.plot_bgcolor,
                        paper_bgcolor: options.paper_bgcolor,

                        autosize: true,
                        margin: {
                            // l: 80,
                            // r: 50,
                            // b: 50,
                            // t: 150
                        },

                        xaxis: {
                            // title: {
                            //     text: options.xTitle, //options.isPercent ? '%' : 'Total'
                            // },
                            automargin: true,

                        },
                        yaxis: {
                            automargin: true,
                        }
                    },
                    options: {
                        displayModeBar: false,
                        toImageButtonOptions: {
                            filename: options.title,
                            width: 800,
                            height: 600,
                            format: 'png'
                        }
                    }
                }
            },
            //

            getTopCategories(obj,limit)
            {

            },
            getSmartChartFromJson(obj,options)
            {
                let defaultOptions = {
                    title: '',
                    plot_bgcolor: defaultLayout.plot_bgcolor,
                    paper_bgcolor: defaultLayout.paper_bgcolor,
                    limitCategories: 10, //limit unique keys to 10 by default. others will be grouped into other.
                };


                options = options || {};

                options = Object.assign({

                },defaultOptions,options);

                let {labelMapping,strategy} = options;

                let values = [];
                let labels = [];

                let marker = {
                    colors: []
                };

                let keyCount = 0;
                let records = [];
                for (let key in obj)
                {

                    keyCount++; //original keyCount

                    records.push({
                        key,
                        value: obj[key]
                    });
                }

                //sort and fetch 10 x.
                if (options.limitCategories && options.limitCategories < records.length)
                {
                    records.sort(function(a,b) {
                        return b.value - a.value;
                    });

                    let recordResults = [];
                    let other = {
                        key: 'Other',
                        value: 0,
                    };
                    for (let i in records)
                    {


                        if (i < options.limitCategories)
                        {
                            recordResults.push(records[i]);
                        }
                        else {
                            other.value += records[i].value;
                        }
                    }
                    recordResults.push(other);
                    records = recordResults;
                    obj = (function() {
                        let result = {};
                        for (let record of records)
                        {
                            result[record.key] = record.value;
                        }
                        return result;
                    })();
                }

                for (let key in obj)
                {

                    marker.colors.push(chartColors[values.length]);

                    // keyCount++;
                    values.push(obj[key]);

                    if (labelMapping && labelMapping[key])
                    {
                        labels.push(labelMapping[key]);

                    }
                    else {
                        labels.push(key);
                    }

                }

                let textinfo = 'label+percent';
                let maxLabelCount = 5;
                let showLegend = false;



                //too large for a pie chart go to another based on strategy given
                if (keyCount > maxLabelCount)
                {
                    if (strategy === 'table')
                    {
                        return self.getTableFromJson(obj,options);
                    }
                    else if (strategy === 'bar')
                    {
                        return self.getBarChartPlotly(obj,options);
                    }
                    else { //apply default based on size.
                        if (keyCount > 15) //for vary large number of keys use a table
                        {
                            return self.getTableFromJson(obj,options);
                        }
                        else {
                            return self.getBarChartPlotly(obj,options);
                        }
                    }
                }

                let data = [
                    {
                        marker,
                        values,
                        labels,
                        type: 'pie',
                        hole: options.hole || 0,
                        textinfo

                    }
                ];

                //https://github.com/plotly/plotly.js/issues/53
                //https://github.com/plotly/plotly.js/issues/296
                let chart = {
                    data,

                    layout: {
                        font: defaultLayout.font,

                        title: options.title,
                        plot_bgcolor: options.plot_bgcolor,
                        paper_bgcolor: options.paper_bgcolor,

                        showlegend: showLegend,
                        legend: {
                        },

                        autosize: true,
                        margin: {
                            // l: 80,
                            // r: 50,
                            // b: 50,
                            t: 150
                        },

                        xaxis: {
                            // title: {
                            //     text: options.xTitle, //options.isPercent ? '%' : 'Total'
                            // },
                            automargin: true,

                        },
                        yaxis: {
                            automargin: true,
                        }
                    },
                    options: {
                        displayModeBar: false,

                        toImageButtonOptions: {
                            filename: options.title,
                            width: 800,
                            height: 600,
                            format: 'png'
                        }
                    }
                };

                console.log(`get chart`,chart);
                return chart;
            },
            getBarChartPlotly(json,options)
            {
                options = options || {};
                let defaultOptions = {
                    sort: false, //already sorted by smart
                    isPercent: true,
                    title: '',
                    plot_bgcolor: defaultLayout.plot_bgcolor,
                    paper_bgcolor: defaultLayout.paper_bgcolor,
                };

                options = Object.assign({

                },defaultOptions,options);
                let {name,labelMapping} = options;

                let dataAry = [];
                let total = 0;
                for (let key in json)
                {
                    let record = {
                        key: key,
                        value: json[key]
                    };
                    dataAry.push(record)
                    total += record.value;
                }



                // if (options.sort)
                // {
                //place other last.
                dataAry.sort(function(a,b) {
                    let aValue = a.key === 'Other' ? -100 : a.value;
                    let bValue = b.key === 'Other' ? -100 :  b.value;
                    return aValue - bValue;
                });
                // }

                name = name || '';

                let data = [
                    {
                        x: [],
                        y: [],
                        text: [],
                        type: 'bar',
                        marker: {
                            color: []
                        },
                        textposition: 'auto',
                        // textposition: 'top',
                        // textposition: 'outside',

                        orientation: 'h',
                        hoverinfo: 'x',



                    }
                ];
                // let labels = [];
                // let backgroundColor = [];

                for (let i in dataAry) {
                    let record = dataAry[i];

                    record.percent = ((record.value / total) * 100).toFixed(2);

                    if (labelMapping && labelMapping[record.key])
                    {
                        data[0].y.push(labelMapping[record.key]);

                    }
                    else {
                        data[0].y.push(record.key);
                    }

                    if (options.isPercent)
                    {
                        // data[0].x.push(record.percent);
                        data[0].x.push(record.value);

                        data[0].text.push(record.percent + `%`);
                    }
                    else {
                        data[0].x.push(record.value);
                        data[0].text.push(record.value);
                    }


                    data[0].marker.color.push(chartColors[i])

                }

                //https://plot.ly/javascript/figure-labels/
                //https://stackoverflow.com/questions/36596947/long-tick-labels-getting-cut-off-in-plotly-js-chart
                //https://plot.ly/python/hover-text-and-formatting/
                //https://codepen.io/etpinard/pen/NaVrZz?editors=0010
                //https://plot.ly/javascript/setting-graph-size/
                //https://plot.ly/javascript/reference/#layout-plot_bgcolor
                //https://community.plot.ly/t/plot-background-how-can-i-setup-it/6617
                //https://plot.ly/javascript/reference/#layout-xaxis-ticklen
                let chart = {
                    layout: {
                        font: defaultLayout.font,


                        plot_bgcolor: options.plot_bgcolor,
                        paper_bgcolor: options.plot_bgcolor,
                        // bgcolor: "#F4F5F7",


                        title: options.title,
                        // hovermode: false, //No tooltip is required
                        hovermode: 'closest',

                        // width: 700,
                        height: 700,
                        autosize: true,
                        xaxis: {


                            title: {
                                text: options.xTitle, //options.isPercent ? '%' : 'Total'
                            },
                            automargin: true,

                        },
                        yaxis: {
                            // ticklen: 100,
                            // tickwidth: 100,
                            ticksuffix: '  ', //no margin but can add spaces to labels this way.

                            automargin: true,
                        }

                    },
                    data,
                    options: {
                        displayModeBar: false,

                        toImageButtonOptions: {
                            filename: options.title,
                            width: 800,
                            height: 600,
                            format: 'png'
                        }
                    }
                };

                console.log(`chart`,chart);

                return chart;
            },
            getBasicDonutChartFromJson(json) {
                let chart = obj.getBasicPieChartFromJson(json);
                chart.type = 'donut-chart';
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
                    labels: { //https://github.com/emn178/chartjs-plugin-labels
// render 'label', 'value', 'percentage', 'image' or custom function, default is 'percentage'
//                     render: 'value',

                        render: function (args) {
                            // args will be something like:
                            // { label: 'Label', value: 123, percentage: 50, index: 0, dataset: {...} }
                            return args.label + ' ' + args.percentage + '%';

                            // return object if it is image
                            // return { src: 'image.png', width: 16, height: 16 };
                        },

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


                let chart = {
                    type: 'pie-chart',
                    options: {
                        legend: {
                            display: false
                        },
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
