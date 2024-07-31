# AI Chatbot Development with OpenAI - Assistant API

This project involves the development of an AI chatbot using the OpenAI Assistant API. The bot was trained with provided information and is designed to answer questions based on that content.

### Back-End
The back-end of this project includes several modules:
- **Express**: Used for hosting a server and developing routes to:
  - Create a thread
  - Send a message and receive the AI's response
  - Retrieve all chats
  - Delete specific chats
- **Prisma**: Connects to a MongoDB database to store all created threads, sent messages, and received responses.

### Front-End
The front-end was developed using React and is powered by Vite for efficient building and development.
