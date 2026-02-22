import React from 'react';
import './AndroidFrame.css';

interface AndroidFrameProps {
  children: React.ReactNode;
  color?: string;
}

export function AndroidFrame({ children, color = 'black' }: AndroidFrameProps) {
  return (
    <div className={`android-frame android-frame--${color}`}>
      <div className="android-screen-border">
        {/* Status bar */}
        <div className="android-status-bar">
          <div className="android-time">12:00</div>
          <div className="android-status-icons">
            <div className="android-signal">
              <div className="android-signal-bar"></div>
              <div className="android-signal-bar"></div>
              <div className="android-signal-bar"></div>
              <div className="android-signal-bar"></div>
            </div>
            <div className="android-battery">
              <div className="android-battery-level"></div>
            </div>
          </div>
        </div>

        {/* Screen content */}
        <div className="android-screen-content">
          {children}
        </div>

        {/* Navigation bar */}
        <div className="android-navigation-bar">
          <div className="android-nav-button android-nav-button--back"></div>
          <div className="android-nav-button android-nav-button--home"></div>
          <div className="android-nav-button android-nav-button--recent"></div>
        </div>
      </div>
    </div>
  );
}
