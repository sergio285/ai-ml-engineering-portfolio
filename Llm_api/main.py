import requests


OLLAMA_URL = "http://localhost:11434/api/chat"
MODEL = "gemma3:4b"


def chat(messages: list[dict], user_message: str) -> str:
    """Send a user message to the Ollama model and return its reply.

    Appends both the user message and the assistant reply to ``messages``
    so the conversation history is preserved between calls.

    Args:
        messages: Conversation history, modified in place.
        user_message: The text typed by the user.

    Returns:
        The assistant's response text.
    """

    # Add USER
    messages.append({
        "role": "user",
        "content": user_message
    })

    # Request → Ollama
    response = requests.post(
        OLLAMA_URL,
        json={
            "model": MODEL,
            "messages": messages,
            "stream": False
        }
    )

    response.raise_for_status()

    # JSON → Python
    data = response.json()

    # Get response
    assistant_message = data["message"]["content"]

    # Save ASSISTANT
    messages.append({
        "role": "assistant",
        "content": assistant_message
    })

    return assistant_message


def main():
    """Run an interactive chat loop in the terminal.

    Asks for the agent's system instruction, then keeps prompting the user
    for messages until they type ``exit``.
    """

    agent = input("Enter the agent instruction (leave empty for no custom instructions): ")

    messages = [
        {
            "role": "system",
            "content": agent
        }
    ]

    while True:

        user_message = input("You: ")

        if user_message.lower() == "exit":
            break

        answer = chat(messages, user_message)

        print(f"AI: {answer}")


if __name__ == "__main__":
    main()