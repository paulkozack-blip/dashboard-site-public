import json
from datetime import datetime
from pathlib import Path

INDICATORS_CONFIG_PATH = Path("config/indicators.json")

def create_default_config() -> dict[str, int | list[int] | str]:
    """Создать конфиг по умолчанию"""
    default_config: dict[str, int | list[int] | str] = {
        "ema_periods": [50, 200],
        "rsi_period": 14,
        "last_updated": datetime.now().isoformat(),
        "updated_by": "system"
    }
    
    INDICATORS_CONFIG_PATH.parent.mkdir(exist_ok=True)
    with open(INDICATORS_CONFIG_PATH, 'w', encoding='utf-8') as f:
        json.dump(default_config, f, indent=2, ensure_ascii=False)
    
    return default_config
    

def get_indicators_config() -> dict[str, int | list[int] | str]:
    """Получить текущие настройки индикаторов"""
    if not INDICATORS_CONFIG_PATH.exists():
        return create_default_config()
    
    with open(INDICATORS_CONFIG_PATH, 'r', encoding='utf-8') as f:
        return json.load(f)
    

def update_indicators_config(new_settings: dict[str, int | list[int] | str]) -> dict[str, int | list[int] | str]:
    """Обновить настройки индикаторов"""
    current_config: dict[str, int | list[int] | str] = get_indicators_config()
    
    updated_config: dict[str, int | list[int] | str] = {
        **current_config,
        **new_settings,
        "last_updated": datetime.now().isoformat()
    }
    
    # Создаем папку config если её нет
    INDICATORS_CONFIG_PATH.parent.mkdir(exist_ok=True)
    
    with open(INDICATORS_CONFIG_PATH, 'w', encoding='utf-8') as f:
        json.dump(updated_config, f, indent=2, ensure_ascii=False)
    
    return updated_config