# UI Remix

Supporting UI Design Through Interactive Example Retrieval and Remixing, IUI 2026

🏠 **[Project Page](https://uiremix.github.io/)**  

📄 **[IUI 2026 Paper — UI Remix](https://doi.org/10.1145/3742413.3789154)**  

🎥 **[IUI 2026 Video](https://youtu.be/Yl4PJWlXizE)**  

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://www.apache.org/licenses/LICENSE-2.0)

# Description

Designing user interfaces (UIs) is a critical step when launching products, building portfolios, or personalizing projects, yet end users without design expertise often struggle to articulate their intent and to trust design choices. Existing example-based tools either promote broad exploration, which can cause overwhelm and design drift, or require adapting a single example, risking design fixation. We present UI Remix, an interactive system that supports mobile UI design through an example-driven design workflow. Powered by a multimodal retrieval-augmented generation (MMRAG) model, UI Remix enables iterative search, selection, and adaptation of examples at both the global (whole interface) and local (component) level. To foster trust, it presents source transparency cues such as ratings, download counts, and developer information. In an empirical study with 24 end users, UI Remix significantly improved participants' ability to achieve their design goals, facilitated effective iteration, and encouraged exploration of alternative designs. Participants also reported that source transparency cues enhanced their confidence in adapting examples. Our findings suggest new directions for AI-assisted, example-driven systems that empower end users to design with greater control, trust, and openness to exploration.

# Tech Stack


| Layer     | Technologies                                                                                                      |
| --------- | ----------------------------------------------------------------------------------------------------------------- |
| Frontend  | React 19, TypeScript, Vite 6, React Router 7, Redux Toolkit, Ant Design 5, Tailwind CSS 4, daisyUI, Monaco Editor |
| Backend   | Python 3.12, FastAPI, Uvicorn                                                                                     |
| LLM       | OpenAI API (GPT-5, GPT-4o, GPT-4.1, o3, o4-mini, etc.), Anthropic API (Claude Sonnet 4, Claude 3.7/3.5 Sonnet)    |
| Retrieval | ChromaDB (persistent vector store), GUI-CLIP (`Jl-wei/guiclip-vit-base-patch32`), PyTorch                         |

<img src="rag_pipeline.png" width="80%">


# Getting Started

## Step 1: Clone the repository

```bash
git clone https://github.com/eth-peach-lab/uiremix.git
cd uiremix
```

## Step 2: Set your API keys

```bash
export OPENAI_API_KEY=<your_openai_key>
export ANTHROPIC_API_KEY=<your_anthropic_key>
```

## Step 3: Prepare the UI screenshot dataset

Place UI screenshot folders under `server/data/`. Each folder should contain a `<name>.png` file representing the UI screenshot to be indexed.

## Step 4: Install dependencies and build the index

**Backend:**

```bash
cd server
pip install -r requirements.txt
python build.py
cd ..
```

**Frontend:**

```bash
cd front
npm install
npm run build
cd ..
```

## Step 5: Run the application

**Start the backend:**

```bash
cd server
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## Step 6: Access the application

Open `http://localhost:8000` in your browser.

# Project Structure

```
UI_Remix/
├── front/                    # Frontend (React + Vite)
│   ├── src/                  # Source code (components, store, routes, API)
│   ├── public/               # Static assets
│   ├── package.json
│   └── vite.config.ts
├── server/                   # Backend (FastAPI)
│   ├── app/
│   │   ├── main.py           # FastAPI entry point & SPA fallback
│   │   ├── configs.py        # Model list & global configuration
│   │   ├── talk/             # /api/chat & /api/baseline handlers
│   │   ├── generation/       # /api/generate — code generation logic
│   │   ├── retrieval/        # CLIP + ChromaDB retrieval
│   │   └── lm_commute/      # OpenAI & Anthropic client wrappers
│   ├── build.py              # Build ChromaDB index from UI screenshots
│   ├── data/                 # UI screenshot dataset (not in git)
│   ├── chroma_db/            # Persistent ChromaDB storage (not in git)
│   ├── files/                # User tracking data output (not in git)
│   └── requirements.txt
└── .env                      # Environment variables (not in git)
```

# Citation

Junling Wang, Hongyi Lan, Xiaotian Su, Mustafa Doga Dogan, and April Yi Wang. 2026. UI Remix: Supporting UI Design Through Interactive Example Retrieval and Remixing. In Proceedings of the 31st International Conference on Intelligent User Interfaces (IUI '26), pages 376–392, New York, NY, USA. Association for Computing Machinery.

```bibtex
@inproceedings{10.1145/3742413.3789154,
author = {Wang, Junling and Lan, Hongyi and Su, Xiaotian and Dogan, Mustafa Doga and Wang, April Yi},
title = {UI Remix: Supporting UI Design Through Interactive Example Retrieval and Remixing},
year = {2026},
isbn = {9798400719844},
publisher = {Association for Computing Machinery},
address = {New York, NY, USA},
url = {https://doi.org/10.1145/3742413.3789154},
doi = {10.1145/3742413.3789154},
booktitle = {Proceedings of the 31st International Conference on Intelligent User Interfaces},
pages = {376–392},
numpages = {17},
keywords = {Example-driven UI design, Multimodal retrieval-augmented generation, End-user design, UI example retrieval, Interactive design systems},
location = {Paphos, Cyprus},
series = {IUI '26},
abstract = {Designing user interfaces (UIs) is a critical step when launching products, building portfolios, or personalizing projects, yet end users without design expertise often struggle to articulate their intent and to trust design choices. Existing example-based tools either promote broad exploration, which can cause overwhelm and design drift, or require adapting a single example, risking design fixation. We present UI Remix, an interactive system that supports mobile UI design through an example-driven design workflow. Powered by a multimodal retrieval-augmented generation (MMRAG) model, UI Remix enables iterative search, selection, and adaptation of examples at both the global (whole interface) and local (component) level. To foster trust, it presents source transparency cues such as ratings, download counts, and developer information. In an empirical study with 24 end users, UI Remix significantly improved participants’ ability to achieve their design goals, facilitated effective iteration, and encouraged exploration of alternative designs. Participants also reported that source transparency cues enhanced their confidence in adapting examples. Our findings suggest new directions for AI-assisted, example-driven systems that empower end users to design with greater control, trust, and openness to exploration.}
}
```

---

This work is licensed under the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0).  
For research inquiries, please contact: Junling Wang — wangjun [at] ethz [dot] ch