# Load embeddings and write them into local ChromaDB.

# import library
import tqdm
from PIL import Image
import os
import re
import numpy as np
import pandas as pd
from typing import List
import json
from bs4 import BeautifulSoup

import chromadb

import torch
import torch.nn as nn
import torch.nn.functional as F
from transformers import CLIPProcessor, CLIPModel, CLIPTokenizer

device = "cuda" if torch.cuda.is_available() else "cpu"
device = torch.device(device)

# load model
import openai
clip_model_name = "Jl-wei/guiclip-vit-base-patch32"
clip_model = CLIPModel.from_pretrained(
    clip_model_name, 
).to(device)
processor = CLIPProcessor.from_pretrained(
    clip_model_name, 
)
tokenizer = CLIPTokenizer.from_pretrained(
    clip_model_name, 
)

# create chroma client
chroma_client = chromadb.PersistentClient(path="./chroma_db")

# build embedding
webs = os.listdir("data")

def get_clip_image_embedding(image_path):
    image = Image.open(image_path)
    image = processor(images=image, return_tensors="pt", padding=True).to(device)
    image_embeddings = clip_model.get_image_features(**image)
    return image_embeddings

chroma_client.delete_collection("img_embeddings")
img_collection = chroma_client.create_collection("img_embeddings", metadata={"hnsw:space": "cosine"})

for ui in os.listdir("./data"):
    ui = str(ui)
    img_path = os.path.join("data", ui, ui + ".png")
    img_embedding = get_clip_image_embedding(img_path)
    img_embedding = img_embedding.detach().cpu().numpy()

    img_collection.add(
        embeddings=img_embedding,
        metadatas=[{"web": ui}],
        ids=[ui]
    )
    