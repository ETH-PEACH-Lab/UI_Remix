import os
from fastapi import Request
from typing import List, Dict, Any, Optional
import json

from app.schema import GlobalRetrievalResponse, SpecificRetrievalResponse, GlobalWeb, SpecificWeb,APIKeys
from app.retrieval.clip_retrieve import global_retrieve, specific_retrieve
from app.generation.box_generation import generate_boxes


async def handle_global_retrieve(
    request: Request,
) -> GlobalRetrievalResponse:
    """
    Retrieve relevant content from global webs.
    """
    form = await request.form()

    retrieval_query = str(form.get("retrieveInput"))
    references = str(form.get("globalWebs"))
    references = json.loads(references)
    references = [GlobalWeb(**web) for web in references] if references else []
    
    retrieved_result = global_retrieve(retrieval_query, 10)
    print(retrieved_result)
    return GlobalRetrievalResponse(
        retrievalResult=retrieved_result, 
    )

async def handle_specific_retrieve(
    request: Request,
) -> SpecificRetrievalResponse:
    """
    Retrieve relevant content from specific webs.
    """
    form = await request.form()

    retrieval_query = str(form.get("retrieveInput"))
    selected_tag = str(form.get("selectedTag"))
    api_keys = APIKeys(
        openai=os.getenv("OPENAI_API_KEY")
    )

    retrieval_result = specific_retrieve(retrieval_query, 6)

    # retrieval_boxes = await generate_boxes(retrieval_query, retrieval_result, api_keys)
    retrieval_boxes = [[[0, 0], [0, 0]] for _ in range(len(retrieval_result))]

    result = SpecificRetrievalResponse(
        retrievalResult=retrieval_result, 
        retrievalBox=retrieval_boxes
    )
    print(result)

    return result