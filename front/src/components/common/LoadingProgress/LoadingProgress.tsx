import { useEffect, useState } from "react";
import "./LoadingProgress.css";

interface LoadingProgressProps {
  active: boolean;
}

export default function LoadingProgress({ active }: LoadingProgressProps) {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let timer: any = null;

    if (active) {
      setVisible(true);
      setProgress(0);
      timer = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 95) return prev;
          return prev + 1;
        });
      }, 40);
    } else {
      setProgress(100);
      timer = setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 400);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [active]);

  return (
    <div className={`loading-overlay ${visible ? "active" : ""}`}>
      <div className="loading-box">
        <div className="loading-bar">
          <div className="loading-bar-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="loading-text">{progress}%</div>
      </div>
    </div>
  );
} 