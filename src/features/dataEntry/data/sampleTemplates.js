/**
 * 示例表单模板数据
 * 用于演示和测试表单填报平台功能
 */

export const sampleFormTemplates = [
  {
    id: 'template_001',
    name: '化验数据填报表',
    description: '用于填报日常化验数据，包括进出水水质指标',
    category: 'lab_data',
    version: '1.0.0',
    status: 'published',
    createdBy: 'admin',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    permissions: ['user', 'admin'],
    schema: {
      type: 'object',
      properties: {
        basic_info: {
          type: 'object',
          title: '基本信息',
          'x-component': 'FormGrid',
          'x-component-props': {
            maxColumns: 3,
            minColumns: 1,
          },
          properties: {
            date: {
              type: 'string',
              title: '化验日期',
              'x-component': 'DatePicker',
              'x-decorator': 'FormItem',
              'x-validator': [{ required: true, message: '请选择化验日期' }],
              'x-component-props': {
                placeholder: '请选择日期',
              },
            },
            site_id: {
              type: 'string',
              title: '站点',
              'x-component': 'Select',
              'x-decorator': 'FormItem',
              'x-validator': [{ required: true, message: '请选择站点' }],
              enum: [
                { label: '高铁污水厂', value: 'site_001' },
                { label: '5000吨处理厂', value: 'site_002' },
                { label: '污泥车间', value: 'site_003' },
              ],
            },
            operator: {
              type: 'string',
              title: '化验员',
              'x-component': 'Input',
              'x-decorator': 'FormItem',
              'x-validator': [{ required: true, message: '请输入化验员姓名' }],
              'x-component-props': {
                placeholder: '请输入化验员姓名',
              },
            },
          },
        },
        inlet_quality: {
          type: 'object',
          title: '进水水质',
          'x-component': 'FormCollapse',
          'x-component-props': {
            defaultActiveKey: ['inlet'],
          },
          properties: {
            inlet: {
              type: 'object',
              title: '进水指标',
              'x-component': 'FormCollapse.CollapsePanel',
              'x-component-props': {
                key: 'inlet',
              },
              properties: {
                grid: {
                  type: 'object',
                  'x-component': 'FormGrid',
                  'x-component-props': {
                    maxColumns: 4,
                    minColumns: 2,
                  },
                  properties: {
                    in_cod: {
                      type: 'number',
                      title: '进水COD(mg/L)',
                      'x-component': 'NumberPicker',
                      'x-decorator': 'FormItem',
                      'x-validator': [{ required: true, message: '请输入进水COD' }],
                      'x-component-props': {
                        placeholder: '例如: 350',
                        min: 0,
                        precision: 1,
                      },
                    },
                    in_bod: {
                      type: 'number',
                      title: '进水BOD(mg/L)',
                      'x-component': 'NumberPicker',
                      'x-decorator': 'FormItem',
                      'x-component-props': {
                        placeholder: '例如: 180',
                        min: 0,
                        precision: 1,
                      },
                    },
                    in_nh3n: {
                      type: 'number',
                      title: '进水氨氮(mg/L)',
                      'x-component': 'NumberPicker',
                      'x-decorator': 'FormItem',
                      'x-validator': [{ required: true, message: '请输入进水氨氮' }],
                      'x-component-props': {
                        placeholder: '例如: 35',
                        min: 0,
                        precision: 2,
                      },
                    },
                    in_tp: {
                      type: 'number',
                      title: '进水总磷(mg/L)',
                      'x-component': 'NumberPicker',
                      'x-decorator': 'FormItem',
                      'x-validator': [{ required: true, message: '请输入进水总磷' }],
                      'x-component-props': {
                        placeholder: '例如: 4.5',
                        min: 0,
                        precision: 2,
                      },
                    },
                    in_tn: {
                      type: 'number',
                      title: '进水总氮(mg/L)',
                      'x-component': 'NumberPicker',
                      'x-decorator': 'FormItem',
                      'x-component-props': {
                        placeholder: '例如: 45',
                        min: 0,
                        precision: 2,
                      },
                    },
                    in_ss: {
                      type: 'number',
                      title: '进水SS(mg/L)',
                      'x-component': 'NumberPicker',
                      'x-decorator': 'FormItem',
                      'x-component-props': {
                        placeholder: '例如: 220',
                        min: 0,
                        precision: 1,
                      },
                    },
                    in_ph: {
                      type: 'number',
                      title: '进水pH值',
                      'x-component': 'NumberPicker',
                      'x-decorator': 'FormItem',
                      'x-component-props': {
                        placeholder: '例如: 7.2',
                        min: 0,
                        max: 14,
                        precision: 1,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        outlet_quality: {
          type: 'object',
          title: '出水水质',
          'x-component': 'FormCollapse',
          properties: {
            outlet: {
              type: 'object',
              title: '出水指标',
              'x-component': 'FormCollapse.CollapsePanel',
              'x-component-props': {
                key: 'outlet',
              },
              properties: {
                grid: {
                  type: 'object',
                  'x-component': 'FormGrid',
                  'x-component-props': {
                    maxColumns: 4,
                    minColumns: 2,
                  },
                  properties: {
                    out_cod: {
                      type: 'number',
                      title: '出水COD(mg/L)',
                      'x-component': 'NumberPicker',
                      'x-decorator': 'FormItem',
                      'x-validator': [{ required: true, message: '请输入出水COD' }],
                      'x-component-props': {
                        placeholder: '例如: 40',
                        min: 0,
                        precision: 1,
                      },
                    },
                    out_bod: {
                      type: 'number',
                      title: '出水BOD(mg/L)',
                      'x-component': 'NumberPicker',
                      'x-decorator': 'FormItem',
                      'x-component-props': {
                        placeholder: '例如: 10',
                        min: 0,
                        precision: 1,
                      },
                    },
                    out_nh3n: {
                      type: 'number',
                      title: '出水氨氮(mg/L)',
                      'x-component': 'NumberPicker',
                      'x-decorator': 'FormItem',
                      'x-validator': [{ required: true, message: '请输入出水氨氮' }],
                      'x-component-props': {
                        placeholder: '例如: 2',
                        min: 0,
                        precision: 2,
                      },
                    },
                    out_tp: {
                      type: 'number',
                      title: '出水总磷(mg/L)',
                      'x-component': 'NumberPicker',
                      'x-decorator': 'FormItem',
                      'x-validator': [{ required: true, message: '请输入出水总磷' }],
                      'x-component-props': {
                        placeholder: '例如: 0.5',
                        min: 0,
                        precision: 2,
                      },
                    },
                    out_tn: {
                      type: 'number',
                      title: '出水总氮(mg/L)',
                      'x-component': 'NumberPicker',
                      'x-decorator': 'FormItem',
                      'x-component-props': {
                        placeholder: '例如: 10',
                        min: 0,
                        precision: 2,
                      },
                    },
                    out_ss: {
                      type: 'number',
                      title: '出水SS(mg/L)',
                      'x-component': 'NumberPicker',
                      'x-decorator': 'FormItem',
                      'x-component-props': {
                        placeholder: '例如: 10',
                        min: 0,
                        precision: 1,
                      },
                    },
                    out_ph: {
                      type: 'number',
                      title: '出水pH值',
                      'x-component': 'NumberPicker',
                      'x-decorator': 'FormItem',
                      'x-component-props': {
                        placeholder: '例如: 7.0',
                        min: 0,
                        max: 14,
                        precision: 1,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        remarks: {
          type: 'string',
          title: '备注',
          'x-component': 'Input.TextArea',
          'x-decorator': 'FormItem',
          'x-component-props': {
            placeholder: '请输入备注信息...',
            rows: 3,
          },
        },
      },
    },
  },
  {
    id: 'template_002',
    name: 'AO池运行数据表',
    description: '用于填报AO池日常运行数据',
    category: 'operation_data',
    version: '1.0.0',
    status: 'published',
    createdBy: 'admin',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    permissions: ['user', 'admin'],
    schema: {
      type: 'object',
      properties: {
        basic_info: {
          type: 'object',
          title: '基本信息',
          'x-component': 'FormGrid',
          'x-component-props': {
            maxColumns: 4,
            minColumns: 1,
          },
          properties: {
            date: {
              type: 'string',
              title: '日期',
              'x-component': 'DatePicker',
              'x-decorator': 'FormItem',
              'x-validator': [{ required: true, message: '请选择日期' }],
            },
            time: {
              type: 'string',
              title: '时间',
              'x-component': 'TimePicker',
              'x-decorator': 'FormItem',
              'x-validator': [{ required: true, message: '请选择时间' }],
            },
            site_id: {
              type: 'string',
              title: '站点',
              'x-component': 'Select',
              'x-decorator': 'FormItem',
              'x-validator': [{ required: true, message: '请选择站点' }],
              enum: [
                { label: '高铁污水厂', value: 'site_001' },
                { label: '5000吨处理厂', value: 'site_002' },
              ],
            },
            operator: {
              type: 'string',
              title: '操作员',
              'x-component': 'Input',
              'x-decorator': 'FormItem',
              'x-validator': [{ required: true, message: '请输入操作员姓名' }],
            },
          },
        },
        do_data: {
          type: 'object',
          title: '溶解氧数据',
          'x-component': 'FormGrid',
          'x-component-props': {
            maxColumns: 3,
            minColumns: 1,
          },
          properties: {
            a_zone_do: {
              type: 'number',
              title: 'A区DO(mg/L)',
              'x-component': 'NumberPicker',
              'x-decorator': 'FormItem',
              'x-validator': [{ required: true, message: '请输入A区DO' }],
              'x-component-props': {
                placeholder: '例如: 0.3',
                min: 0,
                precision: 2,
              },
            },
            o_zone_do: {
              type: 'number',
              title: 'O区DO(mg/L)',
              'x-component': 'NumberPicker',
              'x-decorator': 'FormItem',
              'x-validator': [{ required: true, message: '请输入O区DO' }],
              'x-component-props': {
                placeholder: '例如: 3.5',
                min: 0,
                precision: 2,
              },
            },
            second_o_zone_do: {
              type: 'number',
              title: '二沉池DO(mg/L)',
              'x-component': 'NumberPicker',
              'x-decorator': 'FormItem',
              'x-component-props': {
                placeholder: '例如: 2.0',
                min: 0,
                precision: 2,
              },
            },
          },
        },
        mlss_data: {
          type: 'object',
          title: '活性污泥数据',
          'x-component': 'FormGrid',
          'x-component-props': {
            maxColumns: 4,
            minColumns: 2,
          },
          properties: {
            a_zone_mlss: {
              type: 'number',
              title: 'A区MLSS(mg/L)',
              'x-component': 'NumberPicker',
              'x-decorator': 'FormItem',
              'x-validator': [{ required: true, message: '请输入A区MLSS' }],
              'x-component-props': {
                placeholder: '例如: 3500',
                min: 0,
                precision: 0,
              },
            },
            o_zone_mlss: {
              type: 'number',
              title: 'O区MLSS(mg/L)',
              'x-component': 'NumberPicker',
              'x-decorator': 'FormItem',
              'x-validator': [{ required: true, message: '请输入O区MLSS' }],
              'x-component-props': {
                placeholder: '例如: 3500',
                min: 0,
                precision: 0,
              },
            },
            sv30: {
              type: 'number',
              title: 'SV30(mL/L)',
              'x-component': 'NumberPicker',
              'x-decorator': 'FormItem',
              'x-validator': [{ required: true, message: '请输入SV30' }],
              'x-component-props': {
                placeholder: '例如: 250',
                min: 0,
                precision: 0,
              },
            },
            svi: {
              type: 'number',
              title: 'SVI(mL/g)',
              'x-component': 'NumberPicker',
              'x-decorator': 'FormItem',
              'x-component-props': {
                placeholder: '例如: 120',
                min: 0,
                precision: 0,
              },
            },
          },
        },
        other_params: {
          type: 'object',
          title: '其他参数',
          'x-component': 'FormGrid',
          'x-component-props': {
            maxColumns: 4,
            minColumns: 2,
          },
          properties: {
            temperature: {
              type: 'number',
              title: '水温(℃)',
              'x-component': 'NumberPicker',
              'x-decorator': 'FormItem',
              'x-validator': [{ required: true, message: '请输入水温' }],
              'x-component-props': {
                placeholder: '例如: 22',
                min: 0,
                max: 50,
                precision: 1,
              },
            },
            ph: {
              type: 'number',
              title: 'pH值',
              'x-component': 'NumberPicker',
              'x-decorator': 'FormItem',
              'x-validator': [{ required: true, message: '请输入pH值' }],
              'x-component-props': {
                placeholder: '例如: 7.2',
                min: 0,
                max: 14,
                precision: 1,
              },
            },
            orp: {
              type: 'number',
              title: 'ORP(mV)',
              'x-component': 'NumberPicker',
              'x-decorator': 'FormItem',
              'x-component-props': {
                placeholder: '例如: 150',
                precision: 0,
              },
            },
            air_flow: {
              type: 'number',
              title: '曝气量(m³/h)',
              'x-component': 'NumberPicker',
              'x-decorator': 'FormItem',
              'x-component-props': {
                placeholder: '例如: 1200',
                min: 0,
                precision: 0,
              },
            },
          },
        },
        remarks: {
          type: 'string',
          title: '备注',
          'x-component': 'Input.TextArea',
          'x-decorator': 'FormItem',
          'x-component-props': {
            placeholder: '请输入备注信息...',
            rows: 3,
          },
        },
      },
    },
  },
];

export const sampleFormCategories = [
  {
    id: 'lab_data',
    name: '化验数据',
    description: '化验相关的数据填报表单',
    icon: 'ExperimentOutlined',
    order: 1,
  },
  {
    id: 'operation_data',
    name: '运行数据',
    description: '设备运行相关的数据填报表单',
    icon: 'SettingOutlined',
    order: 2,
  },
  {
    id: 'maintenance_data',
    name: '维护数据',
    description: '设备维护相关的数据填报表单',
    icon: 'ToolOutlined',
    order: 3,
  },
  {
    id: 'quality_data',
    name: '质量数据',
    description: '质量控制相关的数据填报表单',
    icon: 'SafetyCertificateOutlined',
    order: 4,
  },
];

export const sampleFormSubmissions = [
  {
    id: 'submission_001',
    templateId: 'template_001',
    templateName: '化验数据填报表',
    data: {
      basic_info: {
        date: '2024-01-15',
        site_id: 'site_001',
        operator: '张三',
      },
      inlet_quality: {
        inlet: {
          grid: {
            in_cod: 350,
            in_bod: 180,
            in_nh3n: 35,
            in_tp: 4.5,
            in_tn: 45,
            in_ss: 220,
            in_ph: 7.2,
          },
        },
      },
      outlet_quality: {
        outlet: {
          grid: {
            out_cod: 40,
            out_bod: 10,
            out_nh3n: 2,
            out_tp: 0.5,
            out_tn: 10,
            out_ss: 10,
            out_ph: 7.0,
          },
        },
      },
      remarks: '水质正常，各项指标均在标准范围内',
    },
    status: 'pending',
    submittedBy: 'user001',
    submittedAt: '2024-01-15T10:30:00Z',
  },
  {
    id: 'submission_002',
    templateId: 'template_002',
    templateName: 'AO池运行数据表',
    data: {
      basic_info: {
        date: '2024-01-15',
        time: '14:30:00',
        site_id: 'site_001',
        operator: '李四',
      },
      do_data: {
        a_zone_do: 0.3,
        o_zone_do: 3.5,
        second_o_zone_do: 2.0,
      },
      mlss_data: {
        a_zone_mlss: 3500,
        o_zone_mlss: 3500,
        sv30: 250,
        svi: 120,
      },
      other_params: {
        temperature: 22,
        ph: 7.2,
        orp: 150,
        air_flow: 1200,
      },
      remarks: 'AO池运行正常，各项参数稳定',
    },
    status: 'approved',
    submittedBy: 'user002',
    submittedAt: '2024-01-15T14:45:00Z',
    reviewedBy: 'admin',
    reviewedAt: '2024-01-15T16:00:00Z',
  },
]; 