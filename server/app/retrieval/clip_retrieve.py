# load Clip Model
import time
from typing import List
import chromadb
import numpy as np
import torch
import openai
import torch.nn as nn
import torch.nn.functional as F
from transformers import CLIPProcessor, CLIPModel, CLIPTokenizer
from collections import Counter

from app.logger_config import get_logger, log_info, log_error, log_warning


logger = get_logger()

# Initialize device and ChromaDB client
device = "cuda" if torch.cuda.is_available() else "cpu"
device = torch.device(device)
chroma_client = chromadb.PersistentClient(path="./chroma_db")

# load model
clip_model_name = "Jl-wei/guiclip-vit-base-patch32"
clip_model = CLIPModel.from_pretrained(
    clip_model_name, 
    local_files_only=True
).to(device)
processor = CLIPProcessor.from_pretrained(
    clip_model_name, 
    local_files_only=True
)
tokenizer = CLIPTokenizer.from_pretrained(
    clip_model_name, 
    local_files_only=True
)

# load collections
img_collection = chroma_client.get_collection("img_embeddings")
features = ["aesthetic", "background", "compositions", "component", "content", "layout", "role"]
client = openai.OpenAI()

def get_clip_text_embedding(query: str) -> np.ndarray:
    """
    Get the CLIP text embedding for a given query.
    """
    query_clip_embedding = processor(text=[query], return_tensors="pt", padding=True, truncation=True).to(device)
    with torch.no_grad():
        text_embedding = clip_model.get_text_features(**query_clip_embedding)
        text_embedding = F.normalize(text_embedding, p=2, dim=-1)
    return text_embedding.cpu().numpy()[0]

def get_clip_text_embeddings(queries: List[str]) -> np.ndarray:
    """
    Get the CLIP text embeddings for multiple queries at once.
    """
    query_clip_embeddings = processor(text=queries, return_tensors="pt", padding=True, truncation=True).to(device)
    with torch.no_grad():
        text_embeddings = clip_model.get_text_features(**query_clip_embeddings)
        text_embeddings = F.normalize(text_embeddings, p=2, dim=-1)
    return text_embeddings.cpu().numpy()

def get_openai_query_embedding(query: str, model="text-embedding-3-large"):
    """
    Get OpenAI text embedding with comprehensive error handling.
    """
    log_info(f"🔵 [OpenAI Embedding] Starting text embedding request - model: {model}")
    log_info(f"📝 [OpenAI Embedding] Query length: {len(query)} characters")
    
    try:
        log_info("🔄 [OpenAI Embedding] Sending request to OpenAI Embedding API...")
        response = client.embeddings.create(
            input=query,
            model=model
        )
        
        embedding = np.array(response.data[0].embedding)
        log_info(f"✅ [OpenAI Embedding] Embedding received, shape: {embedding.shape}")
        return embedding
        
    except openai.AuthenticationError as e:
        log_error(f"🔑 [OpenAI Embedding] Authentication error - invalid/expired API key: {e}")
        print("\n❌ OpenAI Embedding API authentication failed:")
        print(f"   Details: {e}")
        print("   Please check whether your API key is correct")
        raise ValueError(f"OpenAI Embedding API authentication failed: {e}")
        
    except openai.RateLimitError as e:
        log_error(f"🚫 [OpenAI Embedding] Rate limit error: {e}")
        print("\n⚠️  OpenAI Embedding API rate limited:")
        print(f"   Details: {e}")
        print("   Please retry later or check your quota/usage")
        raise ValueError(f"OpenAI Embedding API rate limited: {e}")
        
    except openai.APIConnectionError as e:
        log_error(f"🌐 [OpenAI Embedding] Network error - cannot reach OpenAI servers: {e}")
        print("\n🌐 OpenAI Embedding API connection failed:")
        print(f"   Details: {e}")
        print("   Please check your network connection or retry later")
        raise ValueError(f"OpenAI Embedding API connection failed: {e}")
        
    except openai.APITimeoutError as e:
        log_error(f"⏰ [OpenAI Embedding] Request timed out: {e}")
        print("\n⏰ OpenAI Embedding API timeout:")
        print(f"   Details: {e}")
        print("   Please retry later")
        raise ValueError(f"OpenAI Embedding API timeout: {e}")
        
    except openai.BadRequestError as e:
        log_error(f"📝 [OpenAI Embedding] Bad request - invalid parameters: {e}")
        print("\n📝 OpenAI Embedding API request error:")
        print(f"   Details: {e}")
        print("   Please check the model name and input text")
        raise ValueError(f"OpenAI Embedding API request error: {e}")
        
    except openai.InternalServerError as e:
        log_error(f"🔧 [OpenAI Embedding] Server error - OpenAI service unavailable: {e}")
        print("\n🔧 OpenAI Embedding server error:")
        print(f"   Details: {e}")
        print("   OpenAI service may be temporarily unavailable; please retry later")
        raise ValueError(f"OpenAI Embedding server error: {e}")
        
    except Exception as e:
        log_error(f"❌ [OpenAI Embedding] Unknown error: {e}")
        print("\n❌ OpenAI Embedding API call failed with an unknown error:")
        print(f"   Error type: {type(e).__name__}")
        print(f"   Details: {e}")
        raise ValueError(f"OpenAI Embedding API call failed: {e}")

def global_retrieve(query: str, n_results: int = 20):
    query_clip_embedding = get_clip_text_embedding(query)
    
    img_collection = chroma_client.get_collection("img_embeddings")
    img_retrieved = img_collection.query(
        query_embeddings=[query_clip_embedding],
        n_results=n_results,
        include=["metadatas", "distances"]
    )

    img_webs = [meta["web"] for meta in img_retrieved["metadatas"][0]]

    retrieved_webs = dict()
    for x, web in enumerate(img_webs):
        if web not in retrieved_webs:
            retrieved_webs[web] = 0
        retrieved_webs[web] += (len(img_webs) - x) * 10
    
    ranked_webs = sorted(retrieved_webs.keys(), key=lambda x: retrieved_webs[x], reverse=True)
    ranked_webs
    return ranked_webs[:n_results]

def specific_retrieve(query: str, n_results: int =10, field_weight: int = 2, component_weight: int = 2) -> List[str]:
    # add text to improve quality
    query = "Modern UI Design: " + query
    img_embedding = get_clip_text_embedding(query)

    retrieved_webs = dict()
    img_collection = chroma_client.get_collection("img_embeddings")

    img_retrieved = img_collection.query(
        query_embeddings=[img_embedding],
        n_results=n_results * field_weight,
        include=["metadatas", "distances"]
    )
    img_webs = [meta["web"] for meta in img_retrieved["metadatas"][0]]
    for web_i, web in enumerate(img_webs):
        if web not in retrieved_webs:
            retrieved_webs[web] = 0
        retrieved_webs[web] += len(img_webs) - web_i
    
    retrieved_webs = sorted(retrieved_webs.items(), key=lambda x: x[1], reverse=True)
    retrieved_webs = [x[0] for x in retrieved_webs]
    
    return retrieved_webs[:n_results]
