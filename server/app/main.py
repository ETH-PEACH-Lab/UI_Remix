from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import pathlib
import os
from fastapi.staticfiles import StaticFiles

from app.schema import ChatResponse, GenerationResponse, BaselineResponse, UserTrackingData, TrackingActionAppend
from app.tools import extract_pdf_text
from app.talk.talk import handle_chat_request
from app.talk.baseline import handle_baseline
from app.retrieval.retrieve import handle_global_retrieve, handle_specific_retrieve, GlobalRetrievalResponse, SpecificRetrievalResponse
from app.generation.code_generation import handle_generate_request
from app.logger_config import get_logger, log_info, log_error

logger = get_logger()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    log_info("🚀 UI Remix server startup complete")
    log_info("📊 OpenAI API error monitoring enabled")
    log_info("🔍 Log level: INFO")
    print("\n" + "="*50)
    print("🚀 UI Remix server is running")
    print("📊 OpenAI API error monitoring enabled")
    print("🔍 OpenAI connection errors will be printed to this terminal")
    print("📄 Log file: server/server.log")
    print("="*50 + "\n")

@app.post("/api/baseline", response_model=BaselineResponse)
async def baseline(
    request: Request, 
):
    log_info("🔵 [API] Request received")
    try:
        result = await handle_baseline(request)
        log_info("[API] Baseline request processed successfully")
        return result
    except Exception as e:
        log_error(f"[API] Request failed: {e}")
        raise

@app.post("/api/chat", response_model=ChatResponse)
async def chat(
    request: Request, 
):
    log_info("🔵 [API] Chat request received")
    try:
        result = await handle_chat_request(request)
        log_info("✅ [API] Chat request processed successfully")
        return result
    except Exception as e:
        log_error(f"❌ [API] Chat request failed: {e}")
        raise

@app.post("/api/globalRetrieve", response_model=GlobalRetrievalResponse)
async def global_retrieve(
    request: Request, 
):
    log_info("🔵 [API] Global retrieval request received")
    try:
        result = await handle_global_retrieve(request)
        log_info("✅ [API] Global retrieval request processed successfully")
        return result
    except Exception as e:
        log_error(f"❌ [API] Global retrieval request failed: {e}")
        raise

@app.post("/api/specificRetrieve", response_model=SpecificRetrievalResponse)
async def specific_retrieve(
    request: Request, 
):
    log_info("🔵 [API] Specific retrieval request received")
    try:
        result = await handle_specific_retrieve(request)
        log_info("✅ [API] Specific retrieval request processed successfully")
        return result
    except Exception as e:
        log_error(f"❌ [API] Specific retrieval request failed: {e}")
        raise

@app.post("/api/generate", response_model=GenerationResponse)
async def generate(
    request: Request, 
):
    log_info("🔵 [API] Code generation request received")
    try:
        result = await handle_generate_request(request)
        log_info("✅ [API] Code generation request processed successfully")
        return result
    except Exception as e:
        log_error(f"❌ [API] Code generation request failed: {e}")
        raise

@app.post("/api/send-tracking-data")
async def send_tracking_data(tracking_data: UserTrackingData):
    log_info("🔵 [API] User tracking payload received")
    try:
        files_dir = pathlib.Path("./files")
        user_dir = files_dir / tracking_data.username
        
        user_dir.mkdir(parents=True, exist_ok=True)
        
        csv_file_path = user_dir / f"{tracking_data.session_name}.csv"
        with open(csv_file_path, 'w', encoding='utf-8') as f:
            f.write(tracking_data.csv_data)
        
        log_info(f"✅ [API] Tracking CSV saved to: {csv_file_path}")
        
        code_file_path = None
        if tracking_data.workspace_code is not None:
            code_file_path = user_dir / f"{tracking_data.session_name}_workspace.html"
            with open(code_file_path, 'w', encoding='utf-8') as f:
                f.write(tracking_data.workspace_code)
            log_info(f"✅ [API] Workspace code saved to: {code_file_path}")
        
        return {
            "success": True, 
            "message": f"Tracking data saved to {csv_file_path}"
                      + (f", workspace code saved to {code_file_path}" if code_file_path else ""),
            "csv_file_path": str(csv_file_path),
            "code_file_path": str(code_file_path) if code_file_path else None
        }
    except Exception as e:
        log_error(f"❌ [API] Failed to save tracking data: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to save tracking data: {str(e)}")


@app.post("/api/append-tracking-action")
async def append_tracking_action(action: TrackingActionAppend):
    """
    Append a single user action as a CSV row to the session file.
    - If the file does not exist, write the header first
    - Then append the action row
    """
    try:
        files_dir = pathlib.Path("./files")
        user_dir = files_dir / action.username
        user_dir.mkdir(parents=True, exist_ok=True)

        file_path = user_dir / f"{action.session_name}.csv"

        headers = [
            'ID','Timestamp','DateTime','ActionType','UserName','SessionId','Message','MessageMode','CardId','CardTitle',
            'ElementXPath','ElementTag','DrawingData','CodeContent','Mode','PreviousValue','NewValue','Duration',
            'CoordinatesX','CoordinatesY','Metadata'
        ]

        from datetime import datetime
        def format_dt(ts: int) -> str:
            return datetime.fromtimestamp(ts/1000).strftime('%Y-%m-%d %H:%M:%S')

        d = action.details or {}
        drawing_marker = '[drawing data]' if (getattr(d, 'drawingData', None)) else ''
        code_marker = '[]' if (getattr(d, 'codeContent', None)) else ''
        coord_x = (d.coordinates or {}).get('x') if hasattr(d, 'coordinates') and d.coordinates else ''
        coord_y = (d.coordinates or {}).get('y') if hasattr(d, 'coordinates') and d.coordinates else ''
        metadata_str = ''
        if hasattr(d, 'metadata') and d.metadata:
            import json
            metadata_str = json.dumps(d.metadata, ensure_ascii=False)

        def esc(v: str) -> str:
            if v is None:
                return ''
            s = str(v)
            if any(c in s for c in [',','"','\n']):
                s = '"' + s.replace('"','""') + '"'
            return s

        row = [
            esc(action.id),
            esc(action.timestamp),
            esc(format_dt(action.timestamp)),
            esc(action.actionType),
            esc(action.userName),
            esc(getattr(d, 'sessionId', '')),
            esc(getattr(d, 'message', '')),
            esc(getattr(d, 'messageMode', '')),
            esc(getattr(d, 'cardId', '')),
            esc(getattr(d, 'cardTitle', '')),
            esc(getattr(d, 'elementXPath', '')),
            esc(getattr(d, 'elementTag', '')),
            esc(drawing_marker),
            esc(code_marker),
            esc(getattr(d, 'mode', '')),
            esc(getattr(d, 'previousValue', '')),
            esc(getattr(d, 'newValue', '')),
            esc(getattr(d, 'duration', '')),
            esc(coord_x),
            esc(coord_y),
            esc(metadata_str),
        ]

        file_exists = file_path.exists()
        with open(file_path, 'a', encoding='utf-8') as f:
            if not file_exists:
                f.write(','.join(headers) + '\n')
            f.write(','.join(map(str, row)) + '\n')

        log_info(f"✅ [API] Appended action to: {file_path}")
        return {"success": True, "file_path": str(file_path)}
    except Exception as e:
        log_error(f"❌ [API] Failed to append tracking data: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to append tracking data: {str(e)}")



dist_dir = pathlib.Path(__file__).parent.parent.parent / "front" / "dist"
index_html_path = dist_dir / "index.html"

@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    """
    SPA fallback routing:
    - If the request is an API path, return 404
    - If the request is a static asset, try to serve the file
    - Otherwise return index.html to let the frontend router handle it
    """
    if full_path.startswith("api/"):
        raise HTTPException(status_code=404, detail="API endpoint not found")
    
    file_path = dist_dir / full_path
    
    if file_path.is_file():
        return FileResponse(file_path)
    
    if file_path.is_dir():
        index_path = file_path / "index.html"
        if index_path.is_file():
            return FileResponse(index_path)
    
    if index_html_path.is_file():
        return FileResponse(index_html_path)
    
    raise HTTPException(status_code=404, detail="Not found")

app.mount("/static", StaticFiles(directory=dist_dir), name="static_files")
# --------------------------------------

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
