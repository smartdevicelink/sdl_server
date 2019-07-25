

DELETE FROM function_group_hmi_levels WHERE permission_name='CloseApplication'
                                        AND hmi_level = 'BACKGROUND'
                                        AND function_group_id = (SELECT function_group_id FROM function_group_info WHERE property_name = 'AppServiceProviderGroup');

DELETE FROM function_group_hmi_levels WHERE permission_name='CloseApplication'
                                        AND hmi_level = 'FULL'
                                        AND function_group_id = (SELECT function_group_id FROM function_group_info WHERE property_name = 'AppServiceProviderGroup');

DELETE FROM function_group_hmi_levels WHERE permission_name='CloseApplication'
                                        AND hmi_level = 'LIMITED'
                                        AND function_group_id = (SELECT function_group_id FROM function_group_info WHERE property_name = 'AppServiceProviderGroup');

--no access to none given by default.
-- DELETE FROM function_group_hmi_levels WHERE permission_name='CloseApplication'
--                                         AND hmi_level = 'NONE'
--                                         AND function_group_id = (SELECT function_group_id FROM function_group_info WHERE property_name = 'AppServiceProviderGroup');


DELETE FROM permissions where name = 'CloseApplication';
