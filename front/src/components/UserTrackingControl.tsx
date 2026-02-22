import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { 
  startTracking, 
  stopTracking, 
  clearActions,
  setUserName
} from '../store/userTrackingSlice';
import {
  exportUserActionsToCSV,
  exportUserActionsBySession,
  getUserActionStatistics
} from '../utils/csvExporter';
import { Button, Input, message, Modal, Space, Statistic, Row, Col, Card } from 'antd';
import {
  PlayCircleOutlined,
  StopOutlined,
  DownloadOutlined,
  ClearOutlined,
  UserOutlined,
  BarChartOutlined,
} from '@ant-design/icons';

interface UserTrackingControlProps {
  className?: string;
}

export const UserTrackingControl: React.FC<UserTrackingControlProps> = ({ className }) => {
  const dispatch = useDispatch();
  const { 
    isTracking, 
    userName, 
    actions, 
    currentSessionId 
  } = useSelector((state: RootState) => state.userTracking);
  
  const [tempUserName, setTempUserName] = useState(userName);
  const [showStats, setShowStats] = useState(false);
  const [stats, setStats] = useState<ReturnType<typeof getUserActionStatistics> | null>(null);

  useEffect(() => {
    setTempUserName(userName);
  }, [userName]);

  const handleStartTracking = () => {
    if (!tempUserName.trim()) {
      message.error('Please enter a user name');
      return;
    }
    
    dispatch(setUserName(tempUserName.trim()));
    dispatch(startTracking({ userName: tempUserName.trim() }));
  };

  const handleStopTracking = () => {
    dispatch(stopTracking());
  };

  const handleExportAll = () => {
    try {
      if (actions.length === 0) {
        message.warning('There is no data to export');
        return;
      }
      
      const fileName = `user_behavior_${userName || 'unknown'}_${Date.now()}.csv`;
      exportUserActionsToCSV(actions, fileName);
      message.success('export successfully');
    } catch (error) {
      message.error(`export: ${error instanceof Error ? error.message : 'unknown error'}`);
    }
  };

  const handleExportCurrentSession = () => {
    try {
      if (!currentSessionId) {
        message.warning('There is no data to export');
        return;
      }
      
      const fileName = `user_behavior_session_${currentSessionId}_${Date.now()}.csv`;
      exportUserActionsBySession(actions, currentSessionId, fileName);
      message.success('Export successfully');
    } catch (error) {
      message.error(`export: ${error instanceof Error ? error.message : ''}`);
    }
  };

  const handleClearData = () => {
    Modal.confirm({
      title: 'sure to clear all data',
      content: 'Are you sure to clear all data? This action cannot be recovered.',
      okText: 'confirm',
      cancelText: 'cancel',
      okType: 'danger',
      onOk: () => {
        dispatch(clearActions());
        message.success('the data has been deleted');
      },
    });
  };

  const handleShowStats = () => {
    const statistics = getUserActionStatistics(actions);
    setStats(statistics);
    setShowStats(true);
  };

  return (
    <>
      <Card title="User Tracking Control" className={className} size="small">
        <Space direction="vertical" style={{ width: '100%' }}>
          <Space.Compact style={{ width: '100%' }}>
            <Input
              prefix={<UserOutlined />}
              placeholder="Please enter a user name"
              value={tempUserName}
              onChange={(e) => setTempUserName(e.target.value)}
              disabled={isTracking}
              style={{ flex: 1 }}
            />
          </Space.Compact>

          <Space wrap>
            {!isTracking ? (
              <Button
                type="primary"
                icon={<PlayCircleOutlined />}
                onClick={handleStartTracking}
                disabled={!tempUserName.trim()}
              >
                start
              </Button>
            ) : (
              <Button
                danger
                icon={<StopOutlined />}
                onClick={handleStopTracking}
              >
                stop
              </Button>
            )}
            
            <Button
              icon={<DownloadOutlined />}
              onClick={handleExportAll}
              disabled={actions.length === 0}
            >
              export
            </Button>
            
            <Button
              icon={<DownloadOutlined />}
              onClick={handleExportCurrentSession}
              disabled={!currentSessionId || actions.length === 0}
            >
              export current session
            </Button>
            
            <Button
              icon={<BarChartOutlined />}
              onClick={handleShowStats}
              disabled={actions.length === 0}
            >
              view the stats
            </Button>
            
            <Button
              icon={<ClearOutlined />}
              onClick={handleClearData}
              disabled={actions.length === 0}
              danger
            >
              remove data
            </Button>
          </Space>

          <Row gutter={16}>
            <Col span={8}>
              <Statistic 
                title="tracking status" 
                value={isTracking ? "progress" : "stop"} 
                valueStyle={{ 
                  color: isTracking ? '#3f8600' : '#cf1322',
                  fontSize: '14px'
                }}
              />
            </Col>
            <Col span={8}>
              <Statistic 
                title="Current user" 
                value={userName || "anonymous"} 
                valueStyle={{ fontSize: '14px' }}
              />
            </Col>
            <Col span={8}>
              <Statistic 
                title="number" 
                value={actions.length} 
                valueStyle={{ fontSize: '14px' }}
              />
            </Col>
          </Row>
        </Space>
      </Card>

      <Modal
        title="user action stats"
        open={showStats}
        onCancel={() => setShowStats(false)}
        footer={[
          <Button key="close" onClick={() => setShowStats(false)}>
            close
          </Button>
        ]}
        width={600}
      >
        {stats && (
          <Space direction="vertical" style={{ width: '100%' }}>
            <Row gutter={16}>
              <Col span={12}>
                <Statistic title="action number" value={stats.totalActions} />
              </Col>
              <Col span={12}>
                <Statistic title="session number" value={stats.sessionCount} />
              </Col>
            </Row>
            
            <Row gutter={16}>
              <Col span={12}>
                <Statistic title="user number" value={stats.userCount} />
              </Col>
              <Col span={12}>
                <Statistic 
                  title="time range" 
                  value={stats.timeRange.startFormatted && stats.timeRange.endFormatted 
                    ? `${stats.timeRange.startFormatted} to ${stats.timeRange.endFormatted}` 
                    : "no data"
                  } 
                />
              </Col>
            </Row>

            <div>
              <h4>action distribution</h4>
              {Object.entries(stats.actionsByType).map(([type, count]) => (
                <Row key={type} gutter={16} style={{ marginBottom: 8 }}>
                  <Col span={12}>{type}</Col>
                  <Col span={12}>{count} times</Col>
                </Row>
              ))}
            </div>
          </Space>
        )}
      </Modal>
    </>
  );
};
