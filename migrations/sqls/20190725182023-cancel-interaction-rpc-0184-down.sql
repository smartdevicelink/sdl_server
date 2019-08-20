

DELETE FROM function_group_hmi_levels WHERE permission_name='CancelInteraction'
                                        AND hmi_level = 'FULL'
                                        AND function_group_id IN (SELECT function_group_id FROM function_group_info WHERE property_name = 'Base-4' GROUP BY function_group_id);

DELETE FROM function_group_hmi_levels WHERE permission_name='CancelInteraction'
                                        AND hmi_level = 'LIMITED'
                                        AND function_group_id IN (SELECT function_group_id FROM function_group_info WHERE property_name = 'Base-4' GROUP BY function_group_id);

DELETE FROM function_group_hmi_levels WHERE permission_name='CancelInteraction'
                                        AND hmi_level = 'BACKGROUND'
                                        AND function_group_id IN (SELECT function_group_id FROM function_group_info WHERE property_name = 'Base-4' GROUP BY function_group_id);
