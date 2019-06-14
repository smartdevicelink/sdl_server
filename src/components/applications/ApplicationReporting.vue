<!-- Copyright (c) 2018, Livio, Inc. -->
<template>
    <div class="container-fluid color-bg-gray">
        <div class="row">

            <page-side-nav/>
            <page-user-nav/>

            <main class="col-sm-9 ml-sm-auto col-md-10 pt-3 main-content" role="main">
                <h4>Reporting</h4>

                <div class="functional-content" v-if="appReport">

                    <div class="form-row mb-0">
                        <h4 for="name"> application reports
                            <application-reports
                            v-bind:usage_and_error_counts_history="appReport.usage_and_error_counts_history"
                            />
                        </h4>
                        <div class="row">
                            <div class="col-sm-12">


                            </div>
                        </div>
                    </div>


                </div>

            </main>
        </div>
    </div>
</template>

<script>

    //http://demo.vue-chartjs.org/


    import Chart from "../common/reporting/Chart";

    let getReports = function (aggregateData) {
        let {policy_table_updates_by_trigger} = self.aggregateReport;

        return [
            {
                type: 'line-chart',
                options: {
                    datasets: [
                        {
                            label: 'GitHub Commits',
                            backgroundColor: '#f87979',
                            data: [
                                {x: '2016-12-25', y: 20},
                                {x: '2016-12-26', y: 10},
                                {
                                    x: '2016-12-27',
                                    y: 10
                                }

                            ]

                            // data: [40, 20, 12, 39, 10, 40, 39, 80, 40, 20, 12, 11]
                        }
                    ]
                }
            }

        ]
    };

    let obj = {
        data() {
            return {
                "appReport": null,
            }
        },
        computed: {},
        methods: {
            populateAppReport: function () {
                this.httpRequest("get", "reporting/application-report/" + this.$route.params.id, null,
                    (err, response) => {
                        if (err) {
                            // error
                            console.log("Error receiving application.");
                            console.log(response);
                        } else {
                            // success
                            response.json().then(parsed => {
                                this.appReport = parsed.data;
                                console.log(`got appReport`,this.appReport);
                            });
                        }
                    });
            },
            getStackedReportFromHistoryReport(report)
            {
                let datasetsIndex = {};
                let datasets = [];
                if (report)
                {
                    for (let date in report)
                    {

                        let record = report[date];
                        for (let type in record)
                        {
                            if (datasetsIndex[type] == undefined)
                            {
                                datasetsIndex[type] = datasets.length;
                                datasets.push({
                                    label: type,
                                    backgroundColor: Chart.chartColors[datasets.length],
                                    data: []
                                })
                            }
                            let dataset = datasets[datasetsIndex[type]];

                            dataset.data.push({
                                x: date,
                                y: record[type]
                            })
                        }
                    }
                }

                let barchartStacked = {
                    type: 'bar-chart',
                    options: Chart.defaultOptions.stackedTimeSeries,
                    data: {
                        datasets,
                    }
                };
                return barchartStacked;
            }
        },
        created() {
            let self = this;
            self.populateAppReport();
        },
        mounted() {
        },
        beforeDestroy() {
        }
    };


    export default obj;


</script>
