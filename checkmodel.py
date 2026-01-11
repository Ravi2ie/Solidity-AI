from google import generativeai as genai

genai.configure(api_key="reward_token_placeholder")

models = genai.list_models()
for m in models:
    print(m.name)
