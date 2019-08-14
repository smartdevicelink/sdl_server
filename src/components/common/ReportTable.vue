<template>
    <div class="report-table"
    style="margin-top:50px">
        <div class="report-title"
              style="font-family:LivioNorm, Helvetica, sans-serif;font-size:25px;text-align:center"
        >
            {{chart.layout.title}}
        </div>

        <div >
            <table class="fixed_header" v-if="headerRow && bodyRows"
                   style="margin-top:70px;margin-left:auto;margin-right:auto"
            >
                <thead>
                <tr >
                    <th v-for="item of headerRow">{{item}}</th>
                </tr>
                </thead>
                <tbody>
                <tr v-for="row of bodyRows">
                    <td v-for="item of row">{{item}}</td>
                </tr>
                </tbody>
            </table>
        </div>


    </div>
</template>


<script>

    let obj = {
        props: [
            'chart',
        ],
        data () {

            let obj = {
                headerRow: null,
                bodyRows: null,
            };

            return obj;
        },
        methods: {
        },

        mounted (){

            let rawTable = this.chart.rawTable.slice();

            console.log(`report-table`,this.chart);

            console.log(`report-table`,`data`);
            console.log(`test`);
            let headerRow =  rawTable.shift();
            let bodyRows =  rawTable.slice();

            this.headerRow = headerRow;
            this.bodyRows = bodyRows;


        }
    };
    export default obj;

</script>
