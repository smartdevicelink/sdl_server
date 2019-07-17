const moment = require('moment');

/**
 * Handles populating and
 * fetching reporting related data.
 *
 * The main function for reporting is
 * updateReporting.
 *
 *
 *
 */
class ReportingService
{

  constructor(config)
  {
    this.config = config;

    this.db = this.config.db;
    if (!config || !config.db)
    {
      throw new Error(`Config with db implementing sqlCommand required`);
    }
    this.logger = config.logger || console;

    this.lastPurge = 0;
    this.expirationDays = this.config.expirationDays || 30;
  }


  async upsert(table,data,now)
  {
    now = now || new Date();
    data.updated_ts = data.updated_ts || now;
    let updateData = Object.assign({},data);
    let id = updateData.id;
    delete updateData.id;

    data.created_ts = data.created_ts || now;
    let insertData = Object.assign({},data);

    let value_params = [];


    let values = [];
    let columns = [];
    for (let column in insertData)
    {
      let value = data[column];

      columns.push(column);
      values.push(value);
      value_params.push(`$${value_params.length+1}`);


    }


    data.updated_ts = data.updated_ts || now;
    let setColumns = [];
    let param_count = value_params.length;
    for (let column in updateData)
    {
      let value = data[column];
      param_count++;
      setColumns.push(`${column} = $${param_count}`);
      values.push(value);
    }

    let text = `INSERT INTO ${table}(${columns.join(',')}) VALUES (${value_params.join(',')})
    ON CONFLICT (id) 
    DO
        UPDATE 
        SET ${setColumns.join(',')}
`;

    return this.doQuery({
      text,
      values
    });

  }


  async update(table,data,now)
  {
    now = now || new Date();
    data.updated_ts = data.updated_ts || now;

    let id = data.id;
    delete data.id;

    let values = [];
    let columns = [];
    let param_count = 0;
    for (let column in data)
    {
      let value = data[column];

      param_count++;
      columns.push(`${column} = $${param_count}`);
      values.push(value);


    }

    param_count++;
    values.push(id);
    let text = `UPDATE ${table} SET ${columns.join(',')} WHERE id = $${param_count}`;


    return this.doQuery({
      text,
      values
    })



  }

  async insert(table,data,now)
  {
    now = now || new Date();
    data.created_ts = data.created_ts || now;
    data.updated_ts = data.updated_ts || now;

    let value_params = [];


    let values = [];
    let columns = [];
    for (let column in data)
    {
      let value = data[column];

      columns.push(column);
      values.push(value);
      value_params.push(`$${value_params.length+1}`);


    }

    let text = `INSERT INTO ${table}(${columns.join(',')}) VALUES (${value_params.join(',')})`;

    return this.doQuery({
      text,
      values
    })

  }

  /**
   *
   * @param id
   * @param data
   * @returns {Promise<void>}
   */
  async insertUpdateRecordById(table,data,now)
  {
    return this.upsert(table,data,now);
  }

  /**
   *
   * Comes from policy_table.device_data
   * @param deviceData
   * @returns {Promise<void>}
   */
  async updateDeviceData(deviceData,now)
  {
    if (!deviceData)
    {
      return;
    }
    try {
      for (let id in deviceData)
      {
        //removes any unsupported fields
        let {carrier,connection_type,hardware,os,os_version} = deviceData[id];
        let data = {carrier,connection_type,hardware,os,os_version,id};
        for (let key in data)
        {
          data[key] = data[key] || 'UNKNOWN';
        }
        let result = await this.insertUpdateRecordById(`device`,data,now);
      }
    }
    catch (e)
    {
      this.logger.error(`Failed to update deviceData ${JSON.stringify(deviceData)}`);
      throw e;
    }


  }

  async removeOldAppUsageRequests()
  {
    let expiration = moment().subtract(this.expirationDays,'days').toDate();
    let result = await this.doQuery({
      text: `DELETE FROM app_usage where updated_ts < $1`,
      values: [expiration]
    });

    return result;
  }

  async removeOldPolicyTableUpdateRequests()
  {
    let expiration = moment().subtract(this.expirationDays,'days').toDate();
    let result = await this.doQuery({
      text: `DELETE FROM policy_table_update_request where updated_ts < $1`,
      values: [expiration]
    });

    return result;

  }

  async removeOldDeviceData()
  {
    let expiration = moment().subtract(this.expirationDays,'days').toDate();
    let result = await this.doQuery({
      text: `DELETE FROM device where updated_ts < $1`,
      values: [expiration]
    });

    return result;

  }

  async purgeOldRecords()
  {
    let checkOldDataInterval = 5 *  60 * 1000;
    if ((Date.now() - this.lastPurge) > checkOldDataInterval)
    {
      return;
    }
    await this.removeOldDeviceData();
    await this.removeOldPolicyTableUpdateRequests();
    await this.removeOldAppUsageRequests();

    this.lastPurge = Date.now();
  }



  async updateUsageAndErrorCounts(usage_and_error_counts,now,full_app_id_supported)
  {
    if (!usage_and_error_counts)
    {
      return;
    }
    if (usage_and_error_counts.app_level)
    {
      await this.updateAppLevelUsageAndErrorCounts(usage_and_error_counts.app_level,now,full_app_id_supported);

    }
  }

  /**
   * Returns one record or throws and error.
   * @param table
   * @param query
   * @returns {Promise<void>}
   */
  async findOne(query)
  {
    let {rows} = await this.doQuery(query);


    if (!rows || rows.length !== 1)
    {
      if (rows.length === 0)
      {
        throw new Error(`No records found using query ${JSON.stringify(query)}`);
      }
      else {
        throw new Error(`Multiple records found using query ${JSON.stringify(query)}`);

      }
    }
    return rows[0];


  }

  /**
   *
   * @param app_id
   * @param obj
   * @param now
   * @returns {Promise<void>}
   *
   */
  async appUsageInsert(app_id,obj,now)
  {
    let {
      count_of_user_selections,
      count_of_rejected_rpc_calls,
      minutes_in_hmi_background,
      minutes_in_hmi_full,
      minutes_in_hmi_limited,
      minutes_in_hmi_none
    } = obj;


    let data = {
      app_id,
      count_of_user_selections,
      count_of_rejected_rpc_calls,
      minutes_in_hmi_background,
      minutes_in_hmi_full,
      minutes_in_hmi_limited,
      minutes_in_hmi_none
    }

    let result = await this.insert(`app_usage`,data,now);

    return result;
  }


  async updateAppLevelUsageAndErrorCounts(app_level,now,full_app_id_supported)
  {
    let uuid_column = full_app_id_supported ? `app_uuid` : `app_short_uuid`;

    for (let uuid in app_level)
    {
      try {
        let query = {
          text: `select id from app_info where ${uuid_column} = $1`,
          values: [uuid]
        }
        let application = await this.findOne(query);
        await this.appUsageInsert(application.id,app_level[uuid],now);
      }
      catch (e)
      {
        this.logger.warn(e.message);
      }
    }
  }

  getDaysSinceEpoch(date)
  {
    let epoch = moment(new Date(0));
    let endDate = moment(date);

    return endDate.diff(epoch,'days');
  }


  getTriggerEventFromPolicyTableObject(policyTableObject,now)
  {
    now = now || new Date();

    let {module_config,module_meta} = policyTableObject;

    let {exchange_after_x_days,exchange_after_x_ignition_cycles,exchange_after_x_kilometers} = module_config;
    let {ignition_cycles_since_last_exchange,pt_exchanged_at_odometer_x,pt_exchanged_x_days_after_epoch} = module_meta;


    let daysSinceEpoch = this.getDaysSinceEpoch(now);

    let daysSinceLastExchange = daysSinceEpoch - pt_exchanged_x_days_after_epoch;


    if (daysSinceLastExchange >= exchange_after_x_days)
    {
      return `DAYS`;
    }

    if (ignition_cycles_since_last_exchange >= exchange_after_x_ignition_cycles)
    {
      return `IGNITION`;
    }


    //no way to know distance without knowing current odometer reading.
    // if (ignition_cycles_since_last_exchange >= exchange_after_x_ignition_cycles)
    // {
    //   return `DISTANCE`;
    // }

    //TODO add trigger passed in from core when it becomes available
    return 'IGNITION';


  }

  /**
   * @returns {Promise<void>}
   */
  async updatePolicyTableUpdateRequests(policyTableObject,now)
  {
    let trigger_event;
    try {
      trigger_event = this.getTriggerEventFromPolicyTableObject(policyTableObject,now);
    }
    catch (e)
    {
      trigger_event = 'UNKNOWN';
    }
    let data = {trigger_event};
    let result = await this.insert(`policy_table_update_request`,data,now);


    return result;

  }

  /**
   * Called by policy/controller.js->postFromCore
   * Called whenever core requests a policy update.
   *
   * @param policyTableObject
   * @param now
   * @param full_app_id_supported
   * @returns {Promise<{success: boolean, error: *}|{success: boolean}>}
   */
  async updateReporting(policyTableObject,now,full_app_id_supported)
  {

    try {

      await this.purgeOldRecords();

      let policyTableUpdatePromise = this.updatePolicyTableUpdateRequests(policyTableObject,now);
      if (policyTableObject.device_data)
      {
        await this.updateDeviceData(policyTableObject.device_data,now);
      }

      if (policyTableObject.usage_and_error_counts)
      {
        await this.updateUsageAndErrorCounts(policyTableObject.usage_and_error_counts,now,full_app_id_supported);
      }

      let policyTableUpdateResult = await policyTableUpdatePromise;

      let success = true;

      let result = {
        success,
      };

      return result;
    }
    catch (e)
    {
      this.logger.error(e);
      return {
        success: false,
        error: e.message
      }
    }

  }


  getExpireDate()
  {
    return moment().subtract(this.expirationDays,'days').toDate();
  }

  getCountJson(rows)
  {
    let json = {};

    for (let row of rows)
    {
      json[row.name] = +row.count;
    }
    return json;
  }


  async getTotalDeviceModels(expireDate)
  {
    expireDate = expireDate || this.getExpireDate();
    let {rows} = await this.doQuery(
      {
        text: `select count(id) AS count,hardware AS name from device where updated_ts > $1 group by hardware`,
        values: [expireDate]
      });
    return this.getCountJson(rows);
  }

  async getTotalDeviceCarrier(expireDate)
  {
    expireDate = expireDate || this.getExpireDate();
    let {rows} = await this.doQuery(
      {
        text: `select count(id) AS count,carrier AS name from device where updated_ts > $1 group by carrier`,
        values: [expireDate]
      });
    return this.getCountJson(rows);

  }

  async getTotalDeviceOs(expireDate)
  {
    expireDate = expireDate || this.getExpireDate();
    let {rows} = await this.doQuery(
      {
        text: `select count(id) AS count,os AS name from device where updated_ts > $1 group by os`,
        values: [expireDate]
      });
    return this.getCountJson(rows);

  }

  async getPolicyTableUpdatesByTrigger(expireDate)
  {
    expireDate = expireDate || this.getExpireDate();
    let {rows} = await this.doQuery(
      {
        text: `select trigger_event,to_char(created_ts, 'YYYY-MM-DD') created\t from policy_table_update_request
where updated_ts > $1
order by created_ts   
;`,
        values: [expireDate]
      });

    let result = {};

    for (let row of rows)
    {
      let {trigger_event,created} = row;

      if (!result[created])
      {
        result[created] = {
        }
      }
      result[created][trigger_event] = result[created][trigger_event] ? result[created][trigger_event]++ : 1;
    }


    return result;

  }


  async getPolicyTableUpdatesByTriggerTotal(expireDate)
  {
    expireDate = expireDate || this.getExpireDate();
    let {rows} = await this.doQuery(
      {
        text: `select trigger_event,count(id) AS count  from policy_table_update_request
where updated_ts > $1
group by trigger_event
;`,
        values: [expireDate]
      });

    let result = {};

    for (let row of rows)
    {
      let {trigger_event,count} = row;
      result[trigger_event] = count;
    }


    return result;

  }


  async getAppUsageTimeHistory(id)
  {
    let expireDate = this.getExpireDate();
    let {rows} = await this.doQuery(
      {
        text: `
select
  app_id,
  count_of_user_selections,
  count_of_rejected_rpc_calls,
  minutes_in_hmi_background,
  minutes_in_hmi_full,
  minutes_in_hmi_limited,
  minutes_in_hmi_none,
  to_char(created_ts, 'YYYY-MM-DD') created
from app_usage
where updated_ts > $1
and app_id = $2
order by created_ts   
;`,
        values: [expireDate,id]
      });

    let rejected_rpcs_history = {};
    let usage_time_history = {};
    let user_selection_history = {};

    if (rows.length === 0)
    {
      return {}
    }


    for (let row of rows)
    {
      let {  count_of_user_selections,
        count_of_rejected_rpc_calls,
        minutes_in_hmi_background,
        minutes_in_hmi_full,
        minutes_in_hmi_limited,
        minutes_in_hmi_none,created} = row;

      if (count_of_user_selections)
      {
        if (!user_selection_history[created])
        {
          user_selection_history[created] = {
          }
        }
        user_selection_history[created][`count_of_user_selections`] = user_selection_history[created][`count_of_user_selections`] ? user_selection_history[created][`count_of_user_selections`] + count_of_user_selections  : count_of_user_selections;
      }


      if (count_of_rejected_rpc_calls)
      {
        if (!rejected_rpcs_history[created])
        {
          rejected_rpcs_history[created] = {
          }
        }
        rejected_rpcs_history[created][`count_of_rejected_rpcs_calls`] = rejected_rpcs_history[created][`count_of_rejected_rpcs_calls`] ? rejected_rpcs_history[created][`count_of_rejected_rpcs_calls`] + count_of_rejected_rpc_calls  : count_of_rejected_rpc_calls;
      }

      for (let hmi_key of ['minutes_in_hmi_background','minutes_in_hmi_full','minutes_in_hmi_limited','minutes_in_hmi_none'])
      {
        if (row[hmi_key] !== undefined)
        {
          if (!usage_time_history[created])
          {
            usage_time_history[created] = {
            }
          }
          usage_time_history[created][hmi_key] = usage_time_history[created][hmi_key] ? usage_time_history[created][hmi_key] + row[hmi_key]  : row[hmi_key];
        }
      }

    }


    return {
      rejected_rpcs_history,
      usage_time_history,
      user_selection_history,
    }

  }


  async getAppUsageReport(appId)
  {

    try {
      let application = await this.findOne({
        text: `select id,name from app_info where id = $1`,
        values: [appId]
      });


      let {usage_time_history,user_selection_history,rejected_rpcs_history} = await this.getAppUsageTimeHistory(appId);


      return {
        application,
        //Number of daily PTUs during the retention period, stacked by the triggering event (miles, days, ignition cycles)
        report_days: this.expirationDays,
        usage_time_history,
        user_selection_history,
        rejected_rpcs_history,
      }
    }
    catch (e)
    {
      this.logger.error(e.message);
      return {};
    }

  }

  async getPolicyTableUpdatesReport()
  {

    let policy_table_updates_by_trigger = await this.getPolicyTableUpdatesByTrigger();
    let total_policy_table_updates_by_trigger = await this.getPolicyTableUpdatesByTriggerTotal();

    return {

      policy_table_updates_by_trigger,
      total_policy_table_updates_by_trigger
    }
  }

  /**
   * total_device_carrier
   * total_device_model
   * total_device_os
   *
   * @returns {Promise<void>}
   */
  async getDeviceReport()
  {
    let expireDate = this.getExpireDate();
    let total_device_carrier = await this.getTotalDeviceCarrier(expireDate);
    let total_device_model = await this.getTotalDeviceModels(expireDate);
    let total_device_os = await this.getTotalDeviceOs(expireDate);
    return {
      total_device_carrier,
      total_device_model,
      total_device_os
    }



  }

  /**
   *
   * @param query
   * @returns {Promise<self.sqlCommand|sqlCommand>}
   */
  async doQuery(query)
  {
    let longQueryTime = 1;
    let t1 = Date.now();
    let db = this.db;
    return new Promise((resolve,reject) => {
      db.doQuery(query,(error,rows) => {
        let t2 = Date.now();
        let d1 = t2 - t1;
        if (d1 > longQueryTime)
        {
          this.logger.warn(`Long query time ${query.text} ${JSON.stringify(query.values)} ${d1} (ms)`)
        }
        if (error)
        {
          reject(error);
        }
        else {
          resolve({
            error,
            rows
          })
        }

      })
    })
  }


}


module.exports = ReportingService;
