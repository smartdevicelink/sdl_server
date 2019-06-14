<!-- Copyright (c) 2018, Livio, Inc. -->
<template>
    <div class="container-fluid color-bg-gray">
        <div class="row">

            <page-side-nav/>
            <page-user-nav/>

            <main class="col-sm-9 ml-sm-auto col-md-10 pt-3 main-content" role="main">
                <h4>Reporting</h4>

                <div class="functional-content" v-if="aggregateReport">

                    <div class="form-row mb-0">
                        <h4 for="name">Report for the Last {{aggregateReport.report_days}} Days</h4>

                        <div class="row">
                            <div class="col-sm-12">


                                <policy-table-update-report v-bind:policy_table_updates_by_trigger="aggregateReport.policy_table_updates_by_trigger"
                                                            v-bind:total_policy_table_updates_by_trigger="aggregateReport.total_policy_table_updates_by_trigger"

                                                            v-bind:total_device_os="aggregateReport.total_device_os"
                                                            v-bind:total_device_model="aggregateReport.total_device_model"
                                                            v-bind:total_device_carrier="aggregateReport.total_device_carrier"


                                />


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

    let getReports = function (aggregateData)
    {
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
                                {x:'2016-12-25', y:20},
                                {x:'2016-12-26', y:10},
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
        data () {
            return {
                "aggregateReport": null,
                "reports": null,
                "lineChartOptions1": {
                    // labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
                    datasets: [
                        {
                            label: 'GitHub Commits',
                            backgroundColor: '#f87979',
                            data: [
                                {x:'2016-12-25', y:20},
                                {x:'2016-12-26', y:10},
                                {
                                    x: '2016-12-27',
                                    y: 10
                                }

                            ]

                            // data: [40, 20, 12, 39, 10, 40, 39, 80, 40, 20, 12, 11]
                        }
                    ]
                },
                "exampleBarCharts": [
                    Chart.exampleCharts.stackedTimeSeries,
                ]
            }
        },
        computed: {
            fieldsDisabled: function () {
                return true;
            }
        },
        methods: {
        },
        created (){
            let self = this;
            self.httpRequest("get", "reporting/aggregate-report", {}, (err, response) => {
                if(err){
                    // error
                    console.log("Error receiving about info.");
                    console.log(response);
                }else{
                    // success
                    response.json().then(parsed => {
                        console.log(`got parse json`,parsed);
                        self.aggregateReport = parsed.data;

                        // let {policy_table_updates_by_trigger} = self.aggregateReport;



                        // self.reports = getReports(self.aggregateReport);

                        // this.about = parsed.data;
                        // this.about.webhook_url = this.about.base_url + "/api/v1/webhook";
                    });
                }
            });
        },
        mounted (){
        },
        beforeDestroy () {
        }
    };


    export default obj;


</script>
