# backend/app/api/routes/charts.py
from fastapi import APIRouter, UploadFile, File, HTTPException, Query, Depends, Path
from typing import Optional, List, Dict, BinaryIO, Union, Any
from typing_extensions import TypedDict
import pandas as pd
import json
from datetime import datetime
import logging
from pathlib import Path
from pydantic import BaseModel
import urllib.parse
from app.models.user import User
from app.api import deps

from app.utils.data_processing import (
    process_linear_data,
    process_candlestick_data, 
    calculate_indicators,
    save_json_data,
    save_indicators_to_json,
    load_json_data, 
)

from app.utils.config_manager import (
    update_indicators_config
)
# Set up logging
logging.basicConfig(
    filename='log.txt',
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

router = APIRouter()

DATA_DIR = Path("data")
DATA_DIR.mkdir(exist_ok=True)

@router.post("/upload")
async def upload_linear_data(
    file: UploadFile = File(...),
    admin_user: User = Depends(deps.get_admin_user)
) -> Dict[str, Any]:  
    try:
        file_content: BinaryIO = file.file
        df = pd.read_excel(file_content) # type: ignore
        required_columns = {'date', 'ticker', 'volume', 'price'}
        
        if not all(col in df.columns for col in required_columns):
            raise HTTPException(
                status_code=400,
                detail="Missing required columns: date, ticker, volume, price"
            )
            
        # Статистика обработки
        total_records_in_file = len(df)
        tickers_count = 0
        total_new_records = 0
        total_existing_records = 0
        processed_tickers: List[Dict[str, Any]] = []
        
        # Process data for each ticker
        for ticker, group_df in df.groupby('ticker'): # type: ignore
            ticker_str = str(ticker) # type: ignore
            tickers_count += 1
            
            # Determine group from ticker name
            if '95' in ticker_str:
                group = '95'
            elif '92' in ticker_str:
                group = '92'
            elif 'ДТ' in ticker_str:
                group = 'ДТ'
            else:
                group = 'Other'
                
            # Обрабатываем данные и получаем статистику
            group_df['date'] = pd.to_datetime(group_df['date']).dt.strftime('%Y-%m-%d') # type: ignore  

            processed_data, stats = process_linear_data(group_df)
            total_new_records += stats['new_records']
            total_existing_records += stats['existing_records']
            
            # Сохраняем данные (добавляем к существующим)
            save_stats = save_json_data(processed_data, ticker_str, group, "line")
            
            # РАСЧЕТ ИНДИКАТОРОВ после сохранения данных
            # Загружаем полные данные для расчета индикаторов
            full_data = load_json_data(ticker_str)
            if full_data and isinstance(full_data, list) and len(full_data) > 0:
                df_full = pd.DataFrame(full_data)
                df_with_indicators = calculate_indicators(df_full)
                save_indicators_to_json(ticker_str, df_full, df_with_indicators)
                logging.info(f"Indicators calculated and saved for {ticker_str}")
            
            processed_tickers.append({
                'ticker': ticker_str,
                'group': group,
                'new_records': stats['new_records'],
                'existing_records': stats['existing_records'],
                'total_in_file': stats['total_processed'],
                'total_in_db_now': save_stats['total_records_now']
            })
            
        logging.info(
            f"Successfully processed file: {file.filename}. "
            f"Total records: {total_records_in_file}, "
            f"New records added: {total_new_records}, "
            f"Existing records skipped: {total_existing_records}, "
            f"Tickers processed: {tickers_count}"
        )
        
        return {
            "message": "Data processed successfully",
            "statistics": {
                "filename": file.filename,
                "total_records_in_file": total_records_in_file,
                "new_records_added": total_new_records,
                "existing_records_skipped": total_existing_records,
                "tickers_processed": tickers_count,
                "processing_date": datetime.now().isoformat(),
                "tickers_details": processed_tickers
            }
        }
        
    except Exception as e:
        logging.error(f"Error processing file {file.filename}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/upload-candlestick")
async def upload_candlestick_data(
    file: UploadFile = File(...),
    admin_user: User = Depends(deps.get_admin_user)
) -> Dict[str, Any]:
    try:
        file_content: BinaryIO = file.file
        excel_file = pd.ExcelFile(file_content)  # type: ignore
        
        # Статистика обработки
        total_sheets = len(excel_file.sheet_names)
        processed_sheets = 0
        total_new_records = 0
        total_existing_records = 0
        total_skipped_invalid = 0
        processed_tickers: List[Dict[str, Any]] = []
        
        # Process data for each sheet (ticker)
        for sheet_name in excel_file.sheet_names:
            df = pd.read_excel(excel_file, sheet_name=sheet_name) # type: ignore
            processed_sheets += 1
            
            # Обрабатываем данные и получаем статистику
            candlestick_data, stats = process_candlestick_data(df, str(sheet_name))
            total_new_records += stats['new_records']
            total_existing_records += stats['existing_records']
            total_skipped_invalid += stats['skipped_invalid']
            
            # Сохраняем данные (добавляем к существующим)
            save_stats = save_json_data(
               candlestick_data['data'], 
                str(sheet_name),  # Приводим к строке
                str(sheet_name),  # Приводим к строке
                "candlestick"
            )
            
            # РАСЧЕТ ИНДИКАТОРОВ после сохранения данных
            full_data = load_json_data(str(sheet_name))
            if full_data and isinstance(full_data, list) and len(full_data) > 0:
                df_full = pd.DataFrame(full_data)
                df_with_indicators = calculate_indicators(df_full)
                save_indicators_to_json(str(sheet_name), df_full, df_with_indicators)
                logging.info(f"Indicators calculated and saved for {sheet_name}")
            
            processed_tickers.append({
                'ticker': sheet_name,
                'group': sheet_name,  # group = ticker
                'new_records': stats['new_records'],
                'existing_records': stats['existing_records'],
                'skipped_invalid': stats['skipped_invalid'],
                'total_in_file': stats['total_processed'],
                'total_in_db_now': save_stats['total_records_now']
            })
            
        logging.info(
            f"Successfully processed candlestick file: {file.filename}. "
            f"Total sheets: {total_sheets}, "
            f"New records added: {total_new_records}, "
            f"Existing records skipped: {total_existing_records}, "
            f"Invalid records skipped: {total_skipped_invalid}"
        )
        
        return {
            "message": "Candlestick data processed successfully",
            "statistics": {
                "filename": file.filename,
                "total_sheets": total_sheets,
                "new_records_added": total_new_records,
                "existing_records_skipped": total_existing_records,
                "invalid_records_skipped": total_skipped_invalid,
                "sheets_processed": processed_sheets,
                "processing_date": datetime.now().isoformat(),
                "tickers_details": processed_tickers
            }
        }
        
    except Exception as e:
        logging.error(f"Error processing candlestick file {file.filename}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    


@router.post("/reset")
async def reset_data(
    ticker: Optional[str] = None,
    admin_user: User = Depends(deps.get_admin_user)
):
    try:
        logging.info(f"=== RESET STARTED ===")
        logging.info(f"Reset request for ticker: {ticker}")
        
        if ticker:
            # Декодируем тикер если он пришел в URL encoded формате
            decoded_ticker = urllib.parse.unquote(ticker)
            logging.info(f"Decoded ticker: '{decoded_ticker}'")
            
            # Удаляем файл данных
            file_path = DATA_DIR / f"{decoded_ticker}.json"
            if file_path.exists():
                file_path.unlink()
                logging.info(f"✓ Deleted data file: {file_path}")
            else:
                logging.warning(f"✗ Data file not found: {file_path}")
            
            # Удаляем файл индикаторов
            indicators_dir = DATA_DIR / "indicators"
            indicators_file = indicators_dir / f"{decoded_ticker}_indicators.json"
            if indicators_file.exists():
                indicators_file.unlink()
                logging.info(f"✓ Deleted indicators file: {indicators_file}")
            else:
                logging.warning(f"✗ Indicators file not found: {indicators_file}")
            
            # Удаляем из meta.json 
            meta_path = DATA_DIR / "meta.json"
            if meta_path.exists():
                try:
                    # Читаем meta.json
                    with open(meta_path, 'r', encoding='utf-8') as f:
                        meta_data = json.load(f)
                    
                    logging.info(f"📋 Meta.json BEFORE - Keys: {list(meta_data.keys())}")
                    logging.info(f"🔍 Looking for ticker: '{decoded_ticker}'")
                    
                    # Простой поиск - проверяем прямое совпадение
                    if decoded_ticker in meta_data:
                        logging.info(f"✅ Found ticker '{decoded_ticker}' in meta.json, deleting...")
                        del meta_data[decoded_ticker]
                        
                        # Записываем обратно
                        with open(meta_path, 'w', encoding='utf-8') as f:
                            json.dump(meta_data, f, indent=2, ensure_ascii=False)
                        
                        logging.info(f"✅ Successfully removed '{decoded_ticker}' from meta.json")
                        logging.info(f"📋 Meta.json AFTER - Keys: {list(meta_data.keys())}")
                        
                    else:
                        logging.warning(f"❌ Ticker '{decoded_ticker}' NOT FOUND in meta.json")
                        
                        # Покажем что там есть для отладки
                        all_tickers = list(meta_data.keys())
                        logging.info(f"📝 All tickers in meta.json: {all_tickers}")
                        
                        # Поиск похожих
                        similar = [t for t in all_tickers if decoded_ticker.lower() in t.lower()]
                        if similar:
                            logging.info(f"🔎 Similar tickers found: {similar}")
                            
                except Exception as e:
                    logging.error(f"💥 Error updating meta.json: {str(e)}")
                    import traceback
                    logging.error(f"Stack trace: {traceback.format_exc()}")
            else:
                logging.error("❌ meta.json file not found!")
            
            logging.info(f"=== RESET COMPLETED for: {decoded_ticker} ===")
            return {"message": f"Data reset for {decoded_ticker}"}
            
        else:
            # Delete all data files
            for file in DATA_DIR.glob("*.json"):
                if file.name != "meta.json":
                    file.unlink()
                    logging.info(f"Deleted data file: {file.name}")
            
            # Delete all indicator files
            indicators_dir = DATA_DIR / "indicators"
            if indicators_dir.exists():
                for file in indicators_dir.glob("*.json"):
                    file.unlink()
                    logging.info(f"Deleted indicator file: {file.name}")
            
            # Reset meta.json to empty
            meta_path = DATA_DIR / "meta.json"
            if meta_path.exists():
                with open(meta_path, 'w', encoding='utf-8') as f:
                    json.dump({}, f, indent=2, ensure_ascii=False)
                logging.info("Reset meta.json to empty")
            
            logging.info("Reset all data completed")
            return {"message": "All data reset"}
            
    except Exception as e:
        logging.error(f"💥 Error during reset: {str(e)}")
        import traceback
        logging.error(f"Stack trace: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/available-groups")
async def get_available_groups() -> Dict[str, Dict[str, Any]]:
    """Возвращает все доступные группы из meta.json"""
    try:
        meta_path = DATA_DIR / "meta.json"
        if not meta_path.exists():
            return {}
        
        with open(meta_path, 'r', encoding='utf-8') as f:
            meta_data = json.load(f)
        
        groups: Dict[str, Dict[str, Any]] = {}
        
        for ticker, ticker_info in meta_data.items():
            group_name = ticker_info.get('group')
            chart_type = ticker_info.get('type', 'line')
            
            if group_name not in groups:
                groups[group_name] = {
                    'type': chart_type,
                    'tickers': []
                }
            groups[group_name]['tickers'].append(ticker)
        
        return groups
        
    except Exception as e:
        logging.error(f"Error loading groups from meta.json: {str(e)}")
        raise HTTPException(status_code=500, detail="Error loading groups")

@router.get("/api/chart-data")
async def get_chart_data(
    group: Optional[str] = Query(None),
    ticker: Optional[str] = Query(None)
) -> Union[Dict[str, Any], Dict[str, Dict[str, Any]]]:
    try:
        # Загружаем метаданные для получения информации о группах
        meta_path = DATA_DIR / "meta.json"
        if not meta_path.exists():
            raise HTTPException(status_code=404, detail="Meta data not found")
        
        with open(meta_path, 'r', encoding='utf-8') as f:
            meta_data = json.load(f)
        
        if ticker:
            # Загрузка данных для конкретного тикера
            data_file = DATA_DIR / f"{ticker}.json"
            if not data_file.exists():
                raise HTTPException(status_code=404, detail="Ticker not found")
            
            with open(data_file, 'r', encoding='utf-8') as f:
                chart_data = json.load(f)
            
            # Добавляем метаинформацию
            ticker_info = meta_data.get(ticker, {})
            return {
                "ticker": ticker,
                "group": ticker_info.get('group', 'Unknown'),
                "type": ticker_info.get('type', 'line'),
                "data": chart_data
            }
            
        if group:
            # Загрузка данных для всей группы
            group_data: Dict[str, Dict[str, Any]] = {}
            
            # Находим все тикеры в этой группе
            group_tickers = {
                ticker: info for ticker, info in meta_data.items() 
                if info.get('group') == group
            }
            
            if not group_tickers:
                raise HTTPException(status_code=404, detail="Group not found")
            
            # Загружаем данные для каждого тикера в группе
            for ticker_name in group_tickers.keys():
                data_file = DATA_DIR / f"{ticker_name}.json"
                if data_file.exists():
                    with open(data_file, 'r', encoding='utf-8') as f:
                        chart_data = json.load(f)
                    
                    group_data[ticker_name] = {
                        "ticker": ticker_name,
                        "group": group,
                        "type": group_tickers[ticker_name].get('type', 'line'),
                        "data": chart_data
                    }
            
            return group_data
            
        raise HTTPException(
            status_code=400,
            detail="Either group or ticker parameter is required"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error fetching chart data: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/tickers")
async def get_tickers() -> List[str]:
    """Возвращает только список тикеров из meta.json"""
    try:
        meta_file = DATA_DIR / "meta.json"
        
        if not meta_file.exists():
            logging.warning("meta.json file not found")
            return []
        
        # Читаем и парсим meta.json
        meta_content = meta_file.read_text(encoding='utf-8')
        meta_data = json.loads(meta_content)
        
        # Извлекаем только тикеры
        tickers = list(meta_data.keys())
        
        logging.info(f"Found {len(tickers)} tickers in meta.json")
        return tickers
        
    except Exception as e:
        logging.error(f"Error fetching tickers: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error while fetching tickers")

from fastapi import Body


@router.post("/set-indicators")
async def set_indicators(
    params: Dict[str, Any] = Body(
        ...,
        example={
            "ema_periods": [50, 200],
            "rsi_period": 14  
        }
    ),
    admin_user: User = Depends(deps.get_admin_user)
):
    try:
        if 'ema_periods' not in params or 'rsi_period' not in params:
            raise HTTPException(
                status_code=400,
                detail="Missing required parameters"
            )
            
        # Обновляем настройки в конфиге
        update_indicators_config({
            "ema_periods": params['ema_periods'],
            "rsi_period": params['rsi_period']
        })
        
        # Пересчитываем индикаторы для всех файлов
        for file in DATA_DIR.glob("*.json"):
            if file.name == "meta.json":
                continue
                
            # Загружаем данные
            with open(file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # Преобразуем в DataFrame и пересчитываем индикаторы
            df = pd.DataFrame(data)
            df_with_indicators = calculate_indicators(df)
            
            # Сохраняем индикаторы отдельно
            ticker = file.stem
            save_indicators_to_json(ticker, df, df_with_indicators)
            
        logging.info("Updated indicators with new parameters")
        return {"message": "Indicators updated successfully"}
        
    except Exception as e:
        logging.error(f"Error updating indicators: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    


class IndicatorSettings(TypedDict):
    ema_periods: List[int]
    rsi_period: int
    last_updated: str
    updated_by: str


@router.get("/getIndicatorSettings")
async def get_indicator_settings() -> IndicatorSettings:
    try:
        # Пробуем разные возможные пути
        possible_paths = [
            Path("backend/config/indicators.json"),
            Path("config/indicators.json"),
            Path("indicators.json"),
            Path(__file__).parent.parent.parent / "config" / "indicators.json",
        ]
        
        config_path = None
        for path in possible_paths:
            if path.exists():
                config_path = path
                break
        
        if not config_path:
            raise HTTPException(status_code=404, detail="Config file not found")
        
        with open(config_path, 'r', encoding='utf-8') as f:
            return json.load(f)
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))    


class IndicatorPoint(BaseModel):
    date: str
    value: Optional[float] = None

class IndicatorResponse(BaseModel):
    ticker: str
    indicator: str
    data: List[IndicatorPoint]

@router.get("/indicators/{ticker}", response_model=IndicatorResponse)
async def get_indicator(
    ticker: str,
    indicator: str = Query(..., description="Indicator name (e.g. ema, rsi)"),
    period: int = Query(..., description="Indicator period (e.g. 14, 50, 200)")
):
    # Декодируем тикер из URL
    decoded_ticker: str = urllib.parse.unquote(ticker)

    # Формируем путь к файлу
    indicators_dir: Path = DATA_DIR / "indicators"
    file_path: Path = indicators_dir / f"{decoded_ticker}_indicators.json"

    # Проверка существования директории
    if not indicators_dir.exists():
        raise HTTPException(status_code=404, detail="Indicators directory not found")

    if not file_path.exists():
        available_files: List[str] = [f.name for f in indicators_dir.glob("*.json")]
        raise HTTPException(status_code=404, detail=f"Ticker not found: {decoded_ticker}. Available: {available_files}")

    # Загружаем JSON
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content: dict[str, Any] = json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading indicator file: {str(e)}")

    key: str = f"{indicator}_{period}"
    indicators: dict[str, Any] = content.get("indicators", {})
    if key not in indicators:
        available_indicators: List[str] = list(indicators.keys())
        raise HTTPException(status_code=404, detail=f"Indicator {key} not found. Available: {available_indicators}")

    dates_raw: List[Any] = content.get("dates", [])
    values_raw: List[Any] = indicators[key]

    # Приводим данные к корректным типам
    dates: List[str] = [str(d) for d in dates_raw]
    values: List[Optional[float]] = [float(v) if v is not None else None for v in values_raw]

    # Формируем список точек индикатора
    data: List[IndicatorPoint] = [
        IndicatorPoint(date=d, value=v) for d, v in zip(dates, values)
        #  if v is not None
    ]

    return IndicatorResponse(
        ticker=str(content.get("ticker", decoded_ticker)),
        indicator=key,
        data=data
    )