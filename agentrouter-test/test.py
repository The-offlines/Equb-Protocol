from openai import OpenAI

client = OpenAI(
    api_key="sk-UHPXiY9qfk7Hl7mGBiGHrvqyDqQeVjT130fb4KGQtmj5KqJ2",
    base_url="https://agentrouter.org/v1",
)

response = client.chat.completions.create(
    model="claude-3-5-sonnet",
    messages=[
        {"role": "user", "content": "Reply with exactly: OK"}
    ],
)

print(response.choices[0].message.content)