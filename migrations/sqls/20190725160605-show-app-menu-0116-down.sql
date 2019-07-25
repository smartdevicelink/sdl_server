

DELETE FROM function_group_hmi_levels WHERE permission_name='ShowAppMenu'
                                        AND hmi_level = 'FULL'
                                        AND function_group_id = (SELECT function_group_id FROM function_group_info WHERE property_name = 'Base-4');

DELETE FROM permissions where name = 'ShowAppMenu';
