from PIL import Image
from typing import List, Dict, Any, Optional, Tuple
from openai import AsyncOpenAI
import base64
import openai
import asyncio
import re
from pathlib import Path

from app.schema import LLMMessage, APIKeys
from app.logger_config import get_logger, log_info, log_error, log_warning

logger = get_logger()

CONFIG = {
    "model": "gpt-4o-mini",
    "temperature": 0.3,
    "max_retries": 3,
    "timeout": 30,
    "max_concurrent": 3,
    "image_extensions": [".jpg", ".jpeg", ".png", ".webp"],
}

INSTRUCTION = """
Please predict the starting and ending coordinates for the bounding box given a user query on the given images. You should output the coordinate in the format: [start_x, start_y, end_x, end_y]. The coordinate system starts from the top-left corner of the image. The coordinates should be integers.

Important guidelines:
1. Ensure coordinates are within the image boundaries (0 ≤ x < width, 0 ≤ y < height)
2. start_x should be less than end_x
3. start_y should be less than end_y
4. The bounding box should be meaningful and cover the relevant content
5. If no relevant content is found, return a box covering the center 20% of the image
6. Output ONLY the coordinates in the format [start_x, start_y, end_x, end_y]
7. Do not include any explanation or additional text
"""

PROMPT_TEMPLATE = """
Query: {user_query}

Image dimensions: {width} x {height}

Please identify the most relevant region in the image based on the query and provide precise bounding box coordinates.
"""


def encode_image(image_path: str) -> Tuple[str, int, int]:
    """Encode image to base64 string and return dimensions with error handling"""
    try:
        image_path = Path(image_path)
        if not image_path.exists():
            raise FileNotFoundError(f"Image file not found: {image_path}")
        
        if image_path.suffix.lower() not in CONFIG["image_extensions"]:
            raise ValueError(f"Unsupported image format: {image_path.suffix}")
        
        with Image.open(image_path) as img:
            if img.mode != 'RGB':
                img = img.convert('RGB')
            width, height = img.size
            
        with open(image_path, "rb") as image_file:
            encoded = base64.b64encode(image_file.read()).decode('utf-8')
            
        log_info(f"✅ Image encoded: {image_path} ({width}x{height})")
        return encoded, width, height
        
    except Exception as e:
        log_error(f"❌ Failed to encode image: {image_path} - {e}")
        raise


def validate_coordinates(coords: List[int], width: int, height: int) -> List[int]:
    """Validate and clamp coordinates to image bounds."""
    if len(coords) != 4:
        raise ValueError(f"Invalid coordinate count: expected 4, got {len(coords)}")
    
    start_x, start_y, end_x, end_y = coords
    
    start_x = max(0, min(start_x, width - 1))
    start_y = max(0, min(start_y, height - 1))
    end_x = max(0, min(end_x, width - 1))
    end_y = max(0, min(end_y, height - 1))
    
    if start_x >= end_x:
        start_x, end_x = max(0, end_x - 1), min(width - 1, start_x + 1)
    if start_y >= end_y:
        start_y, end_y = max(0, end_y - 1), min(height - 1, start_y + 1)
    
    min_size = 10
    if end_x - start_x < min_size:
        center_x = (start_x + end_x) // 2
        start_x = max(0, center_x - min_size // 2)
        end_x = min(width - 1, start_x + min_size)
    
    if end_y - start_y < min_size:
        center_y = (start_y + end_y) // 2
        start_y = max(0, center_y - min_size // 2)
        end_y = min(height - 1, start_y + min_size)
    
    return [start_x, start_y, end_x, end_y]


def parse_coordinates(llm_result: str, width: int, height: int) -> List[List[int]]:
    """Parse coordinate string into bounding box format with enhanced validation"""
    try:
        result = re.sub(r'[^\d,\-\[\]]', '', llm_result.strip())
        result = result.strip('[]')
        
        coords = []
        for coord_str in result.split(','):
            coord_str = coord_str.strip()
            if coord_str:
                coords.append(int(coord_str))
        
        if len(coords) != 4:
            raise ValueError(f"Invalid coordinate count: expected 4, got {len(coords)}")
        
        validated_coords = validate_coordinates(coords, width, height)
        
        return [validated_coords[:2], validated_coords[2:]]  # [[start_x, start_y], [end_x, end_y]]
        
    except Exception as e:
        log_warning(f"⚠️ Failed to parse coordinates: {e}; using fallback box")
        center_x, center_y = width // 2, height // 2
        box_width, box_height = width // 5, height // 5
        return [
            [center_x - box_width, center_y - box_height],
            [center_x + box_width, center_y + box_height]
        ]


def generate_fallback_box(width: int, height: int) -> List[List[int]]:
    """Generate a reasonable fallback bounding box."""
    margin_x = width // 10
    margin_y = height // 10
    return [
        [margin_x, margin_y],
        [width - margin_x, height - margin_y]
    ]


async def generate_box_with_retry(
    user_query: str, 
    image: str, 
    width: int, 
    height: int, 
    api_keys: APIKeys,
    retry_count: int = 0
) -> List[List[int]]:
    """Bounding box generation with retries."""
    client = AsyncOpenAI(
        api_key=api_keys.openai,
        timeout=CONFIG["timeout"]
    )
    
    messages = [
        {"role": "developer", "content": INSTRUCTION},
        {"role": "user", "content": [
            {"type": "text", "text": PROMPT_TEMPLATE.format(user_query=user_query, width=width, height=height)}, 
            {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image}"}},
        ]},
    ]

    try:
        response = await client.chat.completions.create(
            model=CONFIG["model"],
            messages=messages, 
            temperature=CONFIG["temperature"],
            max_tokens=50,
        )
        
        result = response.choices[0].message.content
        if not result:
            raise ValueError("API returned an empty response")
            
        box = parse_coordinates(result.strip(), width, height)
        log_info(f"✅ Bounding box generated: {box}")
        return box
        
    except (openai.AuthenticationError, openai.RateLimitError) as e:
        error_msg = f"OpenAI API error (non-retriable): {type(e).__name__} - {e}"
        log_error(error_msg)
        raise ValueError(error_msg)
        
    except (openai.APITimeoutError, openai.APIConnectionError, 
            openai.InternalServerError) as e:
        if retry_count < CONFIG["max_retries"]:
            log_warning(f"⚠️ OpenAI API error; retrying ({retry_count + 1}/{CONFIG['max_retries']}): {e}")
            await asyncio.sleep(2 ** retry_count)
            return await generate_box_with_retry(user_query, image, width, height, api_keys, retry_count + 1)
        else:
            error_msg = f"OpenAI API error (retries exhausted): {type(e).__name__} - {e}"
            log_error(error_msg)
            raise ValueError(error_msg)
            
    except Exception as e:
        if retry_count < CONFIG["max_retries"]:
            log_warning(f"⚠️ Bounding box generation failed; retrying ({retry_count + 1}/{CONFIG['max_retries']}): {e}")
            await asyncio.sleep(1)
            return await generate_box_with_retry(user_query, image, width, height, api_keys, retry_count + 1)
        else:
            error_msg = f"Bounding box generation failed (retries exhausted): {e}"
            log_error(error_msg)
            raise ValueError(error_msg)


async def generate_box(user_query: str, image: str, width: int, height: int, api_keys: APIKeys) -> List[List[int]]:
    """Generate bounding box using OpenAI Vision API with enhanced error handling"""
    log_info(f"🔵 Generate bounding box - query: {user_query}, size: {width}x{height}")
    
    try:
        return await generate_box_with_retry(user_query, image, width, height, api_keys)
    except Exception as e:
        log_warning(f"⚠️ Bounding box generation failed; using fallback box: {e}")
        return generate_fallback_box(width, height)


async def generate_boxes(
    user_query: str, 
    retrieved_result: List[str], 
    api_keys: APIKeys, 
    max_concurrent: Optional[int] = None
) -> List[List[List[int]]]:
    """Generate multiple boxes from a list of images in parallel with enhanced error handling"""
    if not retrieved_result:
        log_warning("⚠️ No retrieval results; returning an empty bounding box list")
        return []
    
    max_concurrent = max_concurrent or CONFIG["max_concurrent"]
    log_info(f"🔵 Batch bounding box generation - images: {len(retrieved_result)}, concurrency: {max_concurrent}")
    
    semaphore = asyncio.Semaphore(max_concurrent)
    
    async def process_image(ui: str) -> List[List[int]]:
        async with semaphore:
            try:
                for ext in CONFIG["image_extensions"]:
                    image_path = f"./data/{ui}/{ui}{ext}"
                    if Path(image_path).exists():
                        image, width, height = encode_image(image_path)
                        return await generate_box(user_query, image, width, height, api_keys)
                
                raise FileNotFoundError(f"Image file not found: {ui}")
                
            except Exception as e:
                log_warning(f"⚠️ Failed to process image {ui}; using fallback box: {e}")
                try:
                    for ext in CONFIG["image_extensions"]:
                        image_path = f"./data/{ui}/{ui}{ext}"
                        if Path(image_path).exists():
                            with Image.open(image_path) as img:
                                return generate_fallback_box(img.width, img.height)
                except:
                    pass
                
                return [[50, 50], [350, 250]]
    
    try:
        tasks = [process_image(ui) for ui in retrieved_result]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        final_results = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                log_error(f"❌ Image processing error for {retrieved_result[i]}: {result}")
                final_results.append([[50, 50], [350, 250]])
            else:
                final_results.append(result)
        
        log_info(f"✅ Batch bounding box generation complete - success: {len([r for r in results if not isinstance(r, Exception)])}/{len(results)}")
        return final_results
        
    except Exception as e:
        log_error(f"❌ Batch bounding box generation failed: {e}")
        return [[[50, 50], [350, 250]] for _ in retrieved_result]
