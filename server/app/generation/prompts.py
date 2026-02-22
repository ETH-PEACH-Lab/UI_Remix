import os
import json
from typing import List, Tuple

from app.configs import get_config
from app.schema import ChatMessage, WorkPlaceItem

def get_generate_instruction() -> str:
    """
    Generate an instruction for code generation based on the provided code and chat history.
    """
    instruction = """
    You are a Mobile UI generate assistant. You are responsible for generating UI pages based on users' requirements and given designs.

    You will see the original code, the reference UI screenshots and the instructions given by the users, which shows you how to modify the original code with some given designs.

    The original code is the code of the UI page that you need to modify. Your generation should be based on the original code.

    The reference UI screenshot is the screenshots of the reference UI that you can refer to. This UI is chosen by the user to refer to during the generation. There maybe a red mark on the reference UI screenshots to indicate which part of the UI should be referred to during the generation.

    There are two kinds of requests:
    - Global Generation: If the target area is "global", then it refers to the global generation mode. The request that asks you to change the whole UI page. The requirements are applied to the whole UI page. 

    - Specific Generation: If the target area is not "global", then it refers to the specific generation mode. The request that asks you to change a specific part of the UI page, the target area of the modification is the html code of a tag in the UI page. The requirements are applied to the specific part of the UI page. 
    
    Some rules you should follow:
    - Please give each tag a unique id.
    - You should only generate the new code without any comments.
    - Please balance the speed and quality of the code. Please do not think too much about the code.
    - Generate the complete code instead of just the modified parts. The generated code should be a valid HTML document.
    - Do not include any markdown formatting (e.g., no triple backticks like ```html).
    - For Specific Generation, you should only modify the target tag in the original code according to the requirements and the new UI page. You should keep the rest of the code unchanged.
    - During the generation, you should not copy the code from the new UI page directly (but you can copy the original code). Instead, you should adapt the new UI page to the original code. You should replace all images and text with the content provided in the original code.
    - Please make sure you generate the complete code instead of just the modified parts.
    
    Output example:
    <html>
    </html>
    """
    return instruction.strip()

def get_generate_prompt(code: str, chat_history: List[ChatMessage], target_tag_and_code: Tuple[str]) -> str:
    """
    Generate the prompt for code generation based on code, chat history, retrieval web HTML, and file content.
    """
    target_tag = target_tag_and_code[0]
    target_tag_code = target_tag_and_code[1]
    users_request = [x for x in chat_history if x.sender == "user"][-1].content
    
    prompt = f"""
    Please generate code based on the following chat history, requirements and workplace.
    Original Code:
    {code}
    User's Instruction:
    {users_request}
    Target area:
    {target_tag}
    Target area code:
    {target_tag_code}

    - Please make sure you generate the complete code of a UI page instead of just the modified parts.
    """
    return prompt.strip()

def get_tag_prompt(code: str, chat_history: List[ChatMessage], target_tag_and_code: Tuple[str]) -> str:
    """
    Generate the prompt for code generation based on code, chat history, retrieval web HTML, and file content.
    """
    target_tag = target_tag_and_code[0]
    target_tag_code = target_tag_and_code[1]
    users_request = [x for x in chat_history if x.sender == "user"][-1].content
    
    prompt = f"""
    Please generate unified diff based on the following chat history, requirements.
    Original Code:
    {code}
    User's Demands:
    {users_request}
    Target area:
    {target_tag}
    Target area code:
    {target_tag_code}
    """
    return prompt.strip()

def get_tag_instruction() -> str:
    """
    Generate the instruction for code generation based on code, chat history, retrieval web HTML, and file content.
    """
    instruction = f"""
    You are a Mobile UI generation assistant. Your task is to update specific parts of a UI page based on the original code, users' demands, reference UI screenshots (may include red marks indicating the focus area), and the user’s modification instructions.

    Context
    - Original code: the full UI page code that you will modify.
    - Users' Demands: the requirements given by the user.
    - Reference UI: screenshots chosen by the user for guidance. There may be a red mark on the reference UI screenshots to indicate which part of the UI should be referred to during the generation. You should refer to that part and meet the user's requirements.
    - Target area: a specific HTML tag in the original code that must be modified according to the user’s request. Only this tag should change; the rest of the code must stay the same.

    Rules
    - Assign a unique id to every tag.
    - Output must be a unified diff between a/new.html and b/new.html.
    - Wrap the diff with ```diff … ```.
    - Only output the diff (no comments).
    - Adapt the marked part of the UI design to the original code
    - Preserve original text and images unless specified.
    - Keep a balance between speed and quality; do not over-optimize.
    
    Output example:
    ```diff
    --- a/new.html
    +++ b/new.html
    @@ -1,1 +1,1 @@
    -<html>
    +<html>
    ```
    """
    return instruction.strip()