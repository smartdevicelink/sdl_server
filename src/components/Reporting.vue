<!-- Copyright (c) 2018, Livio, Inc. -->

<!--https://community.rstudio.com/t/how-can-i-generate-this-kind-of-polar-chart-in-r-studio/2158/4-->
<template>
    <div class="container-fluid color-bg-gray">
        <div class="row">

            <page-side-nav/>
            <page-user-nav/>

            <main class="col-sm-9 ml-sm-auto col-md-10 pt-3 main-content" role="main">

                <div v-if="ENABLE_REPORTING">
                    <h3>Reporting</h3>

                    <div v-if="aggregateReport">

                        <!--                         class="form-row mb-0"-->
                        <div>
                            <h4>Policy Table Updates</h4>

                            <div class="row">
                                <div class="col-sm-12">

                                    <vue-plotly v-if="ptuChartStacked"
                                                :data="ptuChartStacked.data"
                                                :layout="ptuChartStacked.layout"
                                                :options="ptuChartStacked.options"

                                    />
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-sm-4"
                                     style="min-width:350px"
                                >
                                    <div
                                            v-if="ptuPieChart">
                                        <vue-plotly v-if="ptuPieChart"
                                                    :data="ptuPieChart.data"
                                                    :layout="ptuPieChart.layout"
                                                    :options="ptuPieChart.options"

                                        />
                                    </div>

                                </div>
                            </div>

                            <h3>Connected Devices</h3>
                            <div class="row">
                                <div class="col-sm-6" style="min-width:550px"
                                >
                                    <vue-plotly v-if="deviceOsPie"
                                                :data="deviceOsPie.data"
                                                :layout="deviceOsPie.layout"
                                                :options="deviceOsPie.options"

                                    />

                                </div>

                                <div class="col-sm-6" style="min-width:550px"
                                >


                                    <vue-plotly v-if="modelChart && !modelChart.rawTable"
                                                :data="modelChart.data"
                                                :layout="modelChart.layout"
                                                :options="modelChart.options"

                                    />

                                    <report-table v-if="modelChart && modelChart.rawTable"
                                                :chart="modelChart"

                                    />

                                </div>



                                <div class="col-sm-6" style="width:550px"
                                >


                                    <vue-plotly v-if="carrierChart"
                                                :data="carrierChart.data"
                                                :layout="carrierChart.layout"
                                                :options="carrierChart.options"

                                    />

                                </div>


                            </div>


                        </div>
                    </div>


                </div>


                <div v-if="!ENABLE_REPORTING">
                    <img src="~@/assets/images/black_graphs/reportingdisabled.png" alt="Reporting is disabled."/>

                </div>


            </main>
        </div>
    </div>
</template>

<script>

    //http://demo.vue-chartjs.org/


    import Chart from "./common/Chart";

    let obj = {
        data() {
            return {
                ENABLE_REPORTING: ENABLE_REPORTING,
                "aggregateReport": null,

                ptuChartStacked: null,
                ptuPieChart: null,
                deviceOsPie: null,
                modelChart: null,

                carrierChart: null,


            }
        },
        computed: {
            fieldsDisabled: function () {
                return true;
            }
        },
        methods: {
            populateCharts() {
                let aggregateReport = this.aggregateReport;
                let {
                    total_policy_table_updates_by_trigger,
                    total_device_os,
                    total_device_carrier,
                    total_device_model,
                    policy_table_updates_by_trigger
                } = this.aggregateReport;


                let labelMapping = {
                    'mileage': 'Mileage',
                    'days': 'Days',
                    'ignition_cycle': 'Ignition',
                    'UNKNOWN': 'Unknown'
                    // 'ignition_cycle': 'Ignition Cycle'
                };

                if (policy_table_updates_by_trigger)
                {
                    let ptuTableTitle = 'Policy Table Updates By Trigger';

                    this.ptuChartStacked = Chart.getTimeSeriesStackedFromJson(policy_table_updates_by_trigger, {
                        title: ptuTableTitle,
                        labelMapping,
                        yTitle: 'Event Count'
                    })
                }


                if (total_policy_table_updates_by_trigger) {
                    this.ptuPieChart = Chart.getSmartChartFromJson(total_policy_table_updates_by_trigger, {
                        labelMapping,
                        title: 'Policy Table Updates By Trigger',
                    });
                }


                if (total_device_os) {

                    let pieChart = Chart.getSmartChartFromJson(total_device_os,{
                        labelMapping,
                        title: 'Device OS'
                    });
                    this.deviceOsPie = pieChart;
                }


                if (total_device_model) {

                    this.modelChart = Chart.getSmartChartFromJson(total_device_model,{
                        // strategy: 'table', //go to table if to big for pie chart
                        labelMapping,
                        title: 'Device Models'
                    });



                }

                //https://community.rstudio.com/t/how-can-i-generate-this-kind-of-polar-chart-in-r-studio/2158/5
                if (total_device_carrier) {
                    this.carrierChart = Chart.getSmartChartFromJson(total_device_carrier, {
                        labelMapping,
                        title: 'Device Carrier',
                        xTitle: 'Device Count',
                    });
                }


            }
        },
        created() {
            let self = this;
            self.httpRequest("get", "module/report", {}, (err, response) => {
                if (err) {
                    // error
                    console.error("Error receiving about info.");
                    console.error(response);
                } else {
                    // success
                    response.json().then(parsed => {
                        self.aggregateReport = parsed.data;
                        self.populateCharts();
                    });
                }
            });
        },
        mounted() {
        },
        beforeDestroy() {
        }
    };


    export default obj;


</script>
