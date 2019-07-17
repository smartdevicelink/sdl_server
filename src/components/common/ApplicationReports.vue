<template>

    <div>
        <h4>Application Report For Past {{appReport.report_days}} Days</h4>


        <div class="row">
            <div class="col-sm-12"
                 style="min-width:350px"
            >
                <div v-if="timeUsageReport" >
                    <vue-plotly v-if="timeUsageReport"
                                :data="timeUsageReport.data"
                                :layout="timeUsageReport.layout"
                                :options="timeUsageReport.options"

                    />
                </div>
                <div v-else >
                    <img src="~@/assets/images/black_graphs/bargraphtall_blank.png" alt="No data"/>
                </div>

            </div>

        </div>

        <div class="row">
            <div class="col-sm-12"
                 style="min-width:350px"
            >
                <div v-if="userSelectionsReport" >
                    <vue-plotly v-if="userSelectionsReport"
                                :data="userSelectionsReport.data"
                                :layout="userSelectionsReport.layout"
                                :options="userSelectionsReport.options"

                    />
                </div>
                <div v-else >
                    <img src="~@/assets/images/black_graphs/bargraphtall_blank.png" alt="No data"/>
                </div>

            </div>

        </div>

        <div class="row">
            <div class="col-sm-12"
                 style="min-width:350px"
            >
                <div v-if="rejectedRPCsReport" >
                    <vue-plotly v-if="rejectedRPCsReport"
                                :data="rejectedRPCsReport.data"
                                :layout="rejectedRPCsReport.layout"
                                :options="rejectedRPCsReport.options"

                    />
                </div>
                <div v-else >
                    <img src="~@/assets/images/black_graphs/bargraphtall_blank.png" alt="No data"/>
                </div>

            </div>

        </div>


    </div>

</template>

<script>
    import Chart from "./Chart";

    let defaultWidth,defaultHeight;
    defaultWidth = defaultHeight = 300;

    let obj = {
        props: [
            'appReport' //usage aggregates by day for this application.
            // eg {
            //     "app": {
            //         "name": "TEST APP"
            //     },
            //     "report_days": 30,
            //     "aggregate_counts": {
            //         "usage_time": {
            //             "minutes_in_hmi_background": 100,
            //             "minutes_in_hmi_full": 1000,
            //             "minutes_in_hmi_limited": 20,
            //             "minutes_in_hmi_none": 2
            //         },
            //         "count_of_user_selections": 10,
            //         "count_of_rejected_rpcs_calls": 100
            //     }
            // }
        ],
        data () {
            let obj = {
                timeUsageReport: null,
                userSelectionsReport: null,
                rejectedRPCsReport: null,

                defaultWidth,
                defaultHeight

            };

            return obj;
        },
        methods: {
        },

        mounted (){

            if (this.appReport)
            {
                let {app,report_days,usage_time_history,user_selection_history,rejected_rpcs_history} = this.appReport;



                this.timeUsageReport = Chart.getTimeSeriesStackedFromJson(usage_time_history,{
                            title: 'App Usage Time',
                            yTitle: 'Minutes',
                            plot_bgcolor: '#FFFFFF',
                            paper_bgcolor: '#FFFFFF',
                    labelMapping: {
                                'minutes_in_hmi_none': "Background"
                    }
                });


                this.userSelectionsReport = Chart.getTimeSeriesStackedFromJson(user_selection_history,{
                    title: 'App Selections',
                    yTitle: 'Count',
                    plot_bgcolor: '#FFFFFF',
                    paper_bgcolor: '#FFFFFF',
                    labelMapping: {
                        'minutes_in_hmi_none': "Minutes in None"
                    },
                    isLineChart: true,
                });


                this.rejectedRPCsReport = Chart.getTimeSeriesStackedFromJson(rejected_rpcs_history,{
                    title: 'Rejected RPC Calls',
                    yTitle: 'Minutes',
                    plot_bgcolor: '#FFFFFF',
                    paper_bgcolor: '#FFFFFF',
                    labelMapping: {
                        'minutes_in_hmi_none': "Minutes in None"
                    },
                    isLineChart: true,
                });


            }
        },
    };
    export default obj;

</script>
