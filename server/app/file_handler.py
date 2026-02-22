"""
File handling utilities.
"""
from fastapi import UploadFile, Request
from typing import List, Dict, Any, Optional, Union, Tuple
import json
import re

from app.tools import extract_pdf_text
from app.schema import FileData, FileInfo

async def process_file(file: UploadFile) -> Tuple[str, str]:
    """
    Process a single uploaded file and return its content and format.
    
    Args:
        file: FastAPI UploadFile object
        
    Returns:
        Tuple[str, str]: (file content, file format)
    """
    if file.filename is not None:
        file_format = file.filename.split(".")[-1].lower()
    else:
        file_format = "unknown"
    file_content = await file.read()
    
    if file_format == "pdf":
        text_content = extract_pdf_text(file_content)
    elif file_format in ["txt", "md", "json", "html", "css", "js", "py"]:
        text_content = file_content.decode("utf-8")
    else:
        text_content = f"Unsupported file format: {file_format}"
    
    return text_content, file_format

async def extract_files_from_form(request: Request, file_prefix: str = "file_") -> List[FileData]:
    """
    Extract all files from a multipart form.
    
    Args:
        request: FastAPI request object
        file_prefix: file field prefix (default: "file_")
        
    Returns:
        List[FileData]: list of extracted file payloads
    """
    form = await request.form()
    files_data = []
    
    file_infos_str = str(form.get("fileInfos"))
    try:
        file_infos = json.loads(file_infos_str)
        file_infos = [FileInfo(**info) for info in file_infos]
        for file_info in file_infos:
            file_id = f"file_{file_info.index}"
            file_name = file_info.name
            if file_id in form:
                file = form[file_id]
                if isinstance(file, UploadFile):
                    content, format = await process_file(file)
                    files_data.append(FileData(
                        id=file_id,
                        name=file_name,
                        format=format,
                        content=content,
                        metadata=str(file_info.model_dump()), 
                    ))
    except (json.JSONDecodeError, ValueError):
        pass
    
    return files_data

async def get_file_contents(request: Request) -> List[FileData]:
    """
    Extract all file contents from a request (thin wrapper).
    
    Args:
        request: FastAPI request object
        
    Returns:
        List[FileData]: file payload list
    """
    files_data = await extract_files_from_form(request)
    return files_data
