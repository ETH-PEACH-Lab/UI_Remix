import logging
import sys
from pathlib import Path
from typing import Optional

class UIRemixLogger:
    """Unified logger for UI Remix."""
    
    _instance: Optional['UIRemixLogger'] = None
    _logger: Optional[logging.Logger] = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        if self._logger is None:
            self._setup_logger()
    
    def _setup_logger(self):
        """Configure console + file logging."""
        self._logger = logging.getLogger("ui_remix")
        self._logger.setLevel(logging.INFO)
        
        if self._logger.handlers:
            return
        
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(logging.INFO)
        console_handler.setFormatter(formatter)
        self._logger.addHandler(console_handler)
        
        log_file = Path(__file__).parent.parent / "server.log"
        file_handler = logging.FileHandler(log_file, encoding='utf-8')
        file_handler.setLevel(logging.INFO)
        file_handler.setFormatter(formatter)
        self._logger.addHandler(file_handler)
        
        self._logger.propagate = False
    
    @property
    def logger(self) -> logging.Logger:
        """Return the underlying logger instance."""
        return self._logger
    
    def info(self, message: str):
        """Log an INFO message."""
        self._logger.info(message)
    
    def warning(self, message: str):
        """Log a WARNING message."""
        self._logger.warning(message)
    
    def error(self, message: str):
        """Log an ERROR message."""
        self._logger.error(message)
    
    def debug(self, message: str):
        """Log a DEBUG message."""
        self._logger.debug(message)
    
    def set_level(self, level: int):
        """Set log level for logger and handlers."""
        self._logger.setLevel(level)
        for handler in self._logger.handlers:
            handler.setLevel(level)

ui_remix_logger = UIRemixLogger()

def get_logger() -> logging.Logger:
    """Get the UI Remix logger."""
    return ui_remix_logger.logger

def log_info(message: str):
    """Log an INFO message."""
    ui_remix_logger.info(message)

def log_warning(message: str):
    """Log a WARNING message."""
    ui_remix_logger.warning(message)

def log_error(message: str):
    """Log an ERROR message."""
    ui_remix_logger.error(message)

def log_debug(message: str):
    """Log a DEBUG message."""
    ui_remix_logger.debug(message) 