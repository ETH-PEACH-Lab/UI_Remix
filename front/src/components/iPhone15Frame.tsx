import React from 'react';
import './iPhone15Frame.css';

interface iPhone15FrameProps {
  children: React.ReactNode;
  color?: string;
}

export function IPhone15Frame({ children, color = 'black' }: iPhone15FrameProps) {
  return (
    <div className={`iphone15-frame iphone15-frame--${color}`}>
      <div className="iphone15-screen-border">
        {/* Status bar */}
        <div className="iphone15-status-bar">
          {/* Camera/Dynamic Island placeholder */}
          <div className="iphone15-dynamic-island"></div>
          <div className="iphone15-time">12:00</div>
          <div className="iphone15-status-icons">
            <div className="iphone15-signal">
              <div className="iphone15-signal-bar"></div>
              <div className="iphone15-signal-bar"></div>
              <div className="iphone15-signal-bar"></div>
              <div className="iphone15-signal-bar"></div>
            </div>
            <div className="iphone15-battery">
              <div className="iphone15-battery-level"></div>
            </div>
          </div>
        </div>

        {/* Screen content */}
        <div className="iphone15-screen-content">
          {children}
        </div>
      </div>
    </div>
  );
}
