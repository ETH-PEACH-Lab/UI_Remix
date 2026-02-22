import React, { useState } from 'react';
import { Form, Input, Button, Typography, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import './login.css';

const { Title, Text } = Typography;

interface LocationState {
  from?: string;
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  const state = location.state as LocationState;
  const from = state?.from || '/app';

  const handleSubmit = async (values: { email: string; password: string }) => {
    const { email, password } = values;
    console.log('Login attempt with:', email, password);
    setIsLoading(true);
    
    try {
      if (email === 'test' || email === 'test@example.com') {
        if (password === '123456') {
          localStorage.setItem('isAuthenticated', 'true');
          localStorage.setItem('userEmail', email === 'test' ? 'test@example.com' : email);
          
          message.success('Login successful!');
          
          setTimeout(() => {
            navigate(from, { replace: true });
          }, 1000);
        } else {
          message.error('Incorrect password. Please try again.');
        }
      } else {
        message.error('Invalid username. Please enter a valid username.');
      }
    } catch (error) {
      console.error('Login failed:', error);
      message.error('Login failed. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-logo">
          <img src="/logo.svg" alt="Logo" className="logo-image" />
        </div>
        
        <Title level={3} className="login-title">Log in to UI Remix</Title>
        
        <div className="login-hint">
          <Text type="secondary">
            User name: <strong>test</strong> | Password: <strong>123456</strong>
          </Text>
        </div>
        
        <Form
          name="login"
          layout="vertical"
          onFinish={handleSubmit}
          className="login-form"
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Please enter your username' }
            ]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="Username (test)" 
              size="large"
            />
          </Form.Item>
          
          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Please enter your password' }]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="Password (123456)" 
              size="large"
            />
          </Form.Item>
          
          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              className="login-button" 
              block 
              size="large"
              loading={isLoading}
            >
              Log in
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default Login; 