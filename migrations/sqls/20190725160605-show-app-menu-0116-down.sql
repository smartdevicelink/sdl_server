

DELETE FROM function_group_hmi_levels WHERE permission_name='ShowAppMenu'
                                        AND hmi_level = 'FULL'::hmi_level
                                        AND function_group_id IN (SELECT function_group_id FROM function_group_info WHERE property_name = 'Base-4');


DELETE FROM function_group_hmi_levels WHERE permission_name='ShowAppMenu'
                                        AND hmi_level = 'FULL'::hmi_level
                                        AND function_group_id IN (SELECT function_group_id FROM function_group_info WHERE property_name = 'Base-6');
