import os
from fastapi import Depends


class GlobalConfig:
    def __init__(self):
        self.data_dir = "./data"
        self.web_ids = sorted(list(set(os.listdir(self.data_dir))))
        self.openai_models = [
            "gpt-5",
            "gpt-4o",
            "gpt-4o-mini",
            "gpt-4.1", 
            "gpt-4.1-mini", 
            "o3", 
            "o3-mini", 
            "o4-mini", 
        ]
        self.anthropic_models = [
            "claude-sonnet-4-20250514",
            "claude-3-7-sonnet-20250219",
            "claude-3-5-sonnet-20241022",
        ]

config = GlobalConfig()
def get_config() -> GlobalConfig:
    return config
