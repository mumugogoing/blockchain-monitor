import React, { useState } from 'react';
import { Card, Table, Input, Select, Space } from 'antd';
import type { ColumnsType } from 'antd/es/table';

interface TradeData {
  key: string;
  amount: number;
  fee: number;
}

const { Option } = Select;

const StacksDex: React.FC = () => {
  const [tableData, setTableData] = useState<TradeData[]>([
    {
      key: '1',
      amount: 1000,
      fee: 1.15
    },
    {
      key: '2',
      amount: 2000,
      fee: 2.11
    }
  ]);

  const amountOptions = [1000, 2000, 3000];
  const feeOptions = [1.15, 2.11, 5.1];

  const columns: ColumnsType<TradeData> = [
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (text: number, record: TradeData) => (
        <Space>
          <Input
            value={text}
            onChange={(e) => {
              const newData = [...tableData];
              const index = newData.findIndex(item => item.key === record.key);
              if (index !== -1) {
                newData[index].amount = Number(e.target.value) || 0;
                setTableData(newData);
              }
            }}
            style={{ width: 120 }}
          />
          <Select
            value={text}
            onChange={(value) => {
              const newData = [...tableData];
              const index = newData.findIndex(item => item.key === record.key);
              if (index !== -1) {
                newData[index].amount = value;
                setTableData(newData);
              }
            }}
            style={{ width: 80 }}
          >
            {amountOptions.map(option => (
              <Option key={option} value={option}>{option}</Option>
            ))}
          </Select>
        </Space>
      ),
    },
    {
      title: '费率',
      dataIndex: 'fee',
      key: 'fee',
      render: (text: number, record: TradeData) => (
        <Space>
          <Input
            value={text}
            onChange={(e) => {
              const newData = [...tableData];
              const index = newData.findIndex(item => item.key === record.key);
              if (index !== -1) {
                newData[index].fee = Number(e.target.value) || 0;
                setTableData(newData);
              }
            }}
            style={{ width: 120 }}
          />
          <Select
            value={text}
            onChange={(value) => {
              const newData = [...tableData];
              const index = newData.findIndex(item => item.key === record.key);
              if (index !== -1) {
                newData[index].fee = value;
                setTableData(newData);
              }
            }}
            style={{ width: 80 }}
          >
            {feeOptions.map(option => (
              <Option key={option} value={option}>{option}</Option>
            ))}
          </Select>
        </Space>
      ),
    },
  ];

  return (
    <div className="app-container" style={{ padding: '20px' }}>
      <h2 style={{ 
        marginBottom: '15px', 
        color: '#1890FF', 
        borderLeft: '4px solid #1890FF', 
        paddingLeft: '10px' 
      }}>
        XYK 交易平台1
      </h2>
      <Card>
        <Table
          dataSource={tableData}
          columns={columns}
          pagination={false}
          bordered
        />
      </Card>
    </div>
  );
};

export default StacksDex;