import pandas as pd
from datetime import datetime
from pathlib import Path
import json
from typing import Set, Dict, List, Tuple, Any
import logging
import math

import ta # type: ignore
from ta.trend import EMAIndicator  # type: ignore
from ta.momentum import RSIIndicator  # type: ignore

from app.utils.config_manager import get_indicators_config


def parse_date(date_input: Any) -> str:
    """Convert various date formats to YYYY-MM-DD"""

    # Если datetime объект
    if isinstance(date_input, datetime):
        return date_input.strftime("%Y-%m-%d")

    # Переводим всё в строку
    date_str = str(date_input).strip()

    # Попытка распарсить по известным форматам
    formats = [
        "%Y-%m-%d %H:%M:%S",   # 2025-08-06 00:00:00
        "%Y-%m-%d",            # 2025-08-06
        "%Y%m%d",              # 20250806
        "%m/%d/%Y",            # 08/06/2025
        "%d.%m.%Y",            # 06.08.2025
        "%Y-%m-%d %H:%M:%S.%f" # 2025-08-06 00:00:00.000
    ]

    for fmt in formats:
        try:
            return datetime.strptime(date_str, fmt).strftime("%Y-%m-%d")
        except ValueError:
            continue

    # Если есть время, попробуем взять только дату
    if " " in date_str:
        date_part = date_str.split(" ")[0]
        try:
            return datetime.strptime(date_part, "%Y-%m-%d").strftime("%Y-%m-%d")
        except ValueError:
            pass

    raise ValueError(f"Unable to parse date: {date_str}")


DATA_DIR = Path("data")  

def get_existing_dates_for_ticker(ticker: str, data_dir: Path = DATA_DIR) -> Set[str]:
    """
    Возвращает множество дат, которые уже есть для данного тикера
    """
    filename = data_dir / f"{ticker}.json"
    existing_dates: Set[str] = set()
    
    if filename.exists():
        try:
            existing_data: List[Dict[str, Any]] = json.loads(filename.read_text(encoding='utf-8'))
            # Явно указываем тип для каждой записи
            existing_dates = {str(record['date']) for record in existing_data}
        except Exception as e:
            logging.warning(f"Error reading existing data for {ticker}: {str(e)}")
    
    return existing_dates


def calculate_indicators(df: pd.DataFrame) -> pd.DataFrame:
    """Calculate technical indicators with settings from config"""
    config = get_indicators_config()
    ema_periods = [int(p) for p in config['ema_periods']] if isinstance(config['ema_periods'], list) else [50, 200]
    rsi_period = int(config['rsi_period']) if isinstance(config['rsi_period'], (int, str)) else 14

    price_col = "price" if "price" in df.columns else "close"

    # Calculate EMAs
    for period in ema_periods:
        ema_values = EMAIndicator(df[price_col], window=period).ema_indicator()
        df[f"ema_{period}"] = ema_values

    # Calculate RSI
    rsi_values = RSIIndicator(df[price_col], window=rsi_period).rsi()
    df[f"rsi_{rsi_period}"] = rsi_values

    # Заменяем все NaN на None для корректного JSON
    df = df.astype(object).where(pd.notnull(df), None) #type: ignore

    return df


def save_indicators_to_json(ticker: str, df: pd.DataFrame, indicators_df: pd.DataFrame):
    """Сохранить индикаторы в отдельный JSON файл"""
    # Создаем структуру для сохранения
    indicators_data: Dict[str, Any] = {
        'ticker': ticker,
        'dates': df['date'].tolist() if 'date' in df.columns else [],
        'indicators': {}
    }
    
    # Добавляем EMA и RSI индикаторы
    for col in indicators_df.columns:
        if col.startswith('ema_') or col.startswith('rsi_'):
            indicators_data['indicators'][col] = indicators_df[col].tolist()
    
    # Сохраняем в файл
    indicators_dir = Path("data/indicators")
    indicators_dir.mkdir(exist_ok=True)
    
    output_path = indicators_dir / f"{ticker}_indicators.json"
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(indicators_data, f, indent=2, ensure_ascii=False)
    
    return output_path


def process_linear_data(df: pd.DataFrame) -> Tuple[List[Dict[str, Any]], Dict[str, int]]: 
    """
    Обрабатывает данные и возвращает статистику по новым и существующим записям
    """
    processed_data: List[Dict[str, Any]] = []
    new_records = 0
    existing_records = 0
    skipped_invalid = 0  # Добавляем счетчик пропущенных некорректных записей
    
    # Получаем тикер из DataFrame
    ticker = df['ticker'].iloc[0] if not df.empty else ""
    
    # Загружаем существующие даты для этого тикера
    existing_dates = get_existing_dates_for_ticker(ticker)
    
    for _, row in df.iterrows():
            # Проверяем, что числовые значения валидны
        try:
            volume_val = float(row['volume'])
            price_val = float(row['price'])
            
            # Пропускаем строки с нулями, NaN или бесконечностью
            if (volume_val <= 0 or price_val <= 0 or 
                math.isnan(volume_val) or math.isnan(price_val) or
                math.isinf(volume_val) or math.isinf(price_val)):
                skipped_invalid += 1
                continue
                
        except (ValueError, TypeError):
            skipped_invalid += 1
            continue
        
        # Преобразуем дату в строковый формат
        date_obj = row['date']
        if hasattr(date_obj, 'isoformat'):
            date_str = date_obj.isoformat()
        elif isinstance(date_obj, str):
            date_str = date_obj
        else:
            date_str = str(date_obj)
        
        record: Dict[str, Any] = {
            'date': date_str,
            'volume': volume_val,  # Используем уже проверенные значения
            'price': price_val
        }        
        # Проверяем, существует ли уже запись с этой датой
        if record['date'] in existing_dates:
            existing_records += 1
            continue  # Пропускаем существующие записи
            
        processed_data.append(record)  
        new_records += 1
    
    stats = {
        'new_records': new_records,
        'existing_records': existing_records,
        'skipped_invalid': skipped_invalid,  # Добавляем в статистику
        'total_processed': len(df)
    }
    
    return processed_data, stats


def process_candlestick_data(df: pd.DataFrame, ticker: str) -> Tuple[Dict[str, Any], Dict[str, int]]:
    """
    Обрабатывает данные свечей и возвращает данные со статистикой.
    
    Args:
        df: DataFrame с данными свечей
        ticker: Символ тикера
        
    Returns:
        Кортеж, содержащий словарь обработанных данных и словарь статистики
        
    Raises:
        ValueError: Если отсутствуют обязательные столбцы или содержат некорректные значения
    """
    # Проверка наличия обязательных столбцов
    required_columns = {'date', 'open', 'high', 'low', 'close', 'volume'}
    missing_cols = required_columns - set(df.columns)
    if missing_cols:
        raise ValueError(
            f"Отсутствуют обязательные столбцы для тикера {ticker}: {missing_cols}"
        )

    # Определение числовых столбцов
    numeric_columns = ['open', 'high', 'low', 'close', 'volume']
    df_processed = df.copy()
    
    # Преобразование числовых столбцов
    for col in numeric_columns:
        try:
            df_processed[col] = pd.to_numeric(df_processed[col], errors='coerce')  # type: ignore   
        except Exception as e:
            raise ValueError(
                f"Столбец {col} в тикере {ticker} содержит некорректные значения: {str(e)}"
            )

    # Преобразование дат
    df_processed['date'] = [parse_date(str(d)) for d in df_processed['date']]

    # Сортировка и удаление дубликатов
    df_processed = df_processed.sort_values("date", inplace=False)  # type: ignore
    df_processed = df_processed.drop_duplicates(subset=['date'], keep='last')
    
    # Инициализация счетчиков
    new_records = 0
    skipped_invalid = 0
    
    # Получение существующих дат
    existing_dates = get_existing_dates_for_ticker(ticker)
    
    processed_data: List[Dict[str, Any]] = []
    
    # Обработка каждой строки
    for _, row in df_processed.iterrows():
        try:
            # Извлечение числовых значений
            values = {
                col: float(row[col]) 
                for col in numeric_columns
            }
            
            # Проверка значений
            if any(math.isnan(value) or value <= 0 for value in values.values()):
                skipped_invalid += 1
                continue
                
            # Проверка существующих дат
            date_str = str(row['date'])
            if date_str in existing_dates:
                skipped_invalid += 1
                continue
                
            # Создание записи
            record: Dict[str, Any] = {
                'date': date_str,
                **values
            }
            processed_data.append(record)
            new_records += 1
            
        except (ValueError, TypeError) as e:
            logging.warning(
                f"Ошибка обработки строки для {ticker}: {str(e)}"
            )
            skipped_invalid += 1
            continue
    
    # Подготовка результата
    result: Dict[str, Any] = {
        'type': 'candlestick',
        'ticker': ticker,
        'group': ticker,
        'data': processed_data
    }
    
    # Подготовка статистики
    stats: Dict[str, int] = {
        'new_records': new_records,
        'existing_records': skipped_invalid,
        'skipped_invalid': skipped_invalid,
        'total_processed': len(df_processed)
    }
    
    return result, stats


def save_json_data(data: List[Dict[str, Any]], ticker: str, group: str, data_type: str, data_dir: Path = DATA_DIR) -> Dict[str, int]:
    """
    Сохраняет данные в JSON файл, добавляя к существующим
    """
    filename = data_dir / f"{ticker}.json"
    
    # Загружаем существующие данные, если файл есть
    existing_data: List[Dict[str, Any]] = []
    if filename.exists():
        try:
            existing_data = json.loads(filename.read_text(encoding='utf-8'))
        except Exception as e:
            logging.warning(f"Error reading existing file {filename}: {str(e)}")
            existing_data = []
    
    # ПРОВЕРКА НА ПУСТЫЕ ДАННЫЕ
    if not data:
        return {
            'existing_records': len(existing_data),
            'new_records_added': 0,
            'total_records_now': len(existing_data)
        }
    
    # Добавляем новые данные в начало
    all_data = data + existing_data
    
    # Убедимся что данные отсортированы по дате (от старых к новым)
    all_data_sorted = sorted(all_data, key=lambda x: x['date'])
    
    # Сохраняем обновленные данные (БЕЗ индикаторов)
    try:
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(all_data_sorted, f, ensure_ascii=False, indent=2)
    except Exception as e:
        logging.error(f"Error saving data to {filename}: {str(e)}")
        raise
    
    # СОХРАНЯЕМ МЕТА-ИНФОРМАЦИЮ - важно!
    meta_filename = data_dir / "meta.json"
    meta_data = {}
    if meta_filename.exists():
        try:
            meta_data = json.loads(meta_filename.read_text(encoding='utf-8'))
        except:
            meta_data = {}
    
    # Обновляем мета-информацию для этого тикера
    meta_data[ticker] = {
        'ticker': ticker,
        'group': group,
        'type': data_type,
        'last_updated': datetime.now().isoformat(),
        'total_records': len(all_data_sorted)
    }
    
    # Сохраняем обновленную мета-информацию
    with open(meta_filename, 'w', encoding='utf-8') as f:
        json.dump(meta_data, f, ensure_ascii=False, indent=2)
    
    return {
        'existing_records': len(existing_data),
        'new_records_added': len(data),
        'total_records_now': len(all_data_sorted)
    }


def load_json_data(ticker: str) -> Dict[str, Any]:
    """Load data from JSON file and indicators"""
    result: Dict[str, Any] = {}
    
    # Загружаем основные данные
    file_path = Path("data") / f"{ticker}.json"
    if file_path.exists():
        with open(file_path, 'r', encoding='utf-8') as f:
            result = json.load(f)
    
    # Загружаем индикаторы если есть
    indicators_path = Path("data/indicators") / f"{ticker}_indicators.json"
    if indicators_path.exists():
        try:
            with open(indicators_path, 'r', encoding='utf-8') as f:
                indicators_data = json.load(f)
            result['indicators'] = indicators_data
        except Exception as e:
            logging.warning(f"Error loading indicators for {ticker}: {str(e)}")
    
    return result